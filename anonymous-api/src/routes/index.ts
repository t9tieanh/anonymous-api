import express, { Router } from 'express'
import authen from '~/middleware/authen.middleware'
import authRoutes from '~/routes/auth.route'
import subjectsRoutes from '~/routes/subjects.route'
import subjectRoutes from '~/routes/subject.route'

const IndexRouter: Router = express.Router()

IndexRouter.use('/auth', authRoutes)
IndexRouter.use('/subjects', subjectsRoutes)
IndexRouter.use('/subject', subjectRoutes)
// IndexRouter.use(authen)

export default IndexRouter
