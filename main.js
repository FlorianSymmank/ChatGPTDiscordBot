const https = require('https');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials
} = require('discord.js');

const {
    Configuration,
    OpenAIApi
} = require('openai');

const client = new Client({
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates]
});

let data = {
    GPT_API_KEY: process.env.GPT_API_KEY,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN
};

const configuration = new Configuration({
    apiKey: data.GPT_API_KEY
});


const STUNDE = 60 * 60 * 1000;
const DOPPELREIM_INTERVALL = 2 * STUNDE;
const COMMANDS = ["!npc", "magische miesmuschel", "!complete", "!image"];
const CHATHISTORY = {}

let allowedChannels = process.env.ALLOWED_CHANNELS.split(' ');
let allowed_ids_for_dms = process.env.ALLOWED_IDS_FOR_DM.split(' ');
let excluded_users = process.env.BANNED_USERS.split(' ');

const DM_CHANNEL = 1;

const openai = new OpenAIApi(configuration);

//TODO: log/message me when added to new server to prevent missuse

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        const user = await client.users.fetch(process.env.OWNER_DISCORD_ID);
        user.send(":rocket: Meister ich bin wieder Online! :rocket:");
    } catch (error) {
        console.error('Error sending DM:', error);
    }

});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // Discard all dms not by me 
    if (message.channel.type === DM_CHANNEL) {
        handleDMs(message)
        return;
    }

    if (!allowedChannels.find(x => { return x == message.channel.id }))
        return;

    let l_msg = message.content.toLowerCase();
    // is command?
    if (COMMANDS.find(cmd => { return l_msg.startsWith(cmd) })) {

        await message.channel.sendTyping();
        if (isUserExcluded(message.author.id)) {
            sendMessage(message, "NO :clown:");
            return;
        }
        let response;
        if (l_msg.startsWith("!npc")) {
            response = await askNPC(message.content.substring(4), message);
        } else if (l_msg.startsWith("magische miesmuschel")) {
            response = await magischeMiesmuschel(message.content.substring(20));
        } else if (l_msg.startsWith("!complete")) {
            response = await complete(message.content.substring(9));
        } else if (l_msg.startsWith("!image")) {
            response = await generateImage(message.content.substring(6));
        }

        sendMessage(message, response);
        return;
    }
});

async function handleDMs(message) {

    await message.channel.sendTyping();
    if (isUserExcluded(message.author.id)) {
        sendMessage(message, "NO :clown:");
        return;
    }

    // jeder der nicht ich ist 
    if (!allowed_ids_for_dms.includes(message.author.id)) {
        sendMessage(message, "Yo bitte nicht direkt anquatschen UwU");

        const user = client.users.cache.get(process.env.OWNER_DISCORD_ID);

        if (!user)
            return;

        const dmChannel = await user.createDM();
        dmChannel.send(`${message.author.username} hat mir ne PM gesendet`);
        return
    }

    // ich
    response = await askNPC(message.content, message);
    sendMessage(message, response);

    return
}

function isUserExcluded(userID) {
    let isExcluded = excluded_users.find(user => { return user === userID });

    // crude log
    if (isExcluded)
        console.log(`${new Date().toJSON()} Banned Userid ${userID} tried to interact.`)

    return isExcluded
}

async function askNPC(prompt, message) {
    let messages = []

    let = system_prompt`  
*Du bist ein freundlicher und kompetenter Chatpartner mit einem starken Hintergrund in Informatik. Du begrüßt die Nutzer stets höflich und hilfsbereit. Dein Ziel ist es, Informationen so einfach und direkt wie möglich zu vermitteln, besonders bei technischen und informatischen Themenbereichen. Du strebst danach, komplexe Sachverhalte verständlich und klar zu erklären und bleibst dabei stets geduldig und freundlich. Folge stets diesen Richtlinien:*

1. *Begrüße die Nutzer höflich und mit einem freundlichen Ton.*
2. *Versuche, Fragen einfach und direkt zu beantworten.*
3. *Erkläre technische Konzepte in einer verständlichen Weise, ohne unnötigen Fachjargon.*
4. *Sei geduldig und hilfsbereit, insbesondere wenn der Nutzer Schwierigkeiten mit einem Thema hat.*
5. *Biete zusätzliche Hilfe oder Erklärungen an, wenn nötig.*

**Beispiel:**

*Nutzer: Kannst du mir erklären, was ein Algorithmus ist?*

*GPT: Natürlich! Ein Algorithmus ist im Wesentlichen eine Schritt-für-Schritt-Anleitung, die beschreibt, wie ein bestimmtes Problem gelöst werden kann. Stell dir vor, du möchtest einen Kuchen backen. Das Rezept dafür ist wie ein Algorithmus - es gibt dir genaue Anweisungen, welche Zutaten du brauchst und welche Schritte du befolgen musst, um den Kuchen zu backen. Genauso geben Algorithmen Computern Anweisungen, wie sie bestimmte Aufgaben erledigen sollen.*`
    
messages.push({ "role": "system", "content": system_prompt })

    // letzten 10 nachrichten
    if (CHATHISTORY[message.channelId])
        messages = CHATHISTORY[message.channelId].slice(-10);

    messages.push({ "role": "user", "content": prompt })

    let response = await generateChatResponse(messages);
    messages.push({ "role": "assistant", "content": response })
    CHATHISTORY[message.channelId] = messages;

    return response
}

async function magischeMiesmuschel(prompt) {
    let messages = [
        { "role": "system", "content": "Du bist ab jetzt die Magische Miesmuschel aus Spongebob Schwammkopf." },
        { "role": "system", "content": "Halte deine Antworten kurz und variere sie!" },
        // { "role": "system", "content": "Kannst auch ruhig abgedreht sein!" },
        { "role": "system", "content": "Schreibe nicht mehr als 10 Worte!" },
        { "role": "user", "content": prompt }
    ]
    return await generateChatResponse(messages);
}

async function complete(prompt) {
    return await generateCompletion(prompt)
}


// for chatting
async function generateChatResponse(messages, options = null) {
    try {

        if (options == null) {
            options = {
                model: 'gpt-4o',
                messages: messages,
                n: 1
            }
        }

        const response = await openai.createChatCompletion(options);

        return response.data.choices[0].message.content.trim();

    } catch (error) {
        console.error('Error generating response:', error.response ? error.response.data : error);
        return 'Sorry, I am unable to generate a response at this time.';
    }
}

// for completion tasks
async function generateCompletion(prompt) {
    try {

        let tokens = 4097 - parseInt(prompt.length / 3.5) - 50; // open ai token (syllable) limit // one token generally corresponds to ~4 characters of text

        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            // max_tokens: tokens,
            n: 1
        });

        return response.data.choices[0].text.trim();

    } catch (error) {
        console.error('Error generating response:', error.response ? error.response.data : error);
        return 'Sorry, I am unable to generate a response at this time.';
    }
}

async function generateImage(prompt) {
    try {

        let style = "vivid"

        let styles = ["vivid", "natural"]

        for (let s of styles) {
            let tag = `style:${s}`
            if (prompt.includes(tag)) {
                style = s;
                prompt = prompt.replace(tag, "");
                break;
            }
        }

        prompt = prompt.trim();

        const response = await openai.createImage({
            model: "dall-e-3",
            quality: "hd",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            style: style
        });

        let res = ""
        for (let url of response.data.data)
            res += url["url"] + "\n"

        saveImage(res)

        return res

    } catch (error) {
        console.error('Error generating response:', error.response ? error.response.data : error);
        return 'Sorry, I am unable to generate a response at this time.';
    }
}

async function sendMessage(message, response) {

    // 2000 chars discord limit
    while (response.length > 2000) {
        let partial = response.substring(0, 2000);
        await message.channel.send(partial);
        response = response.substring(2000)
    }

    message.channel.send(response);
}


async function doppelreim() {
    let channel = client.channels.cache.get("1091092079301644338"); // snek reime-residenz

    let messages = [{ "role": "user", "content": "Gib mir ein interessantes Wort auf das man gut reimen kann." }]

    let option = {
        model: 'gpt-4o',
        messages: messages,
        temperature: 1.0,
        n: 1
    }

    let response = await generateChatResponse(messages, option);

    let sentMessage = await channel.send(`Hier ist dein Substantiv: ${response}`);

    setTimeout(async () => {
        let prompt = [{ "role": "user", "content": `Gib mir ein paar Wörter die sich auf '${response}' reimen. Kein Teil des Wortes '${response}' sollte im Reim Vorkommen` }]
        let aufloesung_doppelreim = await generateChatResponse(prompt);
        sentMessage.reply(aufloesung_doppelreim)
    }, DOPPELREIM_INTERVALL - 30_000);
}

async function startDoppelreim() {
    await new Promise(r => setTimeout(r, 2000));
    doppelreim()
    setInterval(doppelreim, DOPPELREIM_INTERVALL);
}

async function saveImage(url) {

    const imagesDir = path.join(__dirname, 'images');
    const fileName = `${Date.now()}.jpg`;
    const filePath = path.join(imagesDir, fileName);

    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Fehler: Statuscode ${response.statusCode}`);
            return;
        }

        const file = fs.createWriteStream(filePath);

        response.pipe(file);

        file.on('finish', () => {
            file.close(() => {
                console.log(`Download finished (${filePath}).`);
            });
        });

    }).on('error', (err) => {
        console.error(`Fehler: ${err.message}`);
    });
}


client.login(data.DISCORD_BOT_TOKEN).then((data) => {
    // startDoppelreim()
})
