import { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/middleware/ApiError'

const isCloudinaryHost = (host?: string) => {
  if (!host) return false
  return host.includes('cloudinary.com') || host.includes('res.cloudinary.com')
}

const getCloudinaryFile = async (req: Request, res: Response, next: NextFunction) => {
  const url = String(req.query.url || '')
  if (!url) return next(new ApiError(StatusCodes.BAD_REQUEST, 'Tham số `url` là bắt buộc'))

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return next(new ApiError(StatusCodes.BAD_REQUEST, 'URL không hợp lệ'))
  }

  if (!isCloudinaryHost(parsedUrl.hostname)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Chỉ cho phép lấy file từ Cloudinary'))
  }

  try {
    // Forward Range header if present (supports resume / partial content for PDF previews)
    const forwardHeaders: Record<string, string> = {}
    if (req.headers.range) forwardHeaders.Range = String(req.headers.range)

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: forwardHeaders,
      // allow 200 and 206
      validateStatus: (status) => status >= 200 && status < 400,
      timeout: 30_000
    })

    // Forward status (200 or 206) and important headers
    res.status(response.status)

    const ct = response.headers['content-type']
    const cl = response.headers['content-length']
    const cr = response.headers['content-range']
    const ar = response.headers['accept-ranges']

    if (ct) res.setHeader('Content-Type', ct)
    if (cr) res.setHeader('Content-Range', cr)
    if (cl) res.setHeader('Content-Length', cl)
    if (ar) res.setHeader('Accept-Ranges', ar)

    // Prefer inline disposition so browsers can render PDFs in iframe/object/embed
    res.setHeader('Content-Disposition', 'inline')

    // Remove common frame-blocking headers if they were set earlier by any middleware
    // (ensure our response does not carry X-Frame-Options / CSP that would block embedding)
    try {
      res.removeHeader('X-Frame-Options')
      res.removeHeader('x-frame-options')
      res.removeHeader('Content-Security-Policy')
      res.removeHeader('content-security-policy')
      res.removeHeader('X-Content-Security-Policy')
      res.removeHeader('x-content-security-policy')
    } catch {
      // ignore if removeHeader is not available or headers already sent
    }

    // Stream directly to client
    const stream = response.data as NodeJS.ReadableStream
    stream.on('error', (err) => {
      next(err)
    })
    stream.pipe(res)
  } catch {
    return next(new ApiError(StatusCodes.BAD_GATEWAY, 'Lấy file từ Cloudinary thất bại'))
  }
}

export default {
  getCloudinaryFile
}
