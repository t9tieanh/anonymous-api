/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import { extractTextFromFile } from '../utils/fileParser'
import { summarizeText } from '../services/summarize.service'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export const handleSummarize = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const text = await extractTextFromFile(req.file.path, req.file.mimetype)
    const { summary, aiMatchScore } = await summarizeText(text, GEMINI_API_KEY)
    // Always return JSON for DB persistence on client
    res.json({ summary, aiMatchScore })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
