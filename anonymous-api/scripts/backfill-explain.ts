/*
  Backfill script: update Question.explain for existing questions by matching quizId + question text.
  Usage (from repo root):
    # ensure env vars (MONGODB_URI, DATABASE_NAME) are set in .env
    # run with ts-node: npx ts-node scripts/backfill-explain.ts
    # or compile and run with node
*/
import CONNECT_DB from '~/src/config/mongodb'
import { Question } from '~/src/models/question.model'
import { Types } from 'mongoose'

const quizId = '6918d3c350a43cee42662783'

const items: { question: string; explain: string }[] = [
  {
    question: "What is the creation date of the 'Proposal OChapter & OClan Q420251020' document?",
    explain: "The document states 'Created on: 16/10/2025' on page 1."
  },
  {
    question: "Which of the following is NOT listed as a Meeting Goal for 'OChapter & OClan Q420251020'?",
    explain: "Page 2 lists the goals as '1. Present OChapter & OClan 2.0 Proposal' and '2. Align with BD to initiate the program'. Discussing financial cost is not explicitly mentioned as a meeting goal."
  },
  {
    question: 'According to the Business Context, what type of organizational model does GEEK Up follow?',
    explain: "Page 6 states 'GEEK Up theo đuổi mô hình tổ chức phẳng (Flat).'"
  },
  {
    question: 'What is a primary responsibility of Chapter members regarding the Delivery Squad?',
    explain: "Page 9 states 'Chapter members: Hỗ trợ nhau về Ways of Working, Methodology có liên quan đến chuyên môn; Nắm bắt tình hình nguồn lực & năng lực của nhau để lên kế hoạch dự án'."
  },
  {
    question: 'According to the Business Rules, which type of member does NOT need to grasp information and participate in Clan & Chapter activities?',
    explain: "Page 11 states 'Assistant members không cần nắm bắt thông tin & tham gia hoạt động của Clan & Chapter'."
  },
  {
    question: 'What is the stated goal for building OChapter & OClan 2.0?',
    explain: "Page 15, under 'Program Overview', states the Goal: 'Build OChapter & OClan 2.0 that provides essential information for Clan & Chapter members (Pig, Chicken) to take suitable actions in contributing to the circles.'"
  },
  {
    question: "What is the specific objective related to 'Transparency' for OChapter & OClan 2.0?",
    explain: "Page 15, under 'Objectives', states 'Transparency: Ensure 100% of Clan & Chapter members can access all essential information related to their own Clan/Chapter — including members, roles, missions, projects, and workloads.'"
  },
  {
    question: 'What is the planned duration for the OChapter & OClan 2.0 program?',
    explain: "Page 16, under 'Deliverables & Milestones', explicitly states 'Duration: 20/10/2025 - 28/12/2025'."
  },
  {
    question: 'What is the total estimation in points for the OChapter & OClan Q420251020 program?',
    explain: "Page 17, under 'Scope & Cost', lists 'Total Estimation: 2306 pts'."
  },
  {
    question: "What is the first 'Next Step' listed after the meeting?",
    explain: "Page 23, under 'Next Steps', lists '1. Mail to PR for process update project OChapter & OClan 2.0 PI (after meeting)' as the first step."
  }
]

async function run() {
  await CONNECT_DB()

  const qid = new Types.ObjectId(quizId)

  for (const item of items) {
    const res = await Question.updateOne(
      { quizId: qid, question: item.question },
      { $set: { explain: item.explain } }
    )
    if ((res as any).matchedCount === 0) {
      console.log('No match for question:', item.question)
    } else {
      console.log('Updated explain for question:', item.question)
    }
  }

  console.log('Done')
  process.exit(0)
}

run().catch((err) => {
  console.error('Backfill failed', err)
  process.exit(1)
})
