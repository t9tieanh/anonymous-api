import express, { Router } from 'express'
import authRoutes from '~/routes/auth.route'
import userRoutes from '~/routes/user.route'

const IndexRouter: Router = express.Router()

IndexRouter.use('/auth', authRoutes)
IndexRouter.use('/user', userRoutes)
// IndexRouter.use(authen)

export default IndexRouter
