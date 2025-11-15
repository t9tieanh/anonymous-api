import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import fileService from '~/services/file.service'
import { FileModel } from '~/models/file.model'
import { Quiz } from '~/models/quiz.model'
import { Question } from '~/models/question.model'
import { Types } from 'mongoose'
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
        upload_preset,
        name
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
        upload_preset,
        name
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

      // base file response from service (formatted)
      const base = await fileService.getFileById(userId, fileId)

      // enrich with summaries (if present on file doc) and quizzes list
      const fileDoc = await FileModel.findById(fileId).lean()

      const summaries: Array<Record<string, unknown>> = []
      if (fileDoc && fileDoc.summaryContent) {
        summaries.push({
          id: `${fileId}-s1`,
          createdAt: ((fileDoc.updatedAt || fileDoc.uploadDate) as unknown) as Date,
          excerpt: fileDoc.summaryContent as string,
          aiMatchScore: null,
          author: { id: 'system', name: 'AutoSummary' },
          url: `/files/${fileId}/summaries/1`
        })
      }

      const quizDocs = await Quiz.find({ fileId }).lean()
      const quizzes = await Promise.all(
        quizDocs.map(async (q) => {
          const questionCount = await Question.countDocuments({ quizId: (q._id as unknown) as Types.ObjectId })
          const idStr = (q._id as unknown as Types.ObjectId).toString()
          const qRec = q as unknown as Record<string, unknown>
          const highestScore = (qRec['highestScore'] as number) ?? 0
          const createdAt = (qRec['createdAt'] as Date) || undefined
          return {
            id: idStr,
            name: q.name,
            questionCount,
            highestScore,
            createdAt,
            url: `/quizzes/${idStr}`
          }
        })
      )

      const resultPayload = {
        file: {
          ...base,
          summaries,
          quizzes
        }
      }

      sendResponse(res, {
        code: StatusCodes.OK,
        message: 'Lấy thông tin file thành công',
        result: {
          success: true,
          data: resultPayload
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /files/:fileId/import-questions
   * Import an array of questions (from request body) and persist as a new Quiz + Questions
   */
  async importQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { fileId } = req.params

      if (!userId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Bạn cần đăng nhập để thực hiện thao tác này')
      }

      const payload = req.body?.questions ?? req.body
      if (!Array.isArray(payload) || payload.length === 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Payload questions không hợp lệ')
      }

      // optional name and level
      const quizName = (req.body?.name as string) || `Imported Quiz - ${new Date().toISOString()}`
      const level = (req.body?.level as string) || 'ez'

      // create quiz
      const createdQuiz = await Quiz.create({ name: quizName, fileId, level })

      const arr = payload as Array<Record<string, unknown>>
      const questionDocs = arr.map((q, idx: number) => {
        const opts = (q.options ?? {}) as Record<string, unknown>
        const getOpt = (k: string) => String(opts[k] ?? '')
        const answerRaw = String(q.answer ?? '').toUpperCase()
        const answers = [
          { content: getOpt('A'), isCorrect: answerRaw === 'A' },
          { content: getOpt('B'), isCorrect: answerRaw === 'B' },
          { content: getOpt('C'), isCorrect: answerRaw === 'C' },
          { content: getOpt('D'), isCorrect: answerRaw === 'D' }
        ]
        return {
          name: `Câu ${idx + 1}`,
          question: String(q.question ?? ''),
          quizId: createdQuiz._id,
          answers
        }
      })

      await Question.insertMany(questionDocs)

      // increment quizCount on file
      try {
        await FileModel.findByIdAndUpdate(fileId, { $inc: { quizCount: 1 } })
      } catch (e) {
        console.warn('Failed to update file quizCount', e)
      }

      sendResponse(res, {
        code: StatusCodes.CREATED,
        message: 'Imported questions successfully',
        result: { quizId: (createdQuiz._id as unknown as import('mongoose').Types.ObjectId).toString() }
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
