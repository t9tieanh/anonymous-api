import express, { Router } from 'express'
import authRoutes from '~/routes/auth.route'
import fileRoutes from '~/routes/file.route'

const IndexRouter: Router = express.Router()

IndexRouter.use('/auth', authRoutes)
IndexRouter.use('/', fileRoutes) // File routes bao gồm cả /subjects/:subjectId/files và /files
// IndexRouter.use(authen)

export default IndexRouter
