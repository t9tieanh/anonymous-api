/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

export interface TranslateParams {
    content: string
    targetLang: 'en' | 'vi' | 'zh' | string
    apiKey: string
    model?: string
}

const DEFAULT_MODEL = 'gemini-2.5-flash'
const ENDPOINT = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const stripFences = (s: string): string => {
    if (!s) return ''
    // remove code fences if any
    s = s.replace(/```(?:html|json)?/g, '').trim()
    // remove surrounding quotes
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1)
    }
    return s
}

const extractLikelyHtml = (s: string): string => {
    const first = s.indexOf('<')
    const last = s.lastIndexOf('>')
    if (first !== -1 && last !== -1 && last > first) {
        return s.slice(first, last + 1)
    }
    return s
}

const buildPrompt = (content: string, targetLang: string): string => {
    return `You are a professional HTML-aware translator.
Translate ONLY the human-readable text nodes of the provided HTML into the target language: ${targetLang}.

STRICT rules:
- Do NOT modify, translate, remove, or add any HTML tags (e.g., div, p, span, strong, em, a, ul, li, h1-h6, br, etc.).
- Do NOT change tag names, attributes, attribute values, classes, ids, inline styles, data-* attributes, or URLs.
- Preserve whitespace, line breaks, emoji, entity references, and punctuation.
- Keep the original HTML structure and ordering exactly the same.
- Output ONLY the translated HTML string with tags intact (no markdown, no commentary).

Examples:
Input (vi -> en):
  <p class="lead">Xin chào <strong>thế giới</strong>!</p>
Output:
  <p class="lead">Hello <strong>world</strong>!</p>

Input (en -> zh):
  <li class="item">Create slides automatically.</li>
Output:
  <li class="item">自动创建幻灯片。</li>

Now translate the following HTML strictly by the rules:
HTML START
${content}
HTML END`
}

export const translateHtml = async ({ content, targetLang, apiKey, model }: TranslateParams): Promise<string> => {
    const mdl = model || DEFAULT_MODEL
    const endpoint = ENDPOINT(mdl)

    const prompt = buildPrompt(content, targetLang)

    const response = await axios.post(
        endpoint,
        {
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.2,
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
    const raw = candidates[0].content.parts.map((p: any) => p.text).join('')
    const cleaned = extractLikelyHtml(stripFences(raw))
    return cleaned
}
