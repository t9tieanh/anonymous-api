import mongoose, { Schema, Document, Types } from 'mongoose'

export type StatusType = 'ACTIVE' | 'DELETED'

export interface ISubject extends Document {
  userId: Types.ObjectId // owner
  name: string
  color: string
  children: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
  status: StatusType
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: 'File'
      }
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DELETED'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
)

export const SubjectModel = mongoose.model<ISubject>('Subject', SubjectSchema)
