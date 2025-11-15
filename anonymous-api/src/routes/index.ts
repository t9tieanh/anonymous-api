import express, { Router } from 'express'
import authRoutes from '~/routes/auth.route'
import userRoutes from '~/routes/user.route'
import fileRoutes from '~/routes/file.route'
import ai_router from '~/routes/summarize.route'

const IndexRouter: Router = express.Router()

IndexRouter.use('/auth', authRoutes)
IndexRouter.use('/user', userRoutes)
IndexRouter.use('/file', fileRoutes) // File routes bao gồm cả /subjects/:subjectId/files và /files
IndexRouter.use('/generate-ai', ai_router)

export default IndexRouter
