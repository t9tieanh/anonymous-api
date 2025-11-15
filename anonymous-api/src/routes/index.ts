import express, { Router } from 'express'
import authen from '~/middleware/authen.middleware'
import authRoutes from '~/routes/auth.route'

const IndexRouter: Router = express.Router()

IndexRouter.use('/auth', authRoutes)
// IndexRouter.use(authen)

export default IndexRouter
