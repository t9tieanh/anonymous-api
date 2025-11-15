import { Router } from 'express';
import multer from 'multer';
import { handleSummarize } from '../controllers/summarizeController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/summarize', upload.single('file'), handleSummarize);

export default router;
