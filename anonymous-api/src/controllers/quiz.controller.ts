/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import { createQuiz } from '../services/quiz.service'
import sendResponse from '../dto/response/send-response'

export const handleGenerateQuiz = async (req: Request, res: Response) => {
  try {
    const numQuestions = req.data.numQuestions ?? 5
    const difficulty = req.data.difficulty ?? 'medium'

    const questions = await createQuiz(req.data.id, numQuestions, difficulty)
    sendResponse(res, {
      code: 200,
      message: 'Quiz generated successfully',
      result: { questions }
    })
  } catch (err: any) {
    console.error(err)
  }
}
