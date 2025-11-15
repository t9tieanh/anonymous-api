/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import {
  getAllQuizByFileId,
  getQuizByIdService,
  getAllQuestionByQuiz as getAllQuestionByQuizService,
  submitQuiz,
  SubmitQuizRequest,
  getAllQuizzes as getAllQuizByUserId
} from '../services/quiz.service'

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

export const getQuizByFileId = async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId as string

    if (!fileId) {
      return res.status(400).json({ message: 'fileId is required' })
    }

    const quizzes = await getAllQuizByFileId(fileId)

    res.json({
      success: true,
      data: quizzes,
      count: quizzes.length
    })
  } catch (err: any) {
    console.log(`Error when load quiz for file ${req.params.fileId}: ${err}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

export const getQuizById = async (req: Request, res: Response) => {
  try {
    const quizId: string = req.params.quizId
    if (!quizId) {
      throw new Error('quiId invalid')
    }

    const quiz = await getQuizByIdService(quizId)

    res.json({
      success: true,
      data: quiz
    })
  } catch (err: any) {
    console.log(`Error when load quiz: ${err}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

export const getAllQuestionByQuiz = async (req: Request, res: Response) => {
  try {
    const quizId = req.params.quizId as string
    const isReview = req.query.review === 'true' || req.query.review === '1'

    if (!quizId) {
      return res.status(400).json({ message: 'quizId is required' })
    }

    const questions = await getAllQuestionByQuizService(quizId)

    // Kiểm tra questions có tồn tại và là array không
    if (!questions || !Array.isArray(questions)) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        isReview
      })
    }

    // Field explain luôn được trả về trong response
    // Frontend sẽ quyết định khi nào hiển thị explain dựa trên flag isReview
    // Khi isReview = true: hiển thị explain cho tất cả câu trả lời
    // Khi isReview = false: có thể ẩn explain hoặc chỉ hiển thị khi user chọn xem đáp án
    const responseData = questions.map((question) => ({
      ...question,
      answers: (question.answers || []).map((answer) => ({
        _id: answer._id,
        content: answer.content,
        isCorrect: answer.isCorrect,
        explain: answer.explain || '' // Luôn trả về explain để frontend có thể sử dụng
      }))
    }))

    res.json({
      success: true,
      data: responseData,
      count: questions.length,
      isReview // Thêm flag để frontend biết đang ở chế độ review
    })
  } catch (err: any) {
    console.log(`Error when load question for quiz ${req.params.quizId}: ${err}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

export const submitQuizAnswers = async (req: Request, res: Response) => {
  try {
    const quizId = req.params.quizId as string

    if (!quizId) {
      return res.status(400).json({ message: 'quizId is required' })
    }

    const submitData: SubmitQuizRequest = req.body

    // Validate request body
    if (!submitData.answers || !Array.isArray(submitData.answers)) {
      return res.status(400).json({ message: 'answers array is required' })
    }

    if (submitData.answers.length === 0) {
      return res.status(400).json({ message: 'answers array cannot be empty' })
    }

    // Validate each answer
    for (const answer of submitData.answers) {
      if (!answer.questionId) {
        return res.status(400).json({ message: 'questionId is required for each answer' })
      }
      if (typeof answer.selectedAnswer !== 'number' || answer.selectedAnswer < 0) {
        return res.status(400).json({
          message: 'selectedAnswer must be a non-negative number (index)'
        })
      }
    }

    const result = await submitQuiz(quizId, submitData)

    res.json({
      success: true,
      data: result
    })
  } catch (err: any) {
    console.log(`Error when submit quiz ${req.params.quizId}: ${err}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

export const getAllQuizzes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string

    if (!userId) {
      return res.status(403).json({ message: 'userId invalid - unauthorized' })
    }

    const quizzes = await getAllQuizByUserId(userId)

    if (!quizzes) {
      console.log(`Error when get all quizzes - no data returned`)
      return res.json({
        success: true,
        data: [],
        count: 0
      })
    }

    return res.json({
      success: true,
      data: quizzes,
      count: quizzes.length
    })
  } catch (err: any) {
    console.log(`Error when get all quizzes ${err}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
