import express, { Router } from 'express'
import fileController from '~/controllers/file.controller'
import authenticate from '~/middleware/authen.middleware'
import { uploadFile } from '~/utils/cloudinaryUtil'
import { getAllQuestionByQuiz, getQuizByFileId, getQuizById, submitQuizAnswers } from '~/controllers/quiz.controller'

const fileRoutes: Router = express.Router()

fileRoutes.get('/subjects/:subjectId/files', authenticate, fileController.getFilesBySubject)

fileRoutes.post('/files', authenticate, uploadFile.single('file'), fileController.uploadFile)

fileRoutes.get('/:fileId', authenticate, fileController.getFileById)

fileRoutes.delete('/:fileId', authenticate, fileController.deleteFile)

fileRoutes.get('/:fileId/quizzes', authenticate, getQuizByFileId)

fileRoutes.get('/quizzes/:quizId/questions', authenticate, getAllQuestionByQuiz)

fileRoutes.get('/quizzes/:quizId', authenticate, getQuizById)

fileRoutes.post('/quizzes/:quizId/submit', authenticate, submitQuizAnswers)

export default fileRoutes
