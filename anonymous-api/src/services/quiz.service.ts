/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import ApiError from '~/middleware/ApiError'
import { FileModel } from '~/models/file.model'
import { Quiz } from '~/models/quiz.model'
import { Question } from '~/models/question.model'
import fs from 'fs'
import os from 'os'
import path from 'path'
import stream from 'stream'
import { promisify } from 'util'
import { extractTextFromFile } from '~/utils/fileParser'

export type QuizOptionKey = 'A' | 'B' | 'C' | 'D'

export interface QuizQuestion {
  question: string
  options: Record<QuizOptionKey, string>
  answer: QuizOptionKey
}

export interface GenerateQuizParams {
  text: string
  apiKey: string
  numQuestions: number
  difficulty: string // e.g. easy|medium|hard or Vietnamese labels
}

const pipeline = promisify(stream.pipeline)

const getFile = async (url: string): Promise<{ path: string; mimetype?: string }> => {
  if (!url) throw new Error('No file URL provided')
  const res = await axios.get(url, { responseType: 'stream' })
  const contentType = res.headers['content-type'] as string | undefined
  const ext = contentType ? contentType.split('/')[1] || '' : ''
  const tmpName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext ? `.${ext.split(';')[0]}` : ''}`
  const dest = path.join(os.tmpdir(), tmpName)
  await pipeline(res.data as stream.Readable, fs.createWriteStream(dest))
  return { path: dest, mimetype: contentType }
}

export const createQuiz = async (fileId: string, numQuestions: number, difficulty: string): Promise<QuizQuestion[]> => {
  const currentFile = await FileModel.findById(fileId)
  if (!currentFile) throw new ApiError(404, 'File not found')

  const { path: localPath, mimetype } = await getFile(currentFile.cloudinaryUrl as string)
  try {
    const text = await extractTextFromFile(localPath, mimetype || '')
    const questions = await generateQuiz({ text, apiKey: process.env.GEMINI_API_KEY || '', numQuestions, difficulty })

    // persist generated quiz and questions to database
    const mapDifficultyToLevel = (d: string) => {
      if (!d) return 'ez' as const
      const s = d.toLowerCase()
      if (s.includes('easy') || s.includes('ez') || s.includes('dễ')) return 'ez' as const
      if (s.includes('medium') || s.includes('md') || s.includes('trung')) return 'md' as const
      return 'hard' as const
    }

    const level = mapDifficultyToLevel(difficulty)
    const quizName = `${currentFile.name || 'Quiz'} - ${new Date().toISOString()}`

    const createdQuiz = await Quiz.create({ name: quizName, fileId: currentFile._id, level })

    const questionDocs = questions.map((q, idx) => {
      const answers = [
        { content: q.options.A, isCorrect: q.answer === 'A' },
        { content: q.options.B, isCorrect: q.answer === 'B' },
        { content: q.options.C, isCorrect: q.answer === 'C' },
        { content: q.options.D, isCorrect: q.answer === 'D' }
      ]
      return {
        name: `Câu ${idx + 1}`,
        question: q.question,
        quizId: createdQuiz._id,
        answers
      }
    })

    await Question.insertMany(questionDocs)

    // increment quizCount on file
    try {
      currentFile.quizCount = (currentFile.quizCount || 0) + 1
      await currentFile.save()
    } catch (e) {
      // non-fatal
      console.warn('Failed to update file quizCount', e)
    }

    return questions
  } finally {
    // best-effort cleanup
    fs.unlink(localPath, () => {})
  }
}

export const generateQuiz = async ({
  text,
  apiKey,
  numQuestions,
  difficulty
}: GenerateQuizParams): Promise<QuizQuestion[]> => {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

  const prompt = `
You are a quiz generator. Create exactly ${numQuestions} multiple-choice questions (MCQ) based strictly on the provided text.
Difficulty level: ${difficulty}.

Rules:
- Each question must have 4 unique options labeled A, B, C, D.
- Provide exactly one correct answer as one of: "A", "B", "C", or "D".
- Keep questions concise and unambiguous.
- Use the same language as the input text.
- Respond with JSON only. No markdown, no extra commentary.

JSON schema to follow:
{
  "questions": [
    {
      "question": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "answer": "A|B|C|D"
    }
  ]
}

Text:
${text}
`

  const response = await axios.post(
    endpoint,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        candidateCount: 1
      }
    },
    {
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    }
  )

  const candidates = response.data?.candidates
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidate returned from Gemini API')
  }

  const raw = candidates[0].content.parts.map((p: any) => p.text).join('')

  // Clean markdown fences and extract JSON block
  const cleaned = cleanToJson(raw)
  const json = tryParseJson(cleaned)
  if (!json || !Array.isArray(json.questions)) {
    throw new Error('Model did not return valid quiz JSON')
  }

  // Normalize and validate shape
  const qs: QuizQuestion[] = json.questions
    .map((q: any) => normalizeQuestion(q))
    .filter((q: QuizQuestion | null): q is QuizQuestion => q !== null)
    .slice(0, numQuestions)

  if (qs.length !== numQuestions) {
    // Not enough valid questions; still return what we have but signal issue
    // Alternatively, you can throw an error here
  }

  return qs
}

const cleanToJson = (s: string): string => {
  if (!s) return ''
  // remove code fences
  s = s.replace(/```json|```/g, '').trim()
  // If model wrapped with quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1)
  }
  return s
}

const tryParseJson = (s: string): any | null => {
  // First, try direct parse
  try {
    return JSON.parse(s)
  } catch {
    console.log('Direct JSON parse failed, attempting extraction...')
  }
  // Fallback: extract the largest {...} block
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    const segment = s.slice(first, last + 1)
    try {
      return JSON.parse(segment)
    } catch {
      console.log('Fallback JSON parse failed.')
    }
  }
  return null
}

const normalizeQuestion = (q: any): QuizQuestion | null => {
  if (!q) return null
  const question = String(q.question ?? '').trim()
  const options = q.options ?? {}
  const A = String(options.A ?? '').trim()
  const B = String(options.B ?? '').trim()
  const C = String(options.C ?? '').trim()
  const D = String(options.D ?? '').trim()
  const answer = String(q.answer ?? '')
    .trim()
    .toUpperCase()
  const isValid = question && A && B && C && D && ['A', 'B', 'C', 'D'].includes(answer)
  if (!isValid) return null
  return { question, options: { A, B, C, D }, answer: answer as QuizOptionKey }
}
