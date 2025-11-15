import { Request, Response } from 'express'
import sendResponse from '../dto/response/send-response'
import subjectService, { CreateSubjectInput, UpdateSubjectInput } from '~/services/subject.service'

class SubjectController {
  async getAllSubject(req: Request, res: Response) {
    const data = await subjectService.getAllSubjectByUser(req?.user?.userId)
    sendResponse(res, {
      code: 200,
      message: 'Get subject successfully',
      result: data
    })
  }
  async getSubjectById(req: Request, res: Response) {
    console.log(req)
    console.log('Get subject controller', req?.params?.subjectId)
    const data = await subjectService.getSubjectById(req?.params?.subjectId)
    sendResponse(res, {
      code: 200,
      message: 'Get subject successfully',
      result: data
    })
  }
  async createSubject(req: Request, res: Response) {
    console.log('Create subject controller', req?.user?.userId)
    console.log(req)
    const dto: CreateSubjectInput = {
      name: req.body.name,
      color: req.body.color
    }
    const data = await subjectService.createSubject(req?.user?.userId, dto)
    sendResponse(res, {
      code: 200,
      message: 'Create subject successfully',
      result: {
        data
      }
    })
  }
  async updateSubject(req: Request, res: Response) {
    console.log('Update subject controller', req?.user?.userId)
    console.log(req)
    const dto: UpdateSubjectInput = {
      name: req.body.name,
      id: req.body.id
    }
    const userId = `69183495fa6da2de813a9739`
    const data = await subjectService.updateSubject(userId, dto)
    sendResponse(res, {
      code: 200,
      message: 'Update subject successfully',
      result: {
        data
      }
    })
  }
}

export default new SubjectController()