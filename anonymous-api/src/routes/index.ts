import express, { Router } from 'express'
import authRoutes from '~/routes/auth.route'
import subjectsRoutes from '~/routes/subjects.route'
import subjectRoutes from '~/routes/subject.route'
import userRoutes from '~/routes/user.route'
import fileRoutes from '~/routes/file.route'
import ai_router from '~/routes/summarize.route'
import auth from '~/middleware/authen.middleware'
const IndexRouter: Router = express.Router()

IndexRouter.use('/auth', authRoutes)

IndexRouter.use(auth)
IndexRouter.use('/subjects', subjectsRoutes)
IndexRouter.use('/subject', subjectRoutes)
IndexRouter.use('/user', userRoutes)
IndexRouter.use('/files', fileRoutes) // File routes bao gồm cả /subjects/:subjectId/files và /files
IndexRouter.use('/generate-ai', ai_router)

export default IndexRouter
