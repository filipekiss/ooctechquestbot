import { Composer, InputFile, NextFunction } from "grammy";
import { OocContext } from "../config";
import { ARCHIVE_CHANNEL_ID, BOT_USERNAME } from "../config/environment";
import { BotModule, mdEscape } from "../main";
import { parseArguments } from "../telegram/messages";
import { replyToSender, sendAsMarkdown } from "../utils/message";
import { withNext } from "../utils/middleware";
import { getUsernameOrFullname } from "../utils/user";
import { generateQuoteImage } from "./generate-quote-image";
import { removeSurroundingQuotes } from "./remove-surrounding-quotes";

const ooc = new Composer<OocContext>();

async function replyAlreadyQuoted(ctx: OocContext) {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply("Essa mensagem já foi encaminhada.", {
    ...replyToSender(ctx),
  });
  setTimeout(async () => {
    try {
      await receivedMessage.delete();
      await botReply.delete();
    } catch {
      console.warn("Unable to delete message. Skipping…");
    }
  }, 15000);
  return;
}

async function archiveMessage(ctx: OocContext, next: NextFunction) {
  const receivedMessage = ctx.update.message;
  if (!receivedMessage) {
    await next();
    return;
  }
  const messageToQuote = receivedMessage.reply_to_message;

  if (!messageToQuote) {
    await next();
    return;
  }

  // if (await getOocByMessageId(messageToQuote.message_id)) {
  //   replyAlreadyQuoted(ctx);
  //   await next();
  //   return;
  // }
  const [query] = parseArguments(receivedMessage.text as string);
  try {
    await ctx.api.forwardMessage(
      ARCHIVE_CHANNEL_ID,
      receivedMessage.chat.id,
      messageToQuote.message_id,
    );
  } catch (e) {
    console.log("Message not found, not forwarded");
  } finally {
    if (messageToQuote.text !== undefined) {
      console.log("Message has text, generating quote");
      ctx.api.sendChatAction(ARCHIVE_CHANNEL_ID, "upload_photo");
      const quoteText = removeSurroundingQuotes(messageToQuote.text);
      // const newOoc = await createOoc(
      //   messageToQuote as Message,
      //   messageToQuote.from as User,
      //   receivedMessage.from as User
      // );
      const generatedImage = await generateQuoteImage({
        text: quoteText,
        author:
          messageToQuote.from!.username ?? messageToQuote.from!.first_name,
        query: query,
      });
      console.log({ generatedImage });
      if (generatedImage) {
        await ctx.api.sendPhoto(
          ARCHIVE_CHANNEL_ID,
          new InputFile(generatedImage.canvas),
        );
        // const { name: imageName } = parse(generatedImage.image);
        /* await addImageToOoc(newOoc, imageName) */
      }
      await next();
      return;
    } // endif
    await next();
  }
}

const botUsername = BOT_USERNAME.toLowerCase();
ooc.command("ooc", async (ctx, next) => {
  await archiveMessage(ctx, next);
});
// ooc.command("oocstats", async (ctx, next) => {
//   const stats = await getOocStats();
//   const userStats = await getOocStatsForUser(ctx.update.message?.from!);
//   ctx.replyWithChatAction("typing");
//   const output: string[] = [];
//   output.push(`*Mensagens encaminhadas*: ${stats.totalOoc}`);
//   const { topOocUser } = stats;
//   output.push(
//     `*Usuário mais encaminhado*: ${getUsernameOrFullname(topOocUser.author)}`,
//   );
//   const { topOocAuthor } = stats;
//   output.push(
//     `*Usuário que mais encaminhou mensagens*: ${getUsernameOrFullname(
//       topOocAuthor.author,
//     )}`,
//   );
//   output.push(`*===*`);
//   output.push(
//     `Você foi citado ${userStats.timesQuoted._count.id} vez${
//       userStats.timesQuoted._count.id > 1 ? "es" : ""
//     } e criou ${userStats.timesCreated._count.id} citaç${
//       userStats.timesCreated._count.id > 1 ? "ões" : "ão"
//     }`,
//   );
//   output.push(`_Estatísticas contadas a partir de 6 de Julho de 2022_`);
//   ctx.reply(mdEscape(output.join("\n")), {
//     ...sendAsMarkdown(),
//     ...replyToSender(ctx),
//   });
//   await next();
//   return;
// });
ooc.on("message:entities:mention", async (ctx, next) => {
  const receivedMessage = ctx.update.message;
  const isPureMention = receivedMessage.text
    .toLowerCase()
    .startsWith(botUsername);

  if (isPureMention) {
    await archiveMessage(ctx, next);
  }
});

const STICKER_22 = "AgADgAADktWiDA";
const STICKER_13 = "AgADhgADktWiDA";

const STICKER_13_FILE =
  "CAACAgEAAxkBAAIDp2NYMFr_-KmCVm_MMEsTyUCUy3mxAAKGAAOS1aIMwEZ0GEt3ELUqBA";

ooc.on(
  "message:sticker",
  withNext(async (ctx) => {
    const receivedStickerId = ctx.update.message.sticker.file_unique_id;
    if (receivedStickerId === STICKER_22) {
      await ctx.replyWithSticker(STICKER_13_FILE, replyToSender(ctx));
    }
  }),
);

export const oocModule: BotModule = {
  command: "ooc",
  shortDescription: "Encaminha uma mensagem pro canal OOC",
  composer: ooc,
};
