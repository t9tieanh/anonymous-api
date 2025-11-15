import { Request, Response } from 'express'
import { translateHtml } from '../services/translate.service'
import { franc } from 'franc-min'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export const handleTranslateHtml = async (req: Request, res: Response) => {
  try {
    const { content, targetLang, model } = req.body || {}

    const detectedLang = franc(content)

    console.log('detectedLang', detectedLang)
    console.log('targetLang', targetLang)

    if (detectedLang === targetLang) {
      console.log('VO')
      return res.json({ result: content, targetLang, model: model || 'gemini-2.5-flash' })
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ message: 'content is required (HTML string)' })
    }
    if (!targetLang || typeof targetLang !== 'string') {
      return res.status(400).json({ message: 'targetLang is required (e.g., en|vi|zh)' })
    }
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on server' })
    }
    const result = await translateHtml({ content, targetLang, apiKey: GEMINI_API_KEY, model })
    return res.json({ result, targetLang, model: model || 'gemini-2.5-flash' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
