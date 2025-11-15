import { Request, Response } from 'express'
import userService from '~/services/user.service'
import sendResponse from '~/dto/response/send-response'
import ApiError from '~/middleware/ApiError'

class UserController {
  async getProfile(req: Request, res: Response) {
    const userId = req.user.userId
    const user = await userService.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    sendResponse(res, {
      code: 200,
      message: 'User profile retrieved successfully',
      result: user
    })
  }

  async getUserStatistics(req: Request, res: Response) {
    const userId = req.user.userId
    const stats = await userService.getUserStatistics(userId)
    sendResponse(res, {
      code: 200,
      message: 'User statistics retrieved successfully',
      result: stats
    })
  }

  async updateProfile(req: Request, res: Response) {
    const userId = req.user.userId
    const { name, email } = req.body

    if (!name && !email) {
      throw new ApiError(400, 'At least one of name or email must be provided')
    }

    const updated = await userService.updateUser(userId, { name, email })
    if (!updated) {
      throw new ApiError(404, 'User not found')
    }

    sendResponse(res, {
      code: 200,
      message: 'Profile updated successfully',
      result: updated
    })
  }
}

export default new UserController()
