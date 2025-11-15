import express, { Router } from 'express'
import authRoutes from '~/routes/auth.route'
import cloudinaryRoutes from '~/routes/cloudinary.route'
import subjectsRoutes from '~/routes/subjects.route'
import subjectRoutes from '~/routes/subject.route'
import userRoutes from '~/routes/user.route'
import fileRoutes from '~/routes/file.route'
import ai_router from '~/routes/summarize.route'
import quizRoute from './quiz.route'

import auth from '~/middleware/authen.middleware'

const IndexRouter: Router = express.Router()

IndexRouter.use('/auth', authRoutes)

// Public Cloudinary proxy (must be before auth middleware so it's accessible without auth)
IndexRouter.use('/', cloudinaryRoutes)

IndexRouter.use(auth)

IndexRouter.use('/subjects', subjectsRoutes)
IndexRouter.use('/subject', subjectRoutes)
// IndexRouter.use(authen)
IndexRouter.use('/user', userRoutes)
IndexRouter.use('/quizzes', quizRoute)
// IndexRouter.use('/file', fileRoutes)
IndexRouter.use('/files', fileRoutes)
IndexRouter.use('/generate-ai', ai_router)

export default IndexRouter
