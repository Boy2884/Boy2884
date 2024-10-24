const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Telegram bot tokeni (Uni @BotFather orqali olasiz)
const token = '6360804290:AAGEOO6-rHz40PWmyVvH8bgoSKhC-pkEJUo';

// Stability API tokeni
const apiKey = 'sk-Qu9CgVWl7dKvLEYF2Buo67W7XuRkhzx9xKBgBzenNKbBExpu';

// Telegram botini yaratamiz
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchi botga xabar yuborganida ishlaydigan funksiya
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const promptUzbek = msg.text;  // Foydalanuvchi yuborgan O'zbekcha matn

  // Foydalanuvchiga jarayon boshlanganini bildiramiz
  await bot.sendMessage(chatId, 'Rasm yaratilyapti, generatsiya qilish vaqti 10-42 sekud');

  
  // Tarjima qilish funksiyasi
  async function translateFun(word) {
    const http = require('https');

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        hostname: 'google-translate113.p.rapidapi.com',
        port: null,
        path: '/api/v1/translator/text',
        headers: {
          'x-rapidapi-key': 'c162619499msh0a9b0400e01b4dep188999jsnc79c914b737c',
          'x-rapidapi-host': 'google-translate113.p.rapidapi.com',
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, function (res) {
        const chunks = [];

        res.on('data', function (chunk) {
          chunks.push(chunk);
        });

        res.on('end', function () {
          const body = Buffer.concat(chunks);
          const jsonString = body.toString('utf8');
          const jsonData = JSON.parse(jsonString);
          resolve(jsonData.trans);  // Tarjima qilingan matnni qaytaramiz
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(JSON.stringify({
        from: 'uz',
        to: 'en',
        text: word
      }));

      req.end();
    });
  }

  try {
    // 1. O'zbek tilidagi matnni ingliz tiliga tarjima qilish
    const promptEnglish = await translateFun(promptUzbek);  // Tarjima qilingan inglizcha matn

    // 2. Stability API ga so'rov yuborish
    const payload = {
        prompt: promptEnglish,
        output_format: "webp"
      };
    console.log(payload);
    

    const response = await axios.postForm(
        `https://api.stability.ai/v2beta/stable-image/generate/ultra`,
        axios.toFormData(payload, new FormData()),
        {
          validateStatus: undefined,
          responseType: "arraybuffer",
          headers: { 
            Authorization: `Bearer sk-96zlSE5pNjuPVp7c2stiN8pO6rBbUUkLitUiOQQ0oPWMwoGi`, 
            Accept: "image/*" 
          },
        },
      );

    if (response.status === 200) {
      const imagePath = `./generated_image.jpeg`;

      // Olingan rasmni faylga yozish
      fs.writeFileSync(imagePath, Buffer.from(response.data));

      // Foydalanuvchiga rasmni yuborish
      await bot.sendPhoto(chatId, imagePath, { caption: promptEnglish });

      // Rasmni o'chirish (xotirani bo'shatish uchun)
      fs.unlinkSync(imagePath);
    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }
  } catch (error) {
    // Xatolik yuz berganda foydalanuvchiga xabar berish
    await bot.sendMessage(chatId, `Xatolik yuz berdi: ${error.message}`);
  }
});
