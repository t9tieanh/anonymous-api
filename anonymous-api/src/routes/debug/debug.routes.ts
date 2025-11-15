import { Router } from 'express'
import { UserModel } from '../../models/user.model'
import { FileModel } from '../../models/file.model'
import { Quiz } from '../../models/quiz.model'
import { Question } from '../../models/question.model'

const router = Router()

/**
 * GET /debug/users → xem danh sách user
 */
router.get('/users', async (req, res) => {
  const users = await UserModel.find().lean()
  return res.json(users)
})

/**
 * GET /debug/files → xem tất cả file & folder
 */
router.get('/files', async (req, res) => {
  const files = await FileModel.find().lean()
  return res.json(files)
})

/**
 * GET /debug/folders → chỉ folder
 */
router.get('/folders', async (req, res) => {
  const folders = await FileModel.find({ type: 'folder' })
    .populate('children')
    .populate('userId')
    .populate('parentId')
    .lean()
  return res.json(folders)
})

/**
 * GET /debug/files/:userId → file theo người dùng
 */
router.get('/files/user/:userId', async (req, res) => {
  const files = await FileModel.find({ userId: req.params.userId }).lean()
  return res.json(files)
})

/**
 * GET /debug/quizzes → tất cả quiz
 */
router.get('/quizzes', async (req, res) => {
  const quizzes = await Quiz.find().lean()
  return res.json(quizzes)
})

/**
 * GET /debug/questions → tất cả câu hỏi + đáp án
 */
router.get('/questions', async (req, res) => {
  const questions = await Question.find().lean()
  return res.json(questions)
})

/**
 * GET /debug/questions/quiz/:quizId → câu hỏi của quiz
 */
router.get('/questions/quiz/:quizId', async (req, res) => {
  const questions = await Question.find({ quizId: req.params.quizId }).lean()
  return res.json(questions)
})

export default router
