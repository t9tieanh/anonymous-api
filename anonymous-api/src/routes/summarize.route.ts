import { Router } from 'express'
import multer from 'multer'
import { handleTranslateHtml } from '../controllers/translate.controller'
import { handleSummarize } from '../controllers/summarize.controller'
import { handleGenerateQuiz } from '../controllers/quiz.controller'
import validator from '~/middleware/validate-dto.middleware'
import { GenerateQuizDto } from '~/dto/request/quiz.dto'

const router = Router()
const upload = multer({ dest: 'uploads/' })

router.post('/summarize', upload.single('file'), handleSummarize)
router.post('/quiz', validator(GenerateQuizDto), handleGenerateQuiz)
router.post('/translate', handleTranslateHtml)

export default router
