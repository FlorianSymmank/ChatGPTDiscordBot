# Discord GPT-4 Chatbot
[Original](https://github.com/aaronmansfield5/Discord-GPT-4-Chatbot)

## Prerequisites
node, npm, discord bot token, openapi token

## Installation
1. Clone the repository:
```bash
git clone https://github.com/FlorianSymmank/ChatGPTDiscordBot
cd ChatGPTDiscordBot
```

2. Install the required dependencies:
```javascript
npm install discord.js dotenv openai
```

3. Create a .env file in the project root directory and add your Discord bot token and OpenAI API key:
```makefile
GPT_API_KEY=your_openai_api_key
DISCORD_BOT_TOKEN=your_discord_bot_token
OWNER_DISCORD_ID = your_discord_id
ALLOWED_CHANNELS = "channelID channelID channelID ..." # seperated by spaces
BANNED_USERS = "userID userID userID ..."

```
Replace `your_openai_api_key`, `your_discord_bot_token`, `your_discord_id`, `"channelID channelID channelID ..."`, ` "userID userID userID ..."` with your actual OpenAI API key, Discord bot token, DiscordID, channelIds in which the bot may answer and to which users the bot wont respond to

## Obtaining Tokens

### Discord Bot Token
1. Go to the [**Discord Developer Portal**](https://discord.com/developers/applications) and log in with your Discord account.
2. Click the "New Application" button and give your application a name.
3. Go to the "Bot" tab and click the "Add Bot" button. Confirm by clicking "Yes, do it!".
4. Under the "Bot" tab, you can see the bot's token. Click the "Copy" button to copy the token.

### OpenAI API Key
1. Go to the [**OpenAI Platform**](https://platform.openai.com/signup) and sign up for an account or log in if you already have one.
2. Once logged in, go to the [**API keys**](https://platform.openai.com/account/api-keys) section.
3. Generate a new API key or use an existing one.

## Running the Bot
1. Start the bot by running:
```css
node main.js
```
2. Invite the bot to your Discord server using the invite link provided by the Discord Developer Portal.

3. Once the bot is online, it will start listening to messages and respond using GPT-4.

## Code Explanation
The main components of the code are:

- Importing required libraries and initializing the Discord client and OpenAI API client.
- Loading API keys from the .env file.
- Setting up event listeners for the ready and messageCreate events.
- Implementing the generateResponse function, which sends a message to the OpenAI API and processes the response.
- Sending the AI-generated response to the Discord channel.
- When a message is received, the generateResponse function is called with the message content as the prompt. It sends the prompt to the OpenAI API and receives a response generated by the GPT-4 model. The bot then sends this response back to the Discord channel.