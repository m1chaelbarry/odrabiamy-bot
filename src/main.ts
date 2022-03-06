import { Client, Message, Intents } from 'discord.js';
import { apiSolution, ExerciseDetails } from "./types";
import renderScreenshot from './renderScreeshot'

import config from './config'
import axios from 'axios';

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });

export function ready(): void {
    console.log(`Logged in as ${client.user.tag}`)
}

client.on('ready', ready);
client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!config.channels.includes(message.guild!.id)) return;
    if (message.content.includes('odrabiamy.pl')) { await odrabiamyCommand(message) }
    if (message.content.includes('#!')) { await gowno(message) }

    
})

async function gowno(message: Message) {
    const snd = String(message).substring(2)
    message.delete()
    await message.channel.send(snd)
}

// main odrabiamy stuff
async function odrabiamyCommand(message: Message) {
    const urlArgs = message.content.split('odrabiamy.pl')[1].split('/');
    const exerciseDetails: ExerciseDetails = {
        bookID: urlArgs[2].split('-')[1],
        page: urlArgs[3].split('-')[1],
        exerciseID: urlArgs[4]?.split('-')[1],
    }
    await message.channel.send('https://emoji.gg/assets/emoji/loading.gif')
    const emoji = message.channel.lastMessage
    await message.delete() 
    const author = message.author.tag
    const response = await getResponse(exerciseDetails);
    const book_name = response.data.data[0].book.name

    if (message.content.includes('!str')) {


        for (let num = 0; num < response.data.data.length; num++) {
            let solution = response.data.data[num].solution;
            solution = encodeURI(solution);
            solution = decodeURI(solution);
            const excercise_number = response.data.data[num].number;
            const page_number = exerciseDetails.page
            const solutionScreenshot = await renderScreenshot(solution, excercise_number, page_number, author, book_name)
            markAsVisited(response.data.data[num].id, config.odrabiamyAuth);
            if (!solutionScreenshot) break;
        
            await message.channel.send({
                files: [solutionScreenshot],
            })
        }

    } else if (message.content.includes('!split')) {

        const response = await getResponse(exerciseDetails);

        let solution = exerciseDetails.exerciseID
        ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].solution
        : response.data.data[0].solution;
        solution = encodeURI(solution);
        solution = decodeURI(solution)

        const excercise_number = exerciseDetails.exerciseID 
            ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].number
            : response.data.data[0].number;

        const page_number = exerciseDetails.page

        const subsection = solution.split('<hr>')

        for (const element of subsection){
            const solutionScreenshot = await renderScreenshot(element, excercise_number, page_number, author, book_name)
            markAsVisited(exerciseDetails.exerciseID ? exerciseDetails.exerciseID : response.data.data[0].id, config.odrabiamyAuth);
            if (!solutionScreenshot) return
    
            await message.channel.send({
                files: [solutionScreenshot],
            })
        }

    } else {

        const response = await getResponse(exerciseDetails);

        let solution = exerciseDetails.exerciseID
            ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].solution
            : response.data.data[0].solution;

        const excercise_number = exerciseDetails.exerciseID 
            ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].number
            : response.data.data[0].number;

        const page_number = exerciseDetails.page

        const solutionScreenshot = await renderScreenshot(solution, excercise_number, page_number, author, book_name)
        markAsVisited(exerciseDetails.exerciseID ? exerciseDetails.exerciseID : response.data.data[0].id, config.odrabiamyAuth);
        if (!solutionScreenshot) return

        await message.channel.send({
            files: [solutionScreenshot],
        })
    }

    // } else {
        
    //     const solutionScreenshot: Buffer | null = await odrabiamy(exerciseDetails, config.odrabiamyAuth);
        
    //         if (!solutionScreenshot) return 
        
    //         await message.channel.send({
    //             files: [solutionScreenshot],
    //         })
    // }
    if (emoji) {emoji.delete()}

}
//things for odrabiamyCommand
async function getResponse(exerciseDetails: ExerciseDetails) {
    return await axios.request({
        method: 'GET',
        url: `https://odrabiamy.pl/api/v2/exercises/page/premium/${exerciseDetails.page}/${exerciseDetails.bookID}`,
        headers: {
            'user-agent': 'new_user_agent-huawei-142',
            Authorization: `Bearer ${config.odrabiamyAuth}`
        }
    });
}

//things for odrabiamyCommand
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


client.login(config.token)