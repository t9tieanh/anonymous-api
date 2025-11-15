/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatusCodes } from 'http-status-codes'
import { FileModel, IFile } from '~/models/file.model'
import { SubjectModel } from '~/models/subject.model'
import { Quiz } from '~/models/quiz.model'
import ApiError from '~/middleware/ApiError'
import { uploadToCloudinary, deleteFromCloudinary, formatFileSize } from '~/utils/cloudinaryUtil'
import path from 'path'
import fs from 'fs'
import os from 'os'
import RabbitClient from '~/config/rabbitmq'
import { QueueNameEnum } from '~/enums/rabbitQueue.enum'
import { Types } from 'mongoose'
import { ObjectId } from 'mongodb'

import { summarizeText } from './summarize.service'
import { extractTextFromFile } from '~/utils/fileParser'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

/**
 * Interface cho file response
 */
interface FileResponse {
  id: string
  name: string
  subject: string
  uploadDate: string
  size: string
  sizeBytes: number
  mimeType: string
  summaryCount: number
  quizCount: number
  url: string
  metadata?: {
    pages?: number
    language?: string
  }
  summaryContent?: string
}

/**
 * Interface cho pagination response
 */
interface PaginationResponse {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

/**
 * Service xử lý logic nghiệp vụ cho File
 */
class FileService {
  /**
   * Lấy danh sách files theo subjectId với phân trang
   * @param userId - ID của user (owner)
   * @param subjectId - ID của subject
   * @param page - Số trang (default: 1)
   * @param limit - Số items mỗi trang (default: 20)
   */
  async getFilesBySubject(
    userId: string,
    subjectId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileResponse[]; pagination: PaginationResponse }> {
    // Kiểm tra subject có tồn tại và thuộc về user không
    const subject = await SubjectModel.findOne({
      _id: subjectId,
      userId: userId
    })

    if (!subject) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Subject không tồn tại hoặc không thuộc về bạn')
    }

    // Build query filter
    const filter = {
      subjectId: new Types.ObjectId(subjectId),
      status: 'ACTIVE'
    }

    // Đếm tổng số files
    const totalItems = await FileModel.countDocuments(filter)

    // Tính toán pagination
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit

    // Lấy files với pagination
    const files = await FileModel.find(filter)
      .sort({ uploadDate: -1 }) // Sắp xếp theo ngày upload mới nhất
      .skip(skip)
      .limit(limit)
      .lean()

    // Đếm số lượng summaries và quizzes cho mỗi file
    const filesWithCounts = await Promise.all(
      files.map(async (file) => {
        const quizCount = await Quiz.countDocuments({ fileId: file._id })

        return this.formatFileResponse(file as IFile, subject.name, quizCount)
      })
    )

    return {
      files: filesWithCounts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      }
    }
  }

  /**
   * Upload file mới
   * @param userId - ID của user
   * @param file - File từ multer
   * @param subjectId - ID của subject
   * @param createSummary - Có tạo summary không
   * @param generateQuiz - Có tạo quiz không
   * @param quizQuestions - Số câu hỏi quiz
   * @param quizDifficulty - Độ khó quiz
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    subjectId: string,
    createSummary: boolean = false,
    generateQuiz: boolean = false,
    quizQuestions: number = 10,
    quizDifficulty: string = 'Medium',
    uploadPreset?: string,
    name?: string,
    filePath?: string
  ) {
    // Kiểm tra subject có tồn tại và thuộc về user không
    const subject = await SubjectModel.findOne({
      _id: subjectId,
      userId: userId
    })

    if (!subject) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Subject không tồn tại hoặc không thuộc về bạn')
    }

    // Lấy extension của file
    const fileExtension = path.extname(file.originalname).toLowerCase()

    // Upload file lên Cloudinary với tên file gốc để giữ extension
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname, 'hackathon-files', uploadPreset)

    const newFile = await FileModel.create({
      name: name || file.originalname,
      type: fileExtension as '.docx' | '.doc' | '.pdf' | '.md',
      size: file.size,
      mimeType: file.mimetype,
      cloudinaryUrl: uploadResult.secure_url, // reuse field to store Cloudinary URL
      cloudinaryPublicId: uploadResult.public_id, // reuse field to store Cloudinary public_id
      subjectId: new Types.ObjectId(subjectId),
      status: 'ACTIVE',
      uploadDate: new Date(),
      summaryCount: 0,
      quizCount: 0
    })

    // Thêm file vào subject's children array
    await SubjectModel.findByIdAndUpdate(subjectId, {
      $push: { children: newFile._id }
    })

    // reference unused params to silence linter (processing may be handled async by RabbitMQ)
    void generateQuiz
    void quizQuestions
    void quizDifficulty

    // Decide processing: if createSummary requested, push job to RabbitMQ and return queued status.
    if (createSummary) {
      await RabbitClient.getInstance()
      const envelope = {
        type: 'file-process',
        payload: {
          fileId: (newFile._id as Types.ObjectId).toString(),
          cloudinaryUrl: newFile.cloudinaryUrl,
          userId,
          mimeType: newFile.mimeType || file.mimetype
        }
      }
      await RabbitClient.publish(QueueNameEnum.FILE_PROCESS, envelope)

      return {
        file: this.formatFileResponse(newFile, subject.name, 0),
        processing: { queued: true }
      }
    }

    // If no queue requested, do synchronous summarization (keep previous behavior)
    // If caller provided a filePath use it, otherwise write buffer to a temp file
    let extractedPath: string | undefined = filePath
    let createdTmp = false
    if (!extractedPath) {
      const tmpName = `${Date.now()}-${Math.random().toString(36).slice(2)}${fileExtension}`
      extractedPath = path.join(os.tmpdir(), tmpName)
      await fs.promises.writeFile(extractedPath, file.buffer)
      createdTmp = true
    }

    try {
      const text = await extractTextFromFile(extractedPath as string, file.mimetype)
      const { summary, aiMatchScore } = await summarizeText(text, GEMINI_API_KEY)

      if (createdTmp && extractedPath) fs.unlink(extractedPath, () => {})

      return {
        file: this.formatFileResponse(newFile, subject.name, 0),
        summary: {
          summary,
          aiMatchScore
        }
      }
    } catch (err) {
      if (createdTmp && extractedPath) fs.unlink(extractedPath, () => {})
      throw err
    }
  }

  /**
   * Lấy thông tin chi tiết của một file
   * @param userId - ID của user
   * @param fileId - ID của file
   */
  async getFileById(userId: string, fileId: string): Promise<FileResponse> {
    try {
      const file = await FileModel.findOne({
        _id: fileId,
        status: 'ACTIVE'
      }).lean()

      if (!file) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'File không tồn tại')
      }

      // Kiểm tra file có thuộc về user không (qua subject)
      const subject = await SubjectModel.findOne({
        _id: file.subjectId,
        userId: userId
      })

      // console.log('SUBJECT', subject)

      if (!subject) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập file này')
      }

      // Đếm số lượng quizzes
      const quizCount = await Quiz.countDocuments({ fileId: file._id })

      return this.formatFileResponse(file as IFile, subject.name, quizCount)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Nếu là ApiError thì ném lại, còn lỗi khác thì log và ném lỗi 500
      if (error instanceof ApiError) {
        throw error
      } else {
        console.error('Lỗi khi lấy file:', error)
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã xảy ra lỗi server')
      }
    }
  }

  /**
   * Xóa file
   * @param userId - ID của user
   * @param fileId - ID của file
   */
  async deleteFile(userId: string, fileId: string): Promise<void> {
    const file = await FileModel.findOne({
      _id: fileId,
      status: 'ACTIVE'
    })

    if (!file) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'File không tồn tại')
    }

    // Kiểm tra file có thuộc về user không
    const subject = await SubjectModel.findOne({
      _id: file.subjectId,
      userId: userId
    })

    if (!subject) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa file này')
    }

    // Xóa file trên Cloudinary nếu có public_id
    if (file.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(file.cloudinaryPublicId, 'raw')
      } catch {
        // ignore delete errors to avoid blocking user flow
      }
    }

    // Soft delete: đánh dấu status = DELETED
    await FileModel.findByIdAndUpdate(fileId, {
      status: 'DELETED'
    })

    // Xóa file khỏi subject's children array
    await SubjectModel.findByIdAndUpdate(file.subjectId, {
      $pull: { children: file._id }
    })

    // TODO: Xóa tất cả quizzes liên quan đến file này
    await Quiz.deleteMany({ fileId: fileId })
  }

  /**
   * Tìm kiếm files theo tên
   * @param userId - ID của user
   * @param query - Từ khóa tìm kiếm
   * @param page - Số trang
   * @param limit - Số items mỗi trang
   */
  async searchFiles(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileResponse[]; pagination: PaginationResponse }> {
    // Lấy tất cả subjects của user
    const subjects = await SubjectModel.find({ userId }).select('_id name').lean()
    const subjectIds = subjects.map((s) => s._id)
    const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]))

    // Build query filter với text search
    const filter: Record<string, unknown> = {
      subjectId: { $in: subjectIds },
      status: 'ACTIVE'
    }

    // Nếu có query, tìm kiếm theo tên file (case-insensitive)
    if (query && query.trim()) {
      filter.name = { $regex: query.trim(), $options: 'i' }
    }

    // Đếm tổng số files
    const totalItems = await FileModel.countDocuments(filter)

    // Tính toán pagination
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit

    // Lấy files với pagination
    const files = await FileModel.find(filter)
      .sort({ uploadDate: -1 }) // Sắp xếp theo ngày upload mới nhất
      .skip(skip)
      .limit(limit)
      .lean()

    // Đếm số lượng quizzes cho mỗi file
    const filesWithCounts = await Promise.all(
      files.map(async (file) => {
        const quizCount = await Quiz.countDocuments({ fileId: file._id })
        const subjectName = subjectMap.get(file.subjectId?.toString() || '') || 'Unknown'

        return this.formatFileResponse(file as IFile, subjectName, quizCount)
      })
    )

    return {
      files: filesWithCounts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      }
    }
  }

  /**
   * Lấy tất cả files của user (không cần subjectId)
   * @param userId - ID của user
   * @param page - Số trang
   * @param limit - Số items mỗi trang
   */
  async getAllFilesByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileResponse[]; pagination: PaginationResponse }> {
    // Convert userId string sang ObjectId
    const userObjectId = new Types.ObjectId(userId)

    // Lấy tất cả subjects của user
    const subjects = await SubjectModel.find({ userId: userObjectId }).select('_id name').lean()
    const subjectIds = subjects.map((s) => s._id)
    const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]))

    // Build query filter
    const filter: Record<string, unknown> = {
      subjectId: { $in: subjectIds },
      status: 'ACTIVE'
    }

    // Đếm tổng số files
    const totalItems = await FileModel.countDocuments(filter)

    // Tính toán pagination
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit

    // Lấy files với pagination
    const files = await FileModel.find(filter)
      .sort({ uploadDate: -1 }) // Sắp xếp theo ngày upload mới nhất
      .skip(skip)
      .limit(limit)
      .lean()

    // Đếm số lượng quizzes cho mỗi file
    const filesWithCounts = await Promise.all(
      files.map(async (file) => {
        const quizCount = await Quiz.countDocuments({ fileId: file._id })
        const subjectName = subjectMap.get(file.subjectId?.toString() || '') || 'Unknown'

        return this.formatFileResponse(file as IFile, subjectName, quizCount)
      })
    )

    return {
      files: filesWithCounts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      }
    }
  }

  /**
   * Format file data thành response format
   * @param file - File document
   * @param subjectName - Tên subject
   * @param quizCount - Số lượng quizzes
   */
  private formatFileResponse(file: IFile, subjectName: string, quizCount: number): FileResponse {
    return {
      id: (file._id as Types.ObjectId).toString(),
      name: file.name,
      subject: subjectName,
      uploadDate: file.uploadDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
      size: formatFileSize(file.size),
      sizeBytes: file.size,
      mimeType: file.mimeType || 'application/octet-stream',
      summaryCount: file.summaryCount || 0,
      quizCount: quizCount,
      url: file.cloudinaryUrl || '',
      metadata: {
        // TODO: Có thể thêm metadata khác nếu cần
        language: 'en'
      },
      summaryContent: file.summaryContent
    }
  }
}

export default new FileService()
