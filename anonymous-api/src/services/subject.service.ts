import mongoose, { Types } from 'mongoose'
import { SubjectModel } from '~/models/subject.model'
import { IFile } from '~/models/file.model'

export interface SubjectStatsDTO {
  id: string
  name: string
  color: string
  createdAt: Date
  stats: {
    totalFiles: number
    totalSummaries: number
    totalQuizzes: number
  }
}
export interface SubjectDetailDTO {
  id: string
  name: string
  color: string
  createdAt: Date
  files: IFile[]
}

export interface CreateSubjectInput {
  name: string
  color: string
}
export interface UpdateSubjectInput {
  name: string
  id: string
}

class SubjectService {
  async getAllSubjectByUser(userId: string): Promise<SubjectStatsDTO[]> {
    const userObjectId = new Types.ObjectId(userId)
    console.log(userObjectId)
    const subjects = await SubjectModel.aggregate<SubjectStatsDTO>([
      {
        $match: {
          userId: userObjectId
        }
      },
      // Lấy tất cả file thuộc subject này
      {
        $lookup: {
          from: 'files', // collection name của FileModel
          localField: '_id',
          foreignField: 'subjectId',
          as: 'files'
        }
      },
      // Lấy tất cả quiz thuộc các file đó
      {
        $lookup: {
          from: 'quizzes', // collection name của Quiz
          localField: 'files._id',
          foreignField: 'fileId',
          as: 'quizzes'
        }
      },
      // Tính stats
      {
        $addFields: {
          totalFiles: { $size: '$files' },
          totalSummaries: {
            $size: {
              $filter: {
                input: '$files',
                as: 'f',
                cond: {
                  $and: [{ $gt: [{ $strLenCP: { $ifNull: ['$$f.summaryContent', ''] } }, 0] }]
                }
              }
            }
          },
          totalQuizzes: { $size: '$quizzes' }
        }
      },
      // Format lại kết quả cho đúng DTO
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: 1,
          color: 1,
          createdAt: 1,
          stats: {
            totalFiles: '$totalFiles',
            totalSummaries: '$totalSummaries',
            totalQuizzes: '$totalQuizzes'
          }
          // Nếu sau này có 'folders' thì thêm ở đây
        }
      }
    ])

    return subjects
  }
  async getSubjectById(subjectId: string): Promise<SubjectDetailDTO> {
    const subjects = await SubjectModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(subjectId) }
      },
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'subjectId',
          as: 'files'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'files._id',
          foreignField: 'fileId',
          as: 'quizzes'
        }
      },
      {
        $addFields: {
          totalFiles: { $size: '$files' },
          totalSummaries: {
            $size: {
              $filter: {
                input: '$files',
                as: 'f',
                cond: {
                  $and: [{ $gt: [{ $strLenCP: { $ifNull: ['$$f.summaryContent', ''] } }, 0] }]
                }
              }
            }
          },
          totalQuizzes: { $size: '$quizzes' }
        }
      },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: 1,
          color: 1,
          createdAt: 1,
          files: '$files'
        }
      }
    ])

    return subjects[0]
  }

  async createSubject(userId: string, dto: CreateSubjectInput) {
    const subject = await SubjectModel.create({
      name: dto.name,
      color: dto.color,
      userId: new Types.ObjectId(userId)
    })

    return {
      id: subject.id.toString(),
      name: subject.name,
      color: subject.color,
      createdAt: subject.createdAt,
      stats: {
        totalFiles: 0,
        totalSummaries: 0,
        totalQuizzes: 0
      }
    }
  }
  async updateSubject(userId: string, dto: UpdateSubjectInput) {
    const updated = await SubjectModel.findOneAndUpdate(
      {
        _id: dto.id,
        userId: new Types.ObjectId(userId)
      },
      {
        name: dto.name
      },
      {
        new: true
      }
    )

    if (!updated) {
      throw new Error("Subject not found or you don't have permission")
    }

    return {
      id: updated?.id,
      name: updated?.name,
      color: updated?.color
    }
  }
}

export default new SubjectService()
