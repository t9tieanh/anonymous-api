import RabbitClient from '~/config/rabbitmq'
import { QueueNameEnum } from '~/enums/rabbitQueue.enum'
import { extractTextFromFile } from '~/utils/fileParser'
import { summarizeText } from '~/services/summarize.service'
import axios from 'axios'
import fs from 'fs'
import os from 'os'
import path from 'path'
import stream from 'stream'
import { promisify } from 'util'
import { FileModel } from '~/models/file.model'

const pipeline = promisify(stream.pipeline)

const downloadToTmp = async (url: string): Promise<{ path: string; mimetype?: string }> => {
  if (!url) throw new Error('No URL provided')
  const res = await axios.get(url, { responseType: 'stream' })
  const contentType = res.headers['content-type'] as string | undefined
  const ext = contentType ? `.${(contentType.split('/')[1] || '').split(';')[0]}` : ''
  const tmpName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const dest = path.join(os.tmpdir(), tmpName)
  await pipeline(res.data as stream.Readable, fs.createWriteStream(dest))
  return { path: dest, mimetype: contentType }
}

const start = async () => {
  await RabbitClient.getInstance()

  await RabbitClient.registerConsumer<{ fileId?: string; cloudinaryUrl?: string; userId?: string; mimeType?: string }>(
    QueueNameEnum.FILE_PROCESS,
    '',
    '',
    async (envelope) => {
      console.log('Received envelope:', envelope)
      // envelope may be { type, payload } or a bare payload
      const envObj = envelope as unknown as { payload?: unknown }
      const payload = envObj.payload ?? (envelope as unknown)
      const p = payload as Record<string, unknown>

      const fileId = (p.fileId ?? p.id) as string | undefined
      const cloudinaryUrl = (p.cloudinaryUrl ?? p.url) as string | undefined

      try {
        let tmpPath: string | undefined
        let mimetype: string | undefined

        if (cloudinaryUrl) {
          const downloaded = await downloadToTmp(cloudinaryUrl)
          tmpPath = downloaded.path
          mimetype = downloaded.mimetype
        }

        if (!tmpPath) {
          console.warn('No file to process for payload', p)
          return
        }

        const text = await extractTextFromFile(tmpPath, mimetype || '')
        const { summary } = await summarizeText(text, process.env.GEMINI_API_KEY || '')

        console.log('Generated summary for fileId', fileId,'----', text, summary)

        // update file doc
        if (fileId) {
          await FileModel.findByIdAndUpdate(fileId, {
            $set: { summaryContent: summary },
            $inc: { summaryCount: 1 }
          })
        }

        // cleanup
        fs.unlink(tmpPath, () => {})
      } catch (err) {
        console.error('Error processing file job', err)
        throw err
      }
    }
  )
}

start().catch((err) => console.error('File consumer failed to start', err))
