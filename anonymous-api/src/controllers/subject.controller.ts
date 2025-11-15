import { Request, Response } from 'express'
import sendResponse from '../dto/response/send-response'

class SubjectController {
  async getSubject(req: Request, res: Response) {
    console.log('Get subject controller', req.user.userId)

    sendResponse(res, {
      code: 200,
      message: 'Get subject successfully',
      result: {
        userId: req.user.userId
      }
    })
  }
  async createSubject(req: Request, res: Response) {
    console.log('Create subject controller', req.user.userId)

    sendResponse(res, {
      code: 200,
      message: 'Create subject successfully',
      result: {
        userId: req.user.userId
      }
    })
  }
}

export default new SubjectController()
