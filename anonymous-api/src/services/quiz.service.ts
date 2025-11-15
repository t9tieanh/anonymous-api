/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import ApiError from '~/middleware/ApiError'
import { FileModel } from '~/models/file.model'
import fs from 'fs'
import os from 'os'
import path from 'path'
import stream from 'stream'
import { promisify } from 'util'
import { extractTextFromFile } from '~/utils/fileParser'
import { Quiz, IQuiz } from '../models/quiz.model'
import { Types } from 'mongoose'
import { Question, IQuestion } from '~/models/question.model'

export type QuizOptionKey = 'A' | 'B' | 'C' | 'D'

export interface QuizQuestion {
  question: string
  options: Record<QuizOptionKey, string>
  answer: QuizOptionKey
  explain?: string
}

export interface GenerateQuizParams {
  text: string
  apiKey: string
  numQuestions: number
  difficulty: string // e.g. easy|medium|hard or Vietnamese labels
}

export interface SubmitAnswer {
  questionId: string
  selectedAnswer: number // Index của answer được chọn (0, 1, 2, 3)
}

export interface SubmitQuizRequest {
  answers: SubmitAnswer[]
  timeSpent?: string
}

export interface SubmitQuizResult {
  score: number // Điểm từ 0-10
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  questionResults: Array<{
    questionId: string
    isCorrect: boolean
    selectedAnswerIndex: number
    correctAnswerIndex: number
    correctAnswer: {
      _id: string
      content: string
      explain: string
    }
  }>
  timeSpent?: string
  isNewRecord: boolean // Có phải điểm cao nhất mới không
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
        explanation: q.explain || '',
        answers
      }
    })

    console.log('Created question docs hêlooo:', questionDocs)

    try {
      Question.insertMany(questionDocs)
        .then((result) => {
          const ids = result.map((doc) => doc._id)
          console.log('✔ Insert thành công!', ids)
        })
        .catch((err) => {
          console.error('❌ Insert thất bại!', err)
        })
    } catch (e) {
      console.error('Failed to insert question docs', e)
    }

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
      "answer": "A|B|C|D",
      "explain": "..." // brief explanation of the correct answer
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

  console.log('Generated questions: ---- raw', json)

  // Normalize and validate shape
  const qs: QuizQuestion[] = json.questions
    .map((q: any) => normalizeQuestion(q))
    .filter((q: QuizQuestion | null): q is QuizQuestion => q !== null)
    .slice(0, numQuestions)

  if (qs.length !== numQuestions) {
    // Not enough valid questions; still return what we have but signal issue
    // Alternatively, you can throw an error here
  }

  console.log('Generated questions: ---- final', qs)

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
  const explain = String(q.explain ?? '').trim()
  const isValid = question && A && B && C && D && ['A', 'B', 'C', 'D'].includes(answer)
  if (!isValid) return null
  return { question, options: { A, B, C, D }, answer: answer as QuizOptionKey, explain }
}

export const getQuizByIdService = async (quizId: string): Promise<IQuiz | null> => {
  if (!Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quizId format')
  }

  const quiz = await Quiz.findById(quizId).lean()
  return quiz as IQuiz | null
}

export const getAllQuizByFileId = async (fileId: string): Promise<IQuiz[]> => {
  // Validate fileId is a valid ObjectId
  if (!Types.ObjectId.isValid(fileId)) {
    throw new Error('Invalid fileId format')
  }

  const quizzes = await Quiz.find({ fileId: new Types.ObjectId(fileId) })
    .sort({ createdAt: -1 }) // Sort by newest first
    .lean()

  return quizzes as IQuiz[]
}

export const getAllQuizzes = async (userId: string): Promise<IQuiz[]> => {
  // Validate và convert userId sang ObjectId
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid userId format')
  }

  const userObjectId = new Types.ObjectId(userId)

  const quizzes = await Quiz.aggregate([
    // join File
    {
      $lookup: {
        from: 'files',
        localField: 'fileId',
        foreignField: '_id',
        as: 'file'
      }
    },
    { $unwind: '$file' },

    // join Subject
    {
      $lookup: {
        from: 'subjects',
        localField: 'file.subjectId',
        foreignField: '_id',
        as: 'subject'
      }
    },
    { $unwind: '$subject' },

    // filter userId - so sánh ObjectId với ObjectId
    {
      $match: {
        'subject.userId': userObjectId
      }
    },

    // clean up output
    {
      $project: {
        file: 0,
        subject: 0
      }
    }
  ])

  return quizzes
}

export const getAllQuestionByQuiz = async (quizId: string): Promise<IQuestion[]> => {
  if (!Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quizId format')
  }

  const objectId = new Types.ObjectId(quizId)

  const questions: IQuestion[] = await Question.find({ quizId: objectId }).lean()

  // Đảm bảo luôn trả về array, không bao giờ undefined hoặc null
  return questions || []
}

export const submitQuiz = async (quizId: string, submitData: SubmitQuizRequest): Promise<SubmitQuizResult> => {
  if (!Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quizId format')
  }

  // Lấy tất cả questions của quiz
  const questions = await getAllQuestionByQuiz(quizId)

  if (questions.length === 0) {
    throw new Error('Quiz not found or has no questions')
  }

  // Tạo map để dễ tìm question theo ID
  const questionMap = new Map<string, IQuestion>()
  questions.forEach((q) => {
    questionMap.set(String(q._id), q)
  })

  // Tính điểm
  let correctAnswers = 0
  const questionResults: SubmitQuizResult['questionResults'] = []

  for (const answer of submitData.answers) {
    const question = questionMap.get(answer.questionId)

    if (!question) {
      // Nếu không tìm thấy question, coi như sai
      questionResults.push({
        questionId: answer.questionId,
        isCorrect: false,
        selectedAnswerIndex: answer.selectedAnswer,
        correctAnswerIndex: -1,
        correctAnswer: {
          _id: '',
          content: 'Question not found',
          explain: ''
        }
      })
      continue
    }

    // Cập nhật userAnswer trong question model (ghi đè câu trả lời cũ)
    await Question.findByIdAndUpdate(answer.questionId, {
      userAnswer: answer.selectedAnswer
    })

    // Tìm index của answer đúng
    const correctAnswerIndex = question.answers.findIndex((ans) => ans.isCorrect === true)
    const isCorrect = correctAnswerIndex === answer.selectedAnswer

    if (isCorrect) {
      correctAnswers++
    }

    // Lấy thông tin answer đúng
    const correctAnswer = question.answers[correctAnswerIndex] || {
      _id: '',
      content: '',
      explain: ''
    }

    questionResults.push({
      questionId: answer.questionId,
      isCorrect,
      selectedAnswerIndex: answer.selectedAnswer,
      correctAnswerIndex,
      correctAnswer: {
        _id: String(correctAnswer._id || ''),
        content: correctAnswer.content || '',
        explain: correctAnswer.explain || ''
      }
    })
  }

  // Tính điểm: (số câu đúng / tổng số câu) * 10
  const totalQuestions = questions.length
  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 10 : 0
  const incorrectAnswers = totalQuestions - correctAnswers

  // Làm tròn điểm đến 2 chữ số thập phân
  const roundedScore = Math.round(score * 100) / 10

  // Cập nhật highestScore nếu điểm mới cao hơn và tăng attemptCount
  const quiz = await Quiz.findById(quizId)
  let isNewRecord = false

  if (quiz) {
    // Tăng số lần làm bài
    quiz.attemptCount = (quiz.attemptCount || 0) + 1

    // Cập nhật điểm cao nhất nếu điểm mới cao hơn
    if (roundedScore > quiz.highestScore) {
      quiz.highestScore = roundedScore
      isNewRecord = true
    }

    await quiz.save()
  }

  return {
    score: roundedScore,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    questionResults,
    timeSpent: submitData.timeSpent,
    isNewRecord
  }
}
