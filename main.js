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

const openai = new OpenAIApi(configuration);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!npc")) return;

    const response = await generateResponse(message.content, data.GPT_API_KEY);
    message.channel.send(response);
});

async function generateResponse(prompt) {
    try {

        let len = 4097 - prompt.length - 1;
        prompt = prompt.substring(4)
        
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ "role": "assistant", "content": prompt }],
            max_tokens: len,
            n: 1
        });

        return response.data.choices[0].message.content.trim();

    } catch (error) {
        console.error('Error generating response:', error.response ? error.response.data : error);
        return 'Sorry, I am unable to generate a response at this time.';
    }
}

client.login(data.DISCORD_BOT_TOKEN);
