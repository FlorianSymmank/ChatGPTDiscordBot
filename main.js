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


const FS_DISCORD_ID = "311589715247628289";
const STUNDE = 60 * 60 * 1000;
const DOPPELREIM_INTERVALL = 2 * STUNDE;
const COMMANDS = ["!npc", "magische miesmuschel", "!complete"];
const CHATHISTORY = {}

const DM_CHANNEL = 1;

const openai = new OpenAIApi(configuration);

//TODO: log/message me when added to new server to prevent missuse

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // Discard all dms not by me 
    if (message.channel.type === DM_CHANNEL) {
        handleDMs(message)
        return;
    }

    // is command?
    if (COMMANDS.find(cmd => { return message.content.startsWith(cmd) })) {

        if (isUserExcluded(message.author.id)) {
            sendMessage(message, "NO :clown:");
            return;
        }

        let l_msg = message.content.toLowerCase();
        let response;

        if (l_msg.startsWith("!npc")) {
            response = await askNPC(message.content.substring(4), message);
        } else if (l_msg.startsWith("magische miesmuschel")) {
            response = await magischeMiesmuschel(message.content.substring(20));
        } else if (l_msg.startsWith("!complete")) {
            response = await complete(message.content.substring(9));
        }

        sendMessage(message, response);
        return;
    }
});

async function handleDMs(message) {
    // jeder der nicht ich ist 
    if (message.author.id != FS_DISCORD_ID) {
        sendMessage(message, "Yo bitte nicht direkt anquatschen UwU");

        const user = client.users.cache.get(FS_DISCORD_ID);

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
    let excluded = [] // ["227828681618358272"] // stefan
    return excluded.find(user => { return user === userID });
}

async function askNPC(prompt, message) {
    let messages = []

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
async function generateChatResponse(messages) {
    try {

        let messages_len = messages.map(msg => msg["content"].length).reduce((prev, next) => prev + next);

        let tokens = 4097 - parseInt(messages_len / 3.5) - 50; // open ai token (syllable) limit // one token generally corresponds to ~4 characters of text

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: tokens,
            n: 1
        });

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
            max_tokens: tokens,
            n: 1
        });

        return response.data.choices[0].text.trim();

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

    let messages = [{ "role": "user", "content": "Gib mir ein zusammengesetzes Substantiv (aus maximal aus 2 Wörtern)" }]
    let response = await generateChatResponse(messages);

    let sentMessage = await channel.send(`Hier ist dein Substantiv: ${response}`);

    setTimeout(async () => {
        let messages = [{ "role": "user", "content": `Gib mir 5 Wörter die sich auf ${response} reimen` }]
        let aufloesung_doppelreim = await generateChatResponse(messages);
        sentMessage.reply(aufloesung_doppelreim)
    }, DOPPELREIM_INTERVALL - 2000);
}


client.login(data.DISCORD_BOT_TOKEN);
setInterval(doppelreim, DOPPELREIM_INTERVALL);