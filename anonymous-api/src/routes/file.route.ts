import express, { Router } from 'express'
import fileController from '~/controllers/file.controller'
import authenticate from '~/middleware/authen.middleware'
import { uploadFile } from '~/utils/cloudinaryUtil'
import { getAllQuestionByQuiz, getQuizByFileId, getQuizById, submitQuizAnswers } from '~/controllers/quiz.controller'

const fileRoutes: Router = express.Router()

// GET all files - đặt trước để tránh conflict với routes có params
fileRoutes.get('', authenticate, fileController.getAllFiles)

// Search files - đặt trước các route có params để tránh conflict
fileRoutes.get('/search', authenticate, fileController.searchFiles)

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
 * @route   POST /files/:fileId/import-questions
 * @desc    Import questions JSON and persist as a Quiz + Questions
 * @access  Private
 */
fileRoutes.post('/:fileId/import-questions', authenticate, fileController.importQuestions)

/**
 * @route   GET /files/:fileId
 * @desc    Lấy thông tin chi tiết của một file
 * @access  Private (cần authentication)
 */
fileRoutes.get('/files/:fileId', authenticate, fileController.getFileById)

fileRoutes.delete('/:fileId', authenticate, fileController.deleteFile)

fileRoutes.get('/:fileId/quizzes', authenticate, getQuizByFileId)

fileRoutes.get('/quizzes/:quizId/questions', authenticate, getAllQuestionByQuiz)

fileRoutes.get('/quizzes/:quizId', authenticate, getQuizById)

fileRoutes.post('/quizzes/:quizId/submit', authenticate, submitQuizAnswers)

export default fileRoutes
