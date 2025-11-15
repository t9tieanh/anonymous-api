import { Router } from 'express'
import subjectController from '~/controllers/subject.controller'
import authen from '~/middleware/authen.middleware'
const router = Router()

/**
 * GET /debug/users → xem danh sách user
 */
router.get('/:subjectId', subjectController.getSubjectById)
router.delete('/:subjectId', subjectController.deleteSubject)
export default router
