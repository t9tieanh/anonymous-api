import { UserModel, UserDoc } from '~/models/user.model'
import { SubjectModel } from '~/models/subject.model'
import { FileModel } from '~/models/file.model'
import { Quiz } from '~/models/quiz.model'

export interface UserStatistics {
  totalFiles: number
  totalSummaries: number
  totalQuizzes: number
  completedQuizzes: number
  averageScore: string // e.g. "85%"
  trends: {
    files: string
    quizzes: string
  }
}

class UserService {
  async getUserById(userId: string): Promise<UserDoc | null> {
    return await UserModel.findById(userId).select('-password').exec()
  }

  /** Update user profile (name, email, ...). Returns updated user without password */
  async updateUser(userId: string, payload: { name?: string; email?: string }): Promise<UserDoc | null> {
    const update: Record<string, unknown> = {}
    if (payload.name !== undefined) update.name = payload.name
    if (payload.email !== undefined) update.email = payload.email

    const updated = await UserModel.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true
    })
      .select('-password')
      .exec()

    return updated
  }

  /**
   * Compute user learning statistics for dashboard/settings.
   * - totalFiles: files belonging to user's subjects or explicitly owned by user
   * - totalSummaries: files that have `summary_content`
   * - totalQuizzes: quizzes generated for those files
   * - completedQuizzes: quizzes with highestScore > 0
   * - averageScore: average highestScore across those quizzes (formatted as percent)
   * - trends: simple week-over-week delta for files and quizzes
   */
  async getUserStatistics(userId: string): Promise<UserStatistics> {
    // 1) find subjects owned by user
    const subjects = await SubjectModel.find({ userId }).select('_id').lean()
    const subjectIds = subjects.map((s) => s._id)

    // Build file query: include files that reference one of the user's subjects OR files that have a userId field (some records may store userId directly)
    let filesQuery: Record<string, unknown>
    if (subjectIds.length > 0) {
      filesQuery = { $or: [{ subjectId: { $in: subjectIds } }, { userId }] }
    } else {
      filesQuery = { userId }
    }

    // Counts
    const totalFiles = await FileModel.countDocuments(filesQuery)
    const totalSummaries = await FileModel.countDocuments({
      ...filesQuery,
      // summary_content exists and is not null/empty
      summary_content: { $exists: true, $nin: [null, ''] }
    })

    // Get file ids to count quizzes
    const files = await FileModel.find(filesQuery).select('_id createdAt').lean()
    const fileIds = files.map((f) => f._id)

    const totalQuizzes = fileIds.length > 0 ? await Quiz.countDocuments({ fileId: { $in: fileIds } }) : 0
    let completedQuizzes = 0
    if (fileIds.length > 0) {
      completedQuizzes = await Quiz.countDocuments({ fileId: { $in: fileIds }, highestScore: { $gt: 0 } })
    }

    // Average score: highestScore is 0..10 — convert to percent
    let averageScore = '0%'
    if (fileIds.length > 0) {
      const agg = await Quiz.aggregate([
        { $match: { fileId: { $in: fileIds } } },
        { $group: { _id: null, avgScore: { $avg: '$highestScore' } } }
      ])
      const avg = agg && agg.length > 0 && agg[0].avgScore ? agg[0].avgScore : 0
      averageScore = `${Math.round(avg * 10)}%`
    }

    // Trends: simple week-over-week delta
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const filesThisWeek = await FileModel.countDocuments({
      ...filesQuery,
      createdAt: { $gte: weekAgo }
    })
    const filesPrevWeek = await FileModel.countDocuments({
      ...filesQuery,
      createdAt: { $gte: twoWeeksAgo, $lt: weekAgo }
    })
    const filesDelta = filesThisWeek - filesPrevWeek
    const filesTrend = `${filesDelta >= 0 ? '+' : ''}${filesDelta} this week`

    let quizzesThisWeek = 0
    let quizzesPrevWeek = 0
    if (fileIds.length > 0) {
      quizzesThisWeek = await Quiz.countDocuments({ fileId: { $in: fileIds }, createdAt: { $gte: weekAgo } })
      quizzesPrevWeek = await Quiz.countDocuments({
        fileId: { $in: fileIds },
        createdAt: { $gte: twoWeeksAgo, $lt: weekAgo }
      })
    }
    const quizzesDelta = quizzesThisWeek - quizzesPrevWeek
    const quizzesTrend = `${quizzesDelta >= 0 ? '+' : ''}${quizzesDelta} this week`

    return {
      totalFiles,
      totalSummaries,
      totalQuizzes,
      completedQuizzes,
      averageScore,
      trends: {
        files: filesTrend,
        quizzes: quizzesTrend
      }
    }
  }
}

export default new UserService()
