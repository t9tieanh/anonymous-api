import { Schema, model, Document, Types } from 'mongoose'

export interface IAnswer {
  _id?: Types.ObjectId // subdocument id
  content: string
  isCorrect: boolean
  explain: string
}

export interface IQuestion extends Document {
  name: string
  question: string
  quizId: Types.ObjectId
  answers: IAnswer[]
  userAnswer?: number | null
  explanation: string
}

const answerSchema = new Schema<IAnswer>(
  {
    content: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    },
    explain: {
      type: String,
      required: false,
      trim: true
    }
  },
  {
    _id: true // tạo _id cho từng answer
  }
)

const questionSchema = new Schema<IQuestion>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    question: {
      type: String,
      required: true
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    userAnswer: {
      type: Number,
      required: false,
      default: null
    },
    explanation: {
      type: String,
      required: false,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

export const Question = model<IQuestion>('Question', questionSchema)
