import { StatusCodes } from 'http-status-codes'
import multer, { FileFilterCallback } from 'multer'
import ApiError from '~/middleware/ApiError'
import path from 'path'
import { Request } from 'express'
import cloudinary from '~/config/cloudinary'
import { UploadApiResponse } from 'cloudinary'

/**
 * Multer config: Lưu file vào RAM (buffer) và lọc các loại file được hỗ trợ
 * Hỗ trợ: PDF, DOCX, DOC
 */
export const uploadFile = multer({
  storage: multer.memoryStorage(), // Lưu vào RAM để upload lên Cloudinary
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase()

    // Chỉ chấp nhận file PDF, DOCX, DOC và MD
    if (!['.pdf', '.docx', '.doc', '.md'].includes(ext)) {
      return cb(new ApiError(StatusCodes.BAD_REQUEST, 'Loại file không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, DOC, MD'))
    }

    cb(null, true)
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // Giới hạn 50MB
  }
})

/**
 * Upload file lên Cloudinary
 * @param fileBuffer - Buffer của file cần upload
 * @param originalFilename - Tên file gốc (để lấy extension)
 * @param folder - Thư mục trên Cloudinary (mặc định: 'hackathon-files')
 * @returns Promise<UploadApiResponse> - Thông tin file đã upload
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  originalFilename: string,
  folder: string = 'hackathon-files'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    // Lấy tên file và extension
    const parsedPath = path.parse(originalFilename)
    let filenameWithoutExt = parsedPath.name
    const ext = parsedPath.ext.toLowerCase() // Giữ dấu chấm (.pdf, .docx, etc.)

    // Sanitize filename: loại bỏ ký tự đặc biệt, chỉ giữ chữ, số, dấu gạch ngang và gạch dưới
    filenameWithoutExt = filenameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_')

    // Tạo public_id với extension để đảm bảo extension được giữ nguyên
    // Sử dụng timestamp để tạo unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const publicId = `${folder}/${filenameWithoutExt}_${timestamp}_${randomId}${ext}`

    // Tạo upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', // Luôn dùng 'raw' cho documents (PDF, DOCX, DOC, MD)
        public_id: publicId, // Đặt public_id rõ ràng với extension
        access_mode: 'public', // Đảm bảo file có thể truy cập công khai (tránh lỗi 401)
        type: 'upload', // Đảm bảo file được upload đúng cách
        overwrite: false, // Không ghi đè file trùng tên
        invalidate: true // Xóa cache khi upload
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
        } else {
          resolve(result)
        }
      }
    )

    // Pipe buffer vào stream
    uploadStream.end(fileBuffer)
  })
}

/**
 * Xóa file từ Cloudinary
 * @param publicId - Public ID của file trên Cloudinary
 * @param resourceType - Loại resource
 * @returns Promise<object> - Kết quả xóa
 */
export const deleteFromCloudinary = (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<{ result: string }> => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

/**
 * Format kích thước file từ bytes sang định dạng dễ đọc
 * @param bytes - Kích thước tính bằng bytes
 * @returns string - Định dạng dễ đọc (ví dụ: "2.4 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
