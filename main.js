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
const COMMANDS = ["!npc", "magische miesmuschel"];

const openai = new OpenAIApi(configuration);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // is command?
    if (COMMANDS.find(cmd => { return message.content.startsWith(cmd) })) {

        if (isUserExcluded(message.author.id)) {
            sendMessage(message, "NO :clown:");
            return;
        }

        let l_msg = message.content.toLowerCase();

        if (l_msg.startsWith("!npc")) {
            const response = await askNPC(message.content.substring(4));
            sendMessage(message, response);
            return;
        }

        if (l_msg.startsWith("magische miesmuschel")) {
            const response = await magischeMiesmuschel(message.content.substring(20));
            sendMessage(message, response);
            return;
        }
    }
});


function isUserExcluded(userID, message) {
    let excluded = [] // ["227828681618358272"] // stefan
    return excluded.find(user => { return user === userID });
}

async function askNPC(prompt) {
    let messages = [{ "role": "user", "content": prompt }]
    return await generateResponse(messages);
}

async function magischeMiesmuschel(prompt) {
    let messages = [
        { "role": "system", "content": "Du bist ab jetzt die Magische Miesmuschel aus Spongebob Schwammkopf." },
        { "role": "system", "content": "Halte deine Antworten kurz und variere sie!" },
        // { "role": "system", "content": "Kannst auch ruhig abgedreht sein!" },
        { "role": "system", "content": "Schreibe nicht mehr als 10 Worte!" },
        { "role": "user", "content": prompt }
    ]
    return await generateResponse(messages);
}


async function generateResponse(messages) {
    try {

        let messages_len = messages.map(msg => msg["content"].length).reduce((prev, next) => prev + next);

        let tokens = 4097 - messages_len - 10; // open ai token (syllable) limit

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
    let response = await generateResponse(messages);

    let sentMessage = await channel.send(`Hier ist dein Substantiv: ${response}`);

    setTimeout(async () => {
        let messages = [{ "role": "user", "content": `Gib mir 5 Wörter die sich auf ${response} reimen` }]
        let aufloesung_doppelreim = await generateResponse(messages);
        sentMessage.reply(aufloesung_doppelreim)
    }, DOPPELREIM_INTERVALL - 2000); 
}


client.login(data.DISCORD_BOT_TOKEN);
setInterval(doppelreim, DOPPELREIM_INTERVALL);



