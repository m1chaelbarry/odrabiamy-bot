import { Client, Message, Intents, TextChannel } from 'discord.js';
import { apiSolution, ExerciseDetails } from "./types";
import renderScreenshot from './renderScreeshot'
import fs from 'fs';
import config from './config'
import axios from 'axios';

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });

// path to logChannel.json one dir higher using __dirname 
const logChannelPath = `${__dirname}/../logChannel.json`


export function ready(): void {
    console.log(`Logged in as ${client.user.tag} at ${getCurrentTime()}`)
    // if file exists
    if (fs.existsSync(logChannelPath)) {
        const channel = JSON.parse(fs.readFileSync(logChannelPath).toString()).logChannel[0]
        // send message to logging channel
        const channelobj = client.channels.cache.get(channel) as TextChannel
        channelobj.send(`Bot turning on. Logged in as ${client.user.tag} at ${getCurrentTime()}`)
    }
}

client.once('ready', ready);
client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!config.channels.includes(message.guild!.id)) return;
    if (message.content.startsWith('!loggingchannel')) { await setLoggingChannel(message); }
    if (message.content.includes('odrabiamy.pl/pytania-i-odpowiedzi/')) { await warning(message); return} 
    if (message.content.includes('odrabiamy.pl')) { await odrabiamyCommand(message) }
    if (message.content.startsWith('#!')) { await copycat(message) }
    if (message.content.startsWith('!odrabiamyhelp')) { await helpCommand(message); }

})

// main odrabiamy stuff
async function odrabiamyCommand(message: Message) {
    // check if message is in correct form, if not send message
    // odrabiamy.pl/(string)/ksiazka-(number)/strona-(number)
    const regex = /odrabiamy.pl\/(.*)\/ksiazka-(.*)\/strona-(.*)/
    const match = regex.exec(message.content)
    if (!match) {
        await message.channel.send(`${message.author}! Coś jest nie tak z linkiem`)
        return
    }

    const urlArgs = message.content.split('odrabiamy.pl')[1].split('/');
    const exerciseDetails: ExerciseDetails = {
        bookID: urlArgs[2].split('-')[1],
        page: urlArgs[3].split('-')[1],
        exerciseID: urlArgs[4]?.split('-')[1],
    }

    await message.channel.send('https://emoji.gg/assets/emoji/loading.gif')
    const emoji = message.channel.lastMessage
    const response = await getResponse(exerciseDetails);
    const book_name = response.data.data[0].book.name
    const author = message.author.tag
    console.log(`${author} requested ${message.content} at ${getCurrentTime()}`)

    if (message.content.includes('!str')) {
        
        for (let num = 0; num < response.data.data.length; num++) {
            let solution = response.data.data[num].solution;
            solution = encodeURI(solution);
            solution = decodeURI(solution);
            const excercise_number = response.data.data[num].number;
            const page_number = exerciseDetails.page
            const solutionScreenshot = await renderScreenshot(solution, excercise_number, page_number, book_name)
            await markAsVisited(response.data.data[num].id, config.odrabiamyAuth);
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
            const solutionScreenshot = await renderScreenshot(element, excercise_number, page_number, book_name)
            await markAsVisited(exerciseDetails.exerciseID ? exerciseDetails.exerciseID : response.data.data[0].id, config.odrabiamyAuth);
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
        
        const solutionScreenshot = await renderScreenshot(solution, excercise_number, page_number, book_name)
        await markAsVisited(exerciseDetails.exerciseID ? exerciseDetails.exerciseID : response.data.data[0].id, config.odrabiamyAuth);
        if (!solutionScreenshot) return
        
        await message.channel.send({
            files: [solutionScreenshot],
        })
    }
    
    await message.delete() 
    if (emoji) {emoji.delete()}

}

async function getResponse(exerciseDetails: ExerciseDetails) {
    return await axios.request({
        method: 'GET',
        url: `https://odrabiamy.pl/api/v2/exercises/page/premium/${exerciseDetails.page}/${exerciseDetails.bookID}`,
        headers: {
            'user-agent': 'new_user_agent-android-3.3.6',
            Authorization: `bearer ${config.odrabiamyAuth}`
        }
    });
}

async function markAsVisited(exerciseID: string, authorization: string) {
    axios.request({
        method: 'POST',
        url: `https://odrabiamy.pl/api/v2/exercises/${exerciseID}/visited`,
        headers: {
            'user-agent': 'new_user_agent-android-3.3.6',
            Authorization: `bearer ${authorization}`,
        }
    })
}

function getCurrentTime() {   
    var date_ob = new Date();
    var day = ("0" + date_ob.getDate())         .slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    
    var hours =     (date_ob.getHours() + 2).toString();
    var minutes = (date_ob.getMinutes())    .toString();
    var seconds = (date_ob.getSeconds())    .toString();
    
    if (hours.length < 2)   { hours = "0"   + hours;   }
    if (minutes.length < 2) { minutes = "0" + minutes; }
    if (seconds.length < 2) { seconds = "0" + seconds; }
    
    var dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return dateTime
} 

async function warning(message: Message) {
    // respond to message
    await message.channel.send(`${message.author}! Bot nie działa na pytania i odpowiedzi`)
}

async function setLoggingChannel(message: Message) {
    const channel = message.channel.id
    // write channel id to file
    fs.writeFileSync(logChannelPath, JSON.stringify({logChannel: [channel]}))
    // send message to channel
    await message.channel.send(`Logging channel set to ${message.channel}`)
}

async function copycat(message: Message) {
    const snd = String(message).substring(2)
    message.delete()
    await message.channel.send(snd)
}   

async function helpCommand(message: Message) {
    message.delete()
    // send message to channel
    await message.channel.send(`
wyslij linka z zadaniem z odrabiamy, a bot ci wyśle odpowiedz
!str <link> - wysyła całą stronę
!split <link> - wysyła całą stronę podzieloną na podpunkty
!odrabiamyhelp - wysyła tą wiadomość
!loggingchannel - wysyła kanał na którym bot będzie wysyłał logi
#! bot wysyła to co ty
`)
}

client.login(config.token)
