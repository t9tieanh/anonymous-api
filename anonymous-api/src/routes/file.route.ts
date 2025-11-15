import express, { Router } from 'express'
import fileController from '~/controllers/file.controller'
import authenticate from '~/middleware/authen.middleware'
import { uploadFile } from '~/utils/cloudinaryUtil'

const fileRoutes: Router = express.Router()

/**
 * @route   GET /subjects/:subjectId/files
 * @desc    Lấy danh sách files theo subject với phân trang
 * @access  Private (cần authentication)
 * @query   page (optional) - Số trang (default: 1)
 *          limit (optional) - Số items mỗi trang (default: 20)
 */
fileRoutes.get('/subjects/:subjectId/files', authenticate, fileController.getFilesBySubject)

/**
 * @route   POST /files
 * @desc    Upload file mới với optional processing (summary, quiz)
 * @access  Private (cần authentication)
 * @body    file (binary) - File cần upload (PDF, DOCX, DOC, MD)
 *          subject (string) - ID của subject
 *          createSummary (optional) - Có tạo summary không
 *          generateQuiz (optional) - Có tạo quiz không
 *          quizQuestions (optional) - Số câu hỏi (default: 10)
 *          quizDifficulty (optional) - Độ khó (Easy/Medium/Hard)
 */
fileRoutes.post('', authenticate, uploadFile.single('file'), fileController.uploadFile)

/**
 * @route   GET /files/:fileId
 * @desc    Lấy thông tin chi tiết của một file
 * @access  Private (cần authentication)
 */
fileRoutes.get('/files/:fileId', authenticate, fileController.getFileById)

/**
 * @route   DELETE /files/:fileId
 * @desc    Xóa file (soft delete) và tất cả summaries/quizzes liên quan
 * @access  Private (cần authentication)
 */
fileRoutes.delete('/files/:fileId', authenticate, fileController.deleteFile)

export default fileRoutes
