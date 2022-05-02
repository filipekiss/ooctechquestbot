import { Composer, InputFile } from "grammy";
import { ARCHIVE_CHANNEL_ID, BOT_USERNAME } from "../config/environment";
import { parseArguments } from "../telegram/messages";
import { generateQuoteImage } from "./generate-quote-image";
import { removeSurroundingQuotes } from "./remove-surrounding-quotes";

export const ooc = new Composer();

const botUsername = BOT_USERNAME.toLowerCase();
ooc.on("message:text", async (ctx) => {
  console.log("Bot was mentioned");
  const receivedMessage = ctx.update.message;
  const isPureMention = receivedMessage.text
    .toLowerCase()
    .startsWith(`@${botUsername}`);

  const messageToQuote = receivedMessage.reply_to_message;
  if (isPureMention && receivedMessage && messageToQuote) {
    console.log("The message was a reply, forwarding to archive channel");
    const [action] = parseArguments(receivedMessage.text!);
    console.log(messageToQuote);
    try {
      await ctx.api.forwardMessage(
        ARCHIVE_CHANNEL_ID,
        receivedMessage.chat.id,
        messageToQuote.message_id
      );
    } catch (e) {
      console.log("Message not found, not forwarded");
    } finally {
      if (messageToQuote.text !== undefined) {
        console.log("Message has text, generating quote");
        const quoteText = removeSurroundingQuotes(messageToQuote.text);
        const generatedImage = await generateQuoteImage({
          text: quoteText,
          author:
            messageToQuote.from!.username ?? messageToQuote.from!.first_name,
          query: action,
        });
        if (generatedImage) {
          return ctx.api.sendPhoto(
            ARCHIVE_CHANNEL_ID,
            new InputFile(generatedImage)
          );
        }
        return true;
      }
    }
  }
});
