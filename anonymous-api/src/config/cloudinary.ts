import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'

/**
 * Cấu hình Cloudinary với thông tin từ .env
 * Cloudinary sẽ được sử dụng để upload và quản lý files (PDF, DOCX, etc.)
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
})

export default cloudinary
