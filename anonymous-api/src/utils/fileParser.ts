import fs from 'fs'
import * as DocxParser from 'docx-parser'
import { PDFParse } from 'pdf-parse'

export const extractTextFromFile = async (filePath: string, mimetype: string): Promise<string> => {
  if (mimetype === 'application/pdf') {
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const parser = new PDFParse({ data: dataBuffer })
      try {
        const textResult = await parser.getText()
        return textResult.text || ''
      } finally {
        await parser.destroy()
      }
    } catch (err) {
      throw new Error('Failed to parse PDF: ' + (err as Error).message)
    }
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return new Promise<string>((resolve, reject) => {
      try {
        DocxParser.parseDocx(filePath, (data: string) => {
          resolve(data || '')
        })
      } catch (err) {
        reject(new Error('Failed to parse DOCX: ' + (err as Error).message))
      }
    })
  } else {
    throw new Error('Unsupported file type')
  }
}
