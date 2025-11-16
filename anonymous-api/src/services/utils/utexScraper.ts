import fs from 'fs'
import path from 'path'
import puppeteer, { Protocol } from 'puppeteer'

export async function scrapeUtexSubjects(): Promise<string[]> {
  const cookiesPath = path.resolve(__dirname, '../../../..', 'utex-data', 'cookies.json')

  if (!fs.existsSync(cookiesPath)) {
    throw new Error(`cookies.json not found at ${cookiesPath}`)
  }

  const cookies: Protocol.Network.CookieParam[] = JSON.parse(
    fs.readFileSync(cookiesPath, 'utf-8')
  )

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // userAgent giống Chrome thật để server không phân biệt
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    if (Array.isArray(cookies) && cookies.length > 0) {
      await page.setCookie(...cookies)
    }

    await page.goto('https://utexlms.hcmute.edu.vn/my/courses.php', {
      waitUntil: 'networkidle2'
    })

    const currentUrl = page.url()
    console.log('[UTEX] Current URL after goto:', currentUrl)

    const html = await page.content()
    const debugPath = path.resolve(__dirname, '../../../..', 'utex-data', 'debug-utex.html')
    fs.writeFileSync(debugPath, html, 'utf-8')
    console.log('[UTEX] Saved debug HTML to', debugPath)

    if (currentUrl.includes('login')) {
      console.log('[UTEX] Redirected to login page -> cookie hết hạn / không hợp lệ')
      return []
    }

    // ⚠️ TỪ ĐÂY TRỞ XUỐNG: KHÔNG DÙNG DOM NỮA, GỌI THẲNG WEB SERVICE
    const names = await page.evaluate(async () => {
      try {
        // @ts-ignore M là object global của Moodle
        const Mcfg = (window as any).M?.cfg
        if (!Mcfg || !Mcfg.sesskey) {
          console.log('[UTEX] M.cfg.sesskey not found')
          return [] as string[]
        }

        const sesskey = Mcfg.sesskey
        console.log('[UTEX] sesskey in page:', sesskey)

        const payload = [
          {
            index: 0,
            methodname: 'core_course_get_enrolled_courses_by_timeline_classification',
            args: {
              offset: 0,
              limit: 0,
              classification: 'all',
              sort: 'fullname',
              customfieldname: '',
              customfieldvalue: ''
            }
          }
        ]

        const res = await fetch(
          'https://utexlms.hcmute.edu.vn/lib/ajax/service.php?sesskey=' +
            encodeURIComponent(sesskey) +
            '&info=core_course_get_enrolled_courses_by_timeline_classification',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            credentials: 'same-origin'
          }
        )

        if (!res.ok) {
          console.log('[UTEX] service.php HTTP error:', res.status)
          return [] as string[]
        }

        const json = (await res.json()) as any[]
        console.log('[UTEX] service raw json length:', JSON.stringify(json).length)

        const courses = json?.[0]?.data?.courses
        if (!Array.isArray(courses)) {
          console.log('[UTEX] no courses array in service response')
          return [] as string[]
        }

        const rawNames = courses
          .map((c: any) => (typeof c.fullname === 'string' ? c.fullname.trim() : ''))
          .filter(Boolean)

        // Lọc bớt mấy cái ngoại khóa / sinh hoạt nếu muốn
        const filtered = rawNames.filter((t) => {
          const lower = t.toLowerCase()
          if (lower.startsWith('sinh hoat') || lower.startsWith('sinh hoạt')) return false
          if (lower.startsWith('cuoc thi') || lower.startsWith('cuộc thi')) return false
          return true
        })

        // Xoá trùng
        return Array.from(new Set(filtered))
      } catch (e) {
        console.error('[UTEX] error in page.evaluate:', e)
        return [] as string[]
      }
    })

    console.log('[UTEX] scraped subject names:', names)
    return names
  } catch (err) {
    console.error('[UTEX] scrape error:', err)
    return []
  } finally {
    await browser.close()
  }
}
