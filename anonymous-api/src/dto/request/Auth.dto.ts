import { TokenType } from '~/enums/tokenType.enum'
import { IsEmail } from 'class-validator'

// payload cho jwt token
export interface JwtPayloadDto {
  userId: string
  username: string
  tokenType: TokenType
}

// dùng cho Oauth2 với google
export interface GoogleOauthToken {
  access_token: string
  id_token: string
  expires_in: number
  refresh_token: string
  token_type: string
  scope: string
}

export interface GoogleUserResult {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

export class UpdateProfile {
  name?: string

  @IsEmail()
  email?: string
}
