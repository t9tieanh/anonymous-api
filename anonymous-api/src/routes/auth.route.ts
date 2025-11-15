import { Router } from 'express'
import authController from '~/controllers/auth.controller'

const router = Router()

router.post('/google', authController.login)

export default router
