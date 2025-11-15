/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import { extractTextFromFile } from '../utils/fileParser'
import { generateQuiz } from '../services/quiz.service'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export const handleGenerateQuiz = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const numQuestionsRaw = (req.body.numQuestions ?? req.query.numQuestions) as string | number | undefined
    const difficultyRaw = (req.body.difficulty ?? req.query.difficulty) as string | undefined

    const numQuestions = Number(numQuestionsRaw ?? 5)
    if (!Number.isFinite(numQuestions) || numQuestions < 1 || numQuestions > 50) {
      return res.status(400).json({ message: 'numQuestions must be a number between 1 and 50' })
    }
    const difficulty = (difficultyRaw || 'medium').toString()

    const text = await extractTextFromFile(req.file.path, req.file.mimetype)
    const questions = await generateQuiz({ text, apiKey: GEMINI_API_KEY, numQuestions, difficulty })

    res.json({ questions })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
