import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISubject extends Document {
  userId: Types.ObjectId // owner
  name: string
  color: string
  children: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
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
    }
  },
  { timestamps: true }
)

export const SubjectModel = mongoose.model<ISubject>('Subject', SubjectSchema)
