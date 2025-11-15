import { Schema, model, Document, Types } from 'mongoose'

export type QuizLevel = 'ez' | 'md' | 'hard'

export interface IQuiz extends Document {
  name: string
  fileId: Types.ObjectId // liên kết tới File
  content?: string | null // có thể null nếu lấy nội dung từ file
  level: QuizLevel
  highestScore: number // 0 -> 100
  attemptCount: number // Số lần user đã làm bài quiz này
}

const quizSchema = new Schema<IQuiz>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true
    },
    content: {
      type: String,
      default: null
    },
    level: {
      type: String,
      enum: ['ez', 'md', 'hard'],
      default: 'ez',
      required: true
    },
    highestScore: {
      type: Number,
      min: -1,
      max: 100,
      default: -1
    },
    attemptCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

export const Quiz = model<IQuiz>('Quiz', quizSchema)
