import { Bot, InputFile } from "grammy";
import { ARCHIVE_CHANNEL_ID, BOT_TOKEN, BOT_USERNAME } from "./environment";
import { generateQuoteImage } from "./helpers/generate-quote-image";

const bot = new Bot(BOT_TOKEN);
const botUsername = BOT_USERNAME.toLowerCase();

bot.on("::mention", async (ctx) => {
  console.log("Bot was mentioned");
  const receivedMessage = ctx.update.message;
  const isPureMention = ctx.update.message?.text?.toLowerCase() === botUsername;

  if (isPureMention && receivedMessage && receivedMessage.reply_to_message) {
    console.log("The message was a reply, forwarding to archive channel");
    const messageToQuote = receivedMessage.reply_to_message;
    console.log(messageToQuote);
    ctx.api.forwardMessage(
      ARCHIVE_CHANNEL_ID,
      receivedMessage.chat.id,
      messageToQuote.message_id
    );
    if (messageToQuote.text != undefined) {
      ctx.api.sendPhoto(
        ARCHIVE_CHANNEL_ID,
        new InputFile(
          await generateQuoteImage({
            text: messageToQuote.text,
            author:
              messageToQuote.from!.username ?? messageToQuote.from!.first_name,
          })
        )
      );
    }
  }
});

bot.start();

console.log("Starting");
