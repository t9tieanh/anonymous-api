import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import qs from 'qs'
import { env } from '~/config/env'
import { UserModel } from '~/models/user.model'
import { SubjectModel } from '~/models/subject.model'
import subjectService from '../subject.service'
import { GoogleOauthToken, GoogleUserResult } from '~/dto/request/Auth.dto'
import ApiError from '~/middleware/ApiError'
import { GenerateSignature } from '~/utils/JwtUtil'
import { TokenType } from '~/enums/tokenType.enum'
import { scrapeUtexSubjects } from './utexScraper'

// function dùng để exchance token -> dùng authorization code
const getGoogleOauthToken = async ({ code }: { code: string }): Promise<GoogleOauthToken> => {
  const rootURl = 'https://oauth2.googleapis.com/token'

  const options = {
    code,
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT,
    grant_type: 'authorization_code'
  }
  try {
    const { data } = await axios.post<GoogleOauthToken>(rootURl, qs.stringify(options), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data
  } catch (err: any) {
    console.log('Failed to fetch Google Oauth Tokens', err)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Đăng nhập Google thất bại !, vui lòng thử lại')
  }
}

// lấy thông tin user ở google authorization server
async function getGoogleUser({
  id_token,
  access_token
}: {
  id_token: string
  access_token: string
}): Promise<GoogleUserResult> {
  try {
    const { data } = await axios.get<GoogleUserResult>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`
        }
      }
    )

    return data
  } catch (err: any) {
    console.log(err)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Đăng nhập Google thất bại !, vui lòng thử lại')
  }
}

const loginGoogle = async ({ code }: { code: string }) => {
  console.log('Đã vào')
  const { id_token, access_token } = await getGoogleOauthToken({ code })

  const userData = await getGoogleUser({
    id_token,
    access_token
  })

  // chỉ cho phép email sinh viên của HCMUTE
  if (
    !userData.email ||
    typeof userData.email !== 'string' ||
    !userData.email.toLowerCase().endsWith('@student.hcmute.edu.vn')
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ cho phép email có đuôi @student.hcmute.edu.vn')
  }

  // tìm kiếm user xem user này đã được onboard vào hệ thống chưa
  let user = await UserModel.findOne({ username: userData.email })

  // trường hợp user chưa được onboard vào hệ thống
  if (!user) {
    // Tạo user mới
    const newUser = new UserModel({
      email: userData.email,
      name: userData.name,
      image: userData.picture,
      username: userData.email
    })

    user = await newUser.save()
  }

  // scrape dữ liệu môn học từ UTEX (trả về danh sách tên)
  // Nếu scrape lỗi (ví dụ cookie hết hạn), vẫn cho đăng nhập bình thường
  try {
    const names = await scrapeUtexSubjects()
    const userIdObj = user._id as any
    const defaultColor = '#FFA500'

    for (const rawName of names) {
      const name = (rawName || '').trim()
      if (!name) continue

      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const existed = await SubjectModel.findOne({
        userId: userIdObj,
        name: { $regex: new RegExp(`^${escaped}$`, 'i') }
      })
      if (existed) continue

      await subjectService.createSubject(user.id as string, { name, color: defaultColor })
    }
  } catch (e) {
    console.log('Scrape UTEX failed, skip subject seeding:', e)
  }


  // trường hợp user đã onboard vào hệ thống -> trả thêm token
  return {
    valid: true,
    email: user.email,
    name: user.name,
    image: user.image,
    username: user.username,
    accessToken: await GenerateSignature({
      userId: user.id,
      username: user.username as string,
      tokenType: TokenType.ACCESS_TOKEN
    }),
    refreshToken: await GenerateSignature({
      userId: user.id,
      username: user.username as string,
      tokenType: TokenType.REFRESH_TOKEN
    })
  }
}

const googleAuthService = {
  loginGoogle
}

export default googleAuthService
