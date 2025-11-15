import { Router } from 'express'
import multer from 'multer'
import { handleSummarize } from '../controllers/summarizeController'
import { handleGenerateQuiz } from '../controllers/quizController'
import { handleTranslateHtml } from '../controllers/translateController'

const router = Router()
const upload = multer({ dest: 'uploads/' })

router.post('/summarize', upload.single('file'), handleSummarize)
router.post('/quiz', upload.single('file'), handleGenerateQuiz)
router.post('/translate', handleTranslateHtml)

export default router
