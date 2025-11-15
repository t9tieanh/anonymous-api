/* eslint-disable @typescript-eslint/no-explicit-any */
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
  folder: string = 'hackathon-files',
  uploadPreset?: string
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
    const options: Parameters<typeof cloudinary.uploader.upload_stream>[0] = {
      resource_type: 'raw',
      type: 'upload',
      overwrite: false,
      invalidate: true
    }
    if (uploadPreset) {
      // Khi dùng unsigned upload preset, KHÔNG set public_id để tránh xung đột với
      // các rule như use_filename/unique_filename/folder do preset định nghĩa.
      ;(options as any).upload_preset = uploadPreset
      // Truyền tên file gốc để preset (với Use filename = true) lấy đúng tên
      const safeOriginal = `${filenameWithoutExt}${ext}`
      ;(options as any).filename_override = safeOriginal
    } else {
      // Không dùng preset -> kiểm soát đầy đủ public_id và access_mode
      ;(options as any).public_id = publicId
      ;(options as any).access_mode = 'public'
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error || new Error('Upload failed'))
      } else {
        resolve(result)
      }
    })

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
