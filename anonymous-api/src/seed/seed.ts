// src/seed/seed.ts
import 'dotenv/config' // đảm bảo load biến môi trường
import mongoose from 'mongoose'
import { env } from '../config/env' // dùng chung env như CONNECT_DB
import { UserModel } from '../models/user.model'
import { FileModel } from '../models/file.model'
import { Quiz } from '../models/quiz.model'
import { Question } from '../models/question.model'

async function seed() {
  // 0️⃣ Kết nối DB: dùng MONGODB_URI + DATABASE_NAME giống CONNECT_DB
  if (!env.MONGODB_URI) {
    console.error('❌ env.MONGODB_URI is missing')
    process.exit(1)
  }

  console.log('🚀 Seed connecting to:', env.MONGODB_URI, 'db =', env.DATABASE_NAME)

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.DATABASE_NAME
  })
  console.log('✅ Connected to MongoDB for seeding')

  // 1️⃣ Tạo user demo (nếu chưa có)
  const email = 'student1@example.com'

  let user = await UserModel.findOne({ email })
  if (!user) {
    user = await UserModel.create({
      name: 'Student One',
      email,
      createdAt: new Date()
    })
    console.log('✅ Created user:', user._id)
  } else {
    console.log('ℹ️ User already exists:', user._id)
  }

  // 2️⃣ Tạo folder gốc & file demo gắn với user
  // 2.1 Folder
  let rootFolder = await FileModel.findOne({
    name: 'My Documents',
    userId: user._id,
    type: 'folder'
  })

  if (!rootFolder) {
    rootFolder = await FileModel.create({
      name: 'My Documents',
      type: 'folder',
      storagePath: null,
      parentId: null,
      children: [],
      summary_content: 'Thư mục gốc chứa tài liệu học tập của sinh viên.',
      userId: user._id
    })
    console.log('✅ Created root folder:', rootFolder._id)
  } else {
    console.log('ℹ️ Root folder already exists:', rootFolder._id)
  }

  // 2.2 File trong folder
  let oopFile = await FileModel.findOne({
    name: 'OOP_Chapter1.pdf',
    userId: user._id,
    type: 'file'
  })

  if (!oopFile) {
    oopFile = await FileModel.create({
      name: 'OOP_Chapter1.pdf',
      type: 'file',
      storagePath: 'uploads/oop/OOP_Chapter1.pdf', // ví dụ, tùy bạn
      parentId: rootFolder._id,
      children: [],
      summary_content:
        'Chương 1: Giới thiệu về lập trình hướng đối tượng, class, object, thuộc tính, phương thức.',
      userId: user._id
    })
    console.log('✅ Created file:', oopFile._id)

    // thêm vào children của folder
    rootFolder.children.push(oopFile._id as any)
    await rootFolder.save()
    console.log('✅ Updated root folder children')
  } else {
    console.log('ℹ️ File already exists:', oopFile._id)
  }

  // 3️⃣ Tạo quiz cho file OOP_Chapter1
  let quiz = await Quiz.findOne({
    name: 'Quiz OOP Chương 1',
    fileId: oopFile._id
  })

  if (!quiz) {
    quiz = await Quiz.create({
      name: 'Quiz OOP Chương 1',
      fileId: oopFile._id,
      content:
        'Bộ câu hỏi trắc nghiệm kiểm tra kiến thức cơ bản về lập trình hướng đối tượng chương 1.',
      level: 'ez',
      highestScore: 8 // ví dụ
    })
    console.log('✅ Created quiz:', quiz._id)
  } else {
    console.log('ℹ️ Quiz already exists:', quiz._id)
  }

  // 4️⃣ Seed câu hỏi + đáp án (embedded)
  const existingQuestions = await Question.countDocuments({
    quizId: quiz._id
  })

  if (existingQuestions === 0) {
    const questionsData = [
      {
        name: 'Câu 1',
        question: 'Đối tượng (object) trong OOP là gì?',
        quizId: quiz._id,
        answers: [
          {
            content: 'Là một biến toàn cục trong chương trình.',
            isCorrect: false
          },
          {
            content:
              'Là một thực thể cụ thể được tạo ra từ class, có trạng thái và hành vi.',
            isCorrect: true
          },
          {
            content: 'Là một hàm dùng để xử lý dữ liệu.',
            isCorrect: false
          },
          {
            content: 'Là một kiểu dữ liệu nguyên thủy.',
            isCorrect: false
          }
        ]
      },
      {
        name: 'Câu 2',
        question: 'Class trong lập trình hướng đối tượng được hiểu là:',
        quizId: quiz._id,
        answers: [
          {
            content: 'Một đối tượng cụ thể trong bộ nhớ.',
            isCorrect: false
          },
          {
            content: 'Một khuôn mẫu (template) để tạo ra các đối tượng cùng loại.',
            isCorrect: true
          },
          {
            content: 'Một hằng số dùng chung cho mọi đối tượng.',
            isCorrect: false
          },
          {
            content: 'Một module chứa hàm main của chương trình.',
            isCorrect: false
          }
        ]
      },
      {
        name: 'Câu 3',
        question:
          'Thuộc tính (attribute/field) của một đối tượng dùng để biểu diễn điều gì?',
        quizId: quiz._id,
        answers: [
          {
            content: 'Hành động mà đối tượng có thể thực hiện.',
            isCorrect: false
          },
          {
            content: 'Dữ liệu mô tả trạng thái của đối tượng.',
            isCorrect: true
          },
          {
            content: 'Tên của class chứa đối tượng đó.',
            isCorrect: false
          },
          {
            content: 'Loại dữ liệu của biến cục bộ.',
            isCorrect: false
          }
        ]
      }
    ]

    const insertedQuestions = await Question.insertMany(questionsData)
    console.log('✅ Inserted questions:', insertedQuestions.length)
  } else {
    console.log('ℹ️ Questions already seeded for this quiz')
  }

  await mongoose.disconnect()
  console.log('✅ Seed done & disconnected')
}

seed().catch((err) => {
  console.error('❌ Seed error:', err)
  mongoose.disconnect()
})
