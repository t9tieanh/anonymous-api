import { Schema, model, Document, Types } from 'mongoose'

export type FileType = 'file' | 'folder'

export interface IFile extends Document {
  name: string
  type: FileType
  storagePath?: string | null // null nếu là folder
  parentId?: Types.ObjectId | null
  children: Types.ObjectId[] // danh sách file/folder con
  summary_content?: string
  userId: Types.ObjectId // owner
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
      enum: ['file', 'folder'],
      required: true
    },
    storagePath: {
      type: String,
      default: null // folder thì null
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      default: null
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: 'File'
      }
    ],
    summary_content: {
      type: String
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
)

export const FileModel = model<IFile>('File', fileSchema)
