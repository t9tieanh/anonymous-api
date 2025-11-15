import { getAllQuizzes } from '~/controllers/quiz.controller'
import express, { Router } from 'express'
import authenticate from '~/middleware/authen.middleware'

const quizRoute: Router = express.Router()

quizRoute.get('', authenticate, getAllQuizzes)

export default quizRoute
