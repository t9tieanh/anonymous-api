import { Router } from 'express'
import userController from '~/controllers/user.controller'
import auth from '~/middleware/authen.middleware'
import { UpdateProfile } from '~/dto/request/Auth.dto'
import validateDto from '~/middleware/validate-dto.middleware'

const router = Router()

router.use(auth)
router.get('/profile', userController.getProfile)
router.get('/statistics', userController.getUserStatistics)
router.put('/profile', validateDto(UpdateProfile), userController.updateProfile)

export default router
