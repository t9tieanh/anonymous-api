import 'dotenv/config'
import mongoose, { Types } from 'mongoose'
import { UserModel } from '../models/user.model'
import { SubjectModel } from '../models/subject.model'
import { FileModel } from '../models/file.model'
import { Quiz, IQuiz } from '../models/quiz.model'
import { Question } from '../models/question.model'

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Missing MONGODB_URI')
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DATABASE_NAME
    })
    console.log('✅ Connected to MongoDB')

    // Xoá toàn bộ dữ liệu cũ (tuỳ chọn)
    await UserModel.deleteMany({})
    await SubjectModel.deleteMany({})
    await FileModel.deleteMany({})
    await Quiz.deleteMany({})
    await Question.deleteMany({})

    // 1️⃣ Tạo user demo
    const user = await UserModel.create({
      username: 'student01',
      email: 'student@example.com',
      name: 'Student Demo'
    })

    // 2️⃣ Tạo subjects
    const subjects = await SubjectModel.insertMany([
      {
        name: 'Toán cao cấp',
        color: '#ff6b6b',
        userId: user._id,
        children: []
      },
      {
        name: 'Cấu trúc dữ liệu & giải thuật',
        color: '#4dabf7',
        userId: user._id,
        children: []
      },
      {
        name: 'Lập trình Web nâng cao',
        color: '#51cf66',
        userId: user._id,
        children: []
      }
    ])

    // 3️⃣ Tạo files
    const files = await FileModel.insertMany([
      {
        name: 'Chương 1 - Giới thiệu.docx',
        type: '.docx',
        size: 200_000,
        storagePath: 'uploads/chapter1.docx',
        subjectId: subjects[0]._id,
        status: 'ACTIVE'
      },
      {
        name: 'Bài tập Cấu trúc dữ liệu.pdf',
        type: 'pdf',
        size: 350_000,
        storagePath: 'uploads/dsa_exercises.pdf',
        subjectId: subjects[1]._id,
        status: 'ACTIVE'
      },
      {
        name: 'Slide Web nâng cao.docx',
        type: '.docx',
        size: 280_000,
        storagePath: 'uploads/web_advanced.pptx',
        subjectId: subjects[2]._id,
        status: 'ACTIVE'
      },
      {
        name: 'Ôn tập Giai thừa.doc',
        type: 'doc',
        size: 100_000,
        storagePath: 'uploads/factorial.doc',
        subjectId: subjects[1]._id,
        status: 'ACTIVE'
      },
      {
        name: 'Tổng hợp kiến thức Web.pdf',
        type: 'pdf',
        size: 320_000,
        storagePath: 'uploads/web_summary.pdf',
        subjectId: subjects[2]._id,
        status: 'ACTIVE'
      }
    ])

    // 4️⃣ Gắn children (danh sách file._id) vào Subject
    for (const sub of subjects) {
      const subjectId = sub._id as Types.ObjectId // 👈 ép kiểu, tránh 'unknown'

      const childrenFileIds = files
        .filter((f) => f.subjectId?.toString() === subjectId.toString())
        .map((f) => f._id as Types.ObjectId)

      await SubjectModel.findByIdAndUpdate(subjectId, {
        $set: {
          children: childrenFileIds
        }
      })
    }

    // 5️⃣ Tạo quiz (kiểu IQuiz để dùng type ở dưới)
    const quizzes: IQuiz[] = await Quiz.insertMany([
      {
        name: 'Quiz chương 1 Toán',
        fileId: files[0]._id,
        level: 'ez',
        highestScore: 8
      },
      {
        name: 'Quiz CTDL nâng cao',
        fileId: files[1]._id,
        level: 'md',
        highestScore: 6
      },
      {
        name: 'Quiz Web nâng cao',
        fileId: files[2]._id,
        level: 'hard',
        highestScore: 7
      }
    ] as IQuiz[]) // 👈 cast cho chắc

    // 6️⃣ Hàm tạo question – thêm kiểu cho quiz & index
    const makeQuestion = (quiz: IQuiz, index: number) => ({
      name: `Câu ${index + 1}`,
      question: `Nội dung câu hỏi số ${index + 1} của quiz "${quiz.name}"?`,
      quizId: quiz._id as Types.ObjectId,
      answers: [
        { content: 'Đáp án A', isCorrect: index % 4 === 0 },
        { content: 'Đáp án B', isCorrect: index % 4 === 1 },
        { content: 'Đáp án C', isCorrect: index % 4 === 2 },
        { content: 'Đáp án D', isCorrect: index % 4 === 3 }
      ]
    })

    // 7️⃣ Tạo 5 câu hỏi cho mỗi quiz
    for (const quiz of quizzes) {
      const qs = Array.from({ length: 5 }, (_, i) => makeQuestion(quiz, i))
      await Question.insertMany(qs)
    }

    console.log('🎉 DONE: Seed thành công!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  }
}
seed()
