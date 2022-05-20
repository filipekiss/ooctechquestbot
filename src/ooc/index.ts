import { ChatFromGetChat } from "@grammyjs/types";
import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { ARCHIVE_CHANNEL_ID, BOT_USERNAME } from "../config/environment";
import { parseArguments } from "../telegram/messages";
import { generateQuoteImage } from "./generate-quote-image";
import { removeSurroundingQuotes } from "./remove-surrounding-quotes";

export const ooc = new Composer<OocContext>();

const STEALTH_ACTION = "stealth";

const whitelistedGroups = [-1001699419971];

async function removeFromGroup(chatInfo: ChatFromGetChat, ctx: OocContext) {
  if (whitelistedGroups.includes(chatInfo.id)) {
    console.log(`Keep in group`);
  } else {
    try {
      console.log(`Remove from group`);
      await ctx.reply("This group is not authorized to use this bot. Bye :)");
      await ctx.api.leaveChat(chatInfo.id);
    } catch {
      console.log(`Unable to leave group. Skipping…`);
    }
  }
}

const botUsername = BOT_USERNAME.toLowerCase();
ooc.on("message:text", async (ctx, next) => {
  const chatInfo = await ctx.getChat();
  console.log(chatInfo);
  // await removeFromGroup(chatInfo, ctx);
  const receivedMessage = ctx.update.message;
  const isPureMention = receivedMessage.text
    .toLowerCase()
    .startsWith(botUsername);

  console.log({ isPureMention, text: receivedMessage.text, botUsername });

  const messageToQuote = receivedMessage.reply_to_message;
  if (isPureMention && receivedMessage && messageToQuote) {
    console.log("The message was a reply, forwarding to archive channel");
    const [action] = parseArguments(receivedMessage.text!);
    if (
      action === STEALTH_ACTION &&
      receivedMessage.from?.username === "filipekiss"
    ) {
      try {
        await receivedMessage.delete();
      } catch (e) {
        console.log("unable to delete message");
      }
    }
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
          ctx.api.sendPhoto(ARCHIVE_CHANNEL_ID, new InputFile(generatedImage));
        }
      }
    }
  }
  await next();
});
