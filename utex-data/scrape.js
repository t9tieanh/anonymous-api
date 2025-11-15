const fs = require("fs");
const puppeteer = require("puppeteer");
const { text } = require("stream/consumers");

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const cookies = JSON.parse(fs.readFileSync("cookies.json"));
    await page.setCookie(...cookies);

    await page.goto("https://utexlms.hcmute.edu.vn/my/courses.php", {
        waitUntil: "networkidle2"
    });

    await page.waitForSelector("div.sr-only");

    // Chỉ lấy thẻ bắt đầu bằng 'Remove star for'
    const data = await page.evaluate(() => {
        return [...document.querySelectorAll("div.sr-only")]
            .map(el => el.innerText.trim())
            .filter(text => text.startsWith("Remove star for"))
            .filter(text => !text.startsWith("Remove star for Sinh") && !text.startsWith("Remove star for Cuộc"))
            .map(text => {
                // Xóa phần "Remove star for "
                let cleaned = text.replace("Remove star for ", "");

                if (cleaned.includes("_")) {
                    cleaned = cleaned.split("_")[0].trim();
                }

                return cleaned;
            });
    });

    console.log(data);

    fs.writeFileSync("remove_star.json", JSON.stringify(data, null, 2), "utf-8");

    await browser.close();
})();
