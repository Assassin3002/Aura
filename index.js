require ('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, Partials } = require('discord.js');
const { runGeminiPro, runGeminiVision } = require('./aura ai.js');
const path = require('path');
const fs = require('fs');
const https = require('https');

const client = new Client({
intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages],
    Partials:[
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ]
});

client.login(process.env.DISCORD_TOKEN);

const authorizedUsers = ['1017099013079695381','900989995437944883','1211658359179186176','1155161589964615752','1064250174249123930','1151856194147864667','1201821811655049255','1132644660762902538','941705024730460171','870622132260995092','837263508662910987','1116327509261307945','944517250394771456','1055686329209458769','1068796374793060422','1068796374793060422'];
const authorizedChannels = ['1231970605964988519','1225013072712958053'];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
} );

client.on('messageCreate', async (message) => {
    try {  
        
        if (message.author.bot) return;
        if (message.channel.type === ChannelType.DM && authorizedUsers.includes(message.author.id)) {
            message.reply('Hello Bhai,How can i help you');
            // generate response from gemini's api
            const response = await runGeminiPro(message.content);
            const result = splitResponse(response);
            result.forEach((result) => {
            message.reply(result);
        });
    }
        if (message.channel.type === ChannelType.GuildText && authorizedChannels.includes(message.channel.id)){
            const userId = message.author.id
            message.reply(`Loading....`);
                // generate response from gemini's api
                const prompt = message.content;
                let localPath = null;
                let mimeType = null;
    
                if (message.attachments.size > 0) {
                    let attachment = message.attachments.first();
                    let url = attachment.url;
                    mimeType = attachment.contentType;
                    let fileName = attachment.name;

                    localPath = path.join(__dirname, 'images',fileName);

                    let file = fs.createWriteStream(localPath);
                    https.get(url, function(response) {
                        response.pipe(file);
                        file.on('finish', async function() {
                            file.close(async()=>{
                                try{
                                    const response = await runGeminiVision(prompt, localPath, mimeType);
                                    const results = splitResponse(response);
                                    results.forEach((result) => {
                                        message.reply(result);
                                    });
                                }
                                catch(error){
                                    console.error(error);
                                    message.reply('sorry, I had trouble processing your request');
                                }
                            });
                        });
                    });
                }
            else{
                const response = await runGeminiPro(message.content);
                const result = splitResponse(response);
                result.forEach((result) => {
                message.reply(result);
            });
    }    

        }

    }
catch (error) {
    console.error(error);
}

});

function splitResponse(response){
    const maxChunkLength = 2000;
    let chunks = [];

    for (let i = 0; i < response.length; i += maxChunkLength) {
        chunks.push(response.substring(i, i + maxChunkLength));
    }
return chunks;
    
}
