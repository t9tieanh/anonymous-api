/* eslint-disable no-useless-escape */
import axios from 'axios'

export interface SummarizeResult {
  summary: string
  aiMatchScore: number // 0..1 similarity between original text and summarized content
}

export const summarizeText = async (text: string, apiKey: string): Promise<SummarizeResult> => {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

  // Prompt hướng dẫn model xuất HTML + Tailwind + icon, nhận biết ngôn ngữ
  const prompt = `
You are an AI assistant that generates a **faithful summary** of the input text in **HTML format** using **TailwindCSS classes**. 
Your goal is to produce a summary that is as close as possible to the original content, capturing all key points and details, but shorter than the original. 
Do not omit important information. Do not hallucinate. 

Requirements:
1. Detect the language of the input text automatically, and indicate it at the top in a <p> with class "text-sm text-gray-500". Example: <p class="text-sm text-gray-500">Language: Vietnamese 🇻🇳</p>
2. Wrap main titles in <h1>, subtitles or section headings in <h2>, subpoints in <p> or <li>.
3. Add icons (emoji or <svg> placeholders) to make the content visually clear and easy to read.
4. Do not include raw newline characters (\n). Use proper HTML structure (<p>, <li>, <br>) for spacing.
5. Use Tailwind classes for padding, margins, colors, fonts as appropriate.
6. Keep the summary **concise but faithful**: include all main ideas and key details, shorten only redundant or repetitive content.
7. Output clean HTML only, ready to render in a browser. No additional text or explanation outside HTML.

Example output:
<p class="text-sm text-gray-500">Language: English 🇺🇸</p>
<h1 class="text-2xl font-bold mb-4">Hello 📘</h1>
<p class="text-base text-gray-700">I AM SANG ✏️</p>

Text to summarize:
${text}
`

  const response = await axios.post(
    endpoint,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        candidateCount: 1
      }
    },
    {
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    }
  )

  const candidates = response.data?.candidates
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidate returned from Gemini API')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = candidates[0].content.parts.map((part: any) => part.text).join('')

  const cleanHtmlOutput = (s: string): string => {
    if (!s) return ''
    s = s.replace(/```html|```/g, '')
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1)
    }
    s = s
      .replace(/\\\"/g, '"')
      .replace(/\"/g, '"')
      .replace(/\\n/g, '')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .replace(/\\/g, '')
      .replace(/\r?\n|\r/g, '')
    // Gom khoảng trắng
    s = s.replace(/\s{2,}/g, ' ').trim()
    return s
  }

  const summary = cleanHtmlOutput(output)

  // Tính điểm tương đồng đơn giản (Jaccard) giữa văn bản gốc và bản tóm tắt (đã loại HTML)
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ')
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ') // bỏ ký tự không phải chữ/số (unicode)
      .replace(/\s{2,}/g, ' ')
      .trim()

  const toSet = (s: string) => new Set(normalize(s).split(' ').filter(Boolean))
  const originalSet = toSet(text || '')
  const summarySet = toSet(stripHtml(summary))
  const unionSize = new Set([...originalSet, ...summarySet]).size
  const intersectionSize = [...summarySet].filter((w) => originalSet.has(w)).length
  const aiMatchScore = unionSize === 0 ? 0 : intersectionSize / unionSize

  return { summary, aiMatchScore }
}
