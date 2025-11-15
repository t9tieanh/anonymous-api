import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import fileService from '~/services/file.service'
import sendResponse from '~/dto/response/send-response'
import ApiError from '~/middleware/ApiError'

/**
 * Controller xử lý các HTTP requests liên quan đến File
 */
class FileController {
  /**
   * GET /subjects/:subjectId/files
   * Lấy danh sách files theo subject với phân trang
   */
  async getFilesBySubject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId // Lấy từ JWT token (authen middleware)
      const { subjectId } = req.params
      const { page = '1', limit = '20' } = req.query

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Bạn cần đăng nhập để truy cập')
      }

      const result = await fileService.getFilesBySubject(
        userId,
        subjectId,
        parseInt(page as string),
        parseInt(limit as string)
      )

      sendResponse(res, {
        code: StatusCodes.OK,
        message: 'Lấy danh sách files thành công',
        result: {
          files: result.files,
          pagination: result.pagination
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /files
   * Upload file mới
   */
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const file = req.file // File từ multer

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Bạn cần đăng nhập để upload file')
      }

      if (!file) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Vui lòng chọn file để upload')
      }

      // Lấy thông tin từ request body
      const {
        subject: subjectId,
        createSummary = false,
        generateQuiz = false,
        quizQuestions = 10,
        quizDifficulty = 'Medium',
        upload_preset
      } = req.body

      if (!subjectId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Subject ID là bắt buộc')
      }

      // Parse boolean values (vì form-data gửi lên dạng string)
      const shouldCreateSummary = createSummary === 'true' || createSummary === true
      const shouldGenerateQuiz = generateQuiz === 'true' || generateQuiz === true

      const result = await fileService.uploadFile(
        userId,
        file,
        subjectId,
        shouldCreateSummary,
        shouldGenerateQuiz,
        parseInt(quizQuestions),
        quizDifficulty,
        upload_preset
      )

      sendResponse(res, {
        code: StatusCodes.CREATED,
        message: 'File uploaded successfully',
        result: {
          file: result.file,
          processing: result.processing
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /files/:fileId
   * Lấy thông tin chi tiết của một file
   */
  async getFileById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { fileId } = req.params

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Bạn cần đăng nhập để truy cập')
      }

      const result = await fileService.getFileById(userId, fileId)

      sendResponse(res, {
        code: StatusCodes.OK,
        message: 'Lấy thông tin file thành công',
        result: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /files/:fileId
   * Xóa file (soft delete)
   */
  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { fileId } = req.params

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Bạn cần đăng nhập để xóa file')
      }

      await fileService.deleteFile(userId, fileId)

      sendResponse(res, {
        code: StatusCodes.OK,
        message: 'File deleted successfully',
        result: null
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new FileController()
