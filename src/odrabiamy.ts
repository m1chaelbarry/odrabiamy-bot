import axios from 'axios';
import puppeteer from 'puppeteer'
import { ExerciseDetails, apiSolution } from "./types";

export default function getExerciseImage(exerciseDetails: ExerciseDetails, authorization: string): Promise<Buffer | null> {
    return new Promise(async (resolve) => {
        const response = await axios.request({
            method: 'GET',
            url: `https://odrabiamy.pl/api/v2/exercises/page/premium/${exerciseDetails.page}/${exerciseDetails.bookID}`,
            headers: {
                'user-agent': 'new_user_agent-huawei-142',
                Authorization: `Bearer ${authorization}`
            }
        });

        let solution = exerciseDetails.exerciseID
            ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].solution
            : response.data.data[0].solution;

        const excercise_number = exerciseDetails.exerciseID 
            ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].number
            : response.data.data[0].number;

        const page_number = exerciseDetails.page
        
        const browser = await puppeteer.launch({timeout: 100000, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.setViewport({width: 780, height: 1});
        solution = encodeURI(solution)
        let decoded_solution = decodeURI(solution)
        decoded_solution = `<h1 style="font-size:30;"> ${excercise_number}/${page_number} </h1>` + decoded_solution
        decoded_solution = `<style>html * {font-family: MulishVariable,sans-serif;${decoded_solution.includes('class="math') ? '' : 'background: #36393E; color: #FFFFFF;'}}</style>` + decoded_solution
        decoded_solution = decoded_solution.replaceAll(/<object class="math small".*?>/g, '')
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

        markAsVisited(exerciseDetails.exerciseID ? exerciseDetails.exerciseID : response.data.data[0].id, authorization)
    });
}

function markAsVisited(exerciseID: string, authorization: string) {
    axios.request({
        method: 'POST',
        url: `https://odrabiamy.pl/api/v2/exercises/${exerciseID}/visited`,
        headers: {
            'user-agent': 'new_user_agent-huawei-142',
            Authorization: `Bearer ${authorization}`,
        }
    })
}
