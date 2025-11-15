import express, { Router } from 'express'
import authen from '~/middleware/authen.middleware'

const IndexRouter: Router = express.Router()

IndexRouter.use(authen)

export default IndexRouter
