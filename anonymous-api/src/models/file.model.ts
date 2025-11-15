import { Schema, model, Document, Types } from 'mongoose'

export type FileType = '.docx' | '.doc' | '.pdf' | '.md'
export type StatusType = 'ACTIVE' | 'DELETED'

export interface IFile extends Document {
  name: string // Tên file gốc (ví dụ: "Calculus Notes.pdf")
  type: FileType // Loại file: .docx, .doc, .pdf, .md
  size: number // Kích thước file tính bằng bytes
  storagePath?: string // Đường dẫn lưu trữ cũ (deprecated, giữ lại để tương thích)
  cloudinaryUrl?: string // URL public từ MinIO để truy cập file
  cloudinaryPublicId?: string // Object key (path) của file trong MinIO bucket (dùng để xóa)
  mimeType?: string // MIME type của file (application/pdf, application/vnd.openxmlformats...)
  subjectId?: Types.ObjectId // Tham chiếu đến Subject (môn học)
  summaryContent?: string // Nội dung tóm tắt của file (nếu có)
  summaryCount: number // Số lượng summaries đã tạo từ file này
  quizCount: number // Số lượng quizzes đã tạo từ file này
  uploadDate: Date // Ngày upload file
  status: StatusType // Trạng thái: ACTIVE hoặc DELETED
  createdAt: Date
  updatedAt: Date
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
      enum: ['.docx', '.doc', '.pdf', '.md'],
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
      default: null // Giữ lại cho tương thích, không dùng nữa
    },
    cloudinaryUrl: {
      type: String,
      default: null // URL public để truy cập file
    },
    cloudinaryPublicId: {
      type: String,
      default: null // Public ID để xóa file trên Cloudinary
    },
    mimeType: {
      type: String,
      default: null
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },
    summaryContent: {
      type: String
    },
    summaryCount: {
      type: Number,
      default: 0 // Đếm số summaries
    },
    quizCount: {
      type: Number,
      default: 0 // Đếm số quizzes
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // Tự động tạo createdAt và updatedAt
  }
)

export const FileModel = model<IFile>('File', fileSchema)
