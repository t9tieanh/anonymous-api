import { Router } from 'express';
import multer from 'multer';
import { handleSummarize } from '../controllers/summarizeController';
import { handleGenerateQuiz } from '../controllers/quizController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/summarize', upload.single('file'), handleSummarize);
router.post('/quiz', upload.single('file'), handleGenerateQuiz)

export default router
