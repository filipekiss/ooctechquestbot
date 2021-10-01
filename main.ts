import { Bot } from "grammy";
import { ARCHIVE_CHANNEL_ID, BOT_TOKEN } from "./environment"


const bot = new Bot(BOT_TOKEN);

bot.on("::mention", ctx => {
  console.log("Bot was mentioned");
  const receivedMessage = ctx.update.message;

  if (receivedMessage && receivedMessage.reply_to_message) {
    console.log("The message was a reply, forwarding to archive channel")
    const messageToQuote = receivedMessage.reply_to_message;
    console.log(messageToQuote);
    ctx.api.forwardMessage(ARCHIVE_CHANNEL_ID, receivedMessage.chat.id, messageToQuote.message_id);
  }

})

bot.start();
