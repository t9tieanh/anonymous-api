import { Schema, model, Document, Types } from 'mongoose'

export type FileType = '.docx' | 'doc' | 'pdf'
export type StatusType = 'ACTIVE' | 'DELETED'

export interface IFile extends Document {
  name: string
  type: FileType
  size: number
  storagePath?: string
  subjectId?: Types.ObjectId
  summary_content?: string
  updateDate: string
  status: StatusType
}

const fileSchema = new Schema<IFile>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['.docx', 'doc', 'pdf'],
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DELETED'],
      default: 'ACTIVE'
    },
    size: {
      type: Number,
      required: true
    },
    storagePath: {
      type: String,
      default: null // folder thì null
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },
    summary_content: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

export const FileModel = model<IFile>('File', fileSchema)
