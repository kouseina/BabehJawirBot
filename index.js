const qrcode = require('qrcode-terminal');
const config = require('./config/config.json');

const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', "--disabled-setupid-sandbox"],
    },
    ffmpeg: './ffmpeg.exe',
    authStrategy: new LocalAuth({ clientId: "879877" }),
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.clear();
    console.log('Client is ready!');
});

client.on('message', async (message) => {
    const isGroups = message.from.endsWith('@g.us') ? true : false;
    // console.log(message.body);

    if (isGroups && config.groups) {

        if (message.body === `${config.prefix}everyone`) {
            const chat = await message.getChat();

            let text = "";
            let mentions = [];

            for (let participant of chat.participants) {
                const contact = await client.getContactById(participant.id._serialized);

                mentions.push(contact);
                text += `@${participant.id.user} `;
            }

            await chat.sendMessage(text, { mentions });
        }
    }

    // Get all menu
    if (message.body == `${config.prefix}menu`) {
        try {
            client.sendMessage(
                message.from,
                `List menu :
1. !sticker (Convert gambar/video/gif menjadi sticker)
2. !everyone (Mention semua member group)`,
            );

        } catch (error) {
            console.log("get all menu failed");
        }
    }

    // Image to Sticker (Auto && Caption)
    if ((message.type == "image" || message.type == "video" || message.type == "gif") && (message.body == `${config.prefix}sticker`)) {
        client.sendMessage(message.from, "*[⏳]* Loading..");
        try {
            const media = await message.downloadMedia();
            client.sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                stickerAuthor: config.author // Sticker Author = Edit in 'config/config.json'
            }).then(() => {
                client.sendMessage(message.from, "*[✅]* Successfully!");
            });
        } catch {
            client.sendMessage(message.from, "*[❎]* Failed!");
        }

    }

    // Image to Sticker (With Reply Image)
    else if (message.body == `${config.prefix}sticker`) {
        const quotedMsg = await message.getQuotedMessage();
        if (message.hasQuotedMsg && quotedMsg.hasMedia) {
            client.sendMessage(message.from, "*[⏳]* Loading..");
            try {
                const media = await quotedMsg.downloadMedia();
                client.sendMessage(message.from, media, {
                    sendMediaAsSticker: true,
                    stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                    stickerAuthor: config.author // Sticker Author = Edit in 'config/config.json'
                }).then(() => {
                    client.sendMessage(message.from, "*[✅]* Successfully!");
                });
            } catch {
                client.sendMessage(message.from, "*[❎]* Failed!");
            }
        } else {
            client.sendMessage(message.from, "*[❎]* Reply Image First!");
        }
    }

});

client.initialize();