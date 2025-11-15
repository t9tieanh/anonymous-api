import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import googleAuthService from '../services/utils/googleAuth.service'
import sendResponse from '../dto/response/send-response'
import ApiError from '../middleware/ApiError'

class AuthController {
  async login(req: Request, res: Response) {
    try {
      // lấy authorization code
      const code = req.query.code as string

      if (!code) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Không tìm thấy authorization code !')
      }

      const result = await googleAuthService.loginGoogle({ code })

      sendResponse(res, {
        code: StatusCodes.OK,
        message: 'Xác thực google thành công !',
        result: result
      })
    } catch (err: any) {
      throw new ApiError(StatusCodes.BAD_REQUEST, err.message || 'Đăng nhập Google thất bại !, vui lòng thử lại')
    }
  }
}

export default new AuthController()
