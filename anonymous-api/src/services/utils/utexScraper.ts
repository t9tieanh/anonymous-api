import fs from 'fs'
import path from 'path'
import puppeteer, { Protocol } from 'puppeteer'

// Scrape starred course names from UTEX LMS using saved cookies
// Returns a list of subject names (strings)
export async function scrapeUtexSubjects(): Promise<string[]> {
    // Resolve path to cookies.json in ../utex-data
    const cookiesPath = path.resolve(__dirname, '../../../..', 'utex-data', 'cookies.json')

    if (!fs.existsSync(cookiesPath)) {
        throw new Error(`cookies.json not found at ${cookiesPath}`)
    }

    const cookies: Protocol.Network.CookieParam[] = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'))

    const browser = await puppeteer.launch({ headless: 'new' })
    try {
        const page = await browser.newPage()

        if (Array.isArray(cookies) && cookies.length > 0) {
            await page.setCookie(...cookies)
        }

        await page.goto('https://utexlms.hcmute.edu.vn/my/courses.php', {
            waitUntil: 'networkidle2'
        })

        await page.waitForSelector('div.sr-only', { timeout: 15000 })

        const names = await page.evaluate(() => {
            const arr = Array.from(document.querySelectorAll('div.sr-only'))
                .map((el) => (el as HTMLElement).innerText.trim())
                .filter((t) => t.startsWith('Remove star for'))
                .filter((t) => !t.startsWith('Remove star for Sinh') && !t.startsWith('Remove star for Cuộc'))
                .map((t) => {
                    let cleaned = t.replace('Remove star for ', '')
                    if (cleaned.includes('_')) cleaned = cleaned.split('_')[0].trim()
                    return cleaned.trim()
                })
            return Array.from(new Set(arr))
        })

        return names
    } finally {
        await browser.close()
    }
}
