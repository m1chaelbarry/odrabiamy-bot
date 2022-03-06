import puppeteer from 'puppeteer'

export default function getExerciseImage(solution: string, excercise_number: string, page_number: string, author: string, book_name: string): Promise<Buffer | null> {
    return new Promise(async (resolve) => {

        
        const browser = await puppeteer.launch({timeout: 100000, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.setViewport({width: 780, height: 1});
        let decoded_solution = solution
        decoded_solution = `<h1 style="font-size:30;"> ${excercise_number}/${page_number} </h1>` + decoded_solution
        decoded_solution = `<style>html * {font-family: MulishVariable,sans-serif;${decoded_solution.includes('class="math') ? '' : 'background: #36393E; color: #FFFFFF'};}</style>` + decoded_solution
        decoded_solution = decoded_solution.replaceAll(/<object class="math small".*?>/g, '')
        decoded_solution = decoded_solution + `<p style="text-align: right; font-size: xx-small; color: #7F7F7F;"> ${book_name} &emsp;&emsp;&emsp;&emsp; ${author} </p>`
        const loaded = page.waitForNavigation({waitUntil: 'load'});
        const loaded2 = page.waitForTimeout(2500)
        await page.setContent(decoded_solution, {waitUntil: 'networkidle0'});
        await loaded2;
        await loaded
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        await page.setViewport({width: bodyWidth, height: bodyHeight});
        const screenshot = await page.screenshot({fullPage: true})

        if (Buffer.isBuffer(screenshot)) {
            resolve(screenshot)
        } else {
            resolve(null)
        }

        await browser.close();


    });
}


