import { Composer, InputFile, NextFunction } from "grammy";
import { OocContext } from "../config";
import { ARCHIVE_CHANNEL_ID, BOT_USERNAME } from "../config/environment";
import { db } from "../libs/db";
import { BotModule } from "../main";
import { parseArguments } from "../telegram/messages";
import { replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";
import { getUsernameOrFullname } from "../utils/user";
import { generateQuoteImage } from "./generate-quote-image";
import { removeSurroundingQuotes } from "./remove-surrounding-quotes";
import { createOocStore } from "./store";

const ooc = new Composer<OocContext>();
const oocStore = createOocStore(db);

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

  if (oocStore.has(messageToQuote.message_id)) {
    await replyAlreadyQuoted(ctx);
    await next();
    return;
  }
  const recordOoc = () => {
    if (!messageToQuote.from || !receivedMessage.from) return;
    oocStore.add({
      source_message_id: messageToQuote.message_id,
      author_id: messageToQuote.from.id,
      author_name: getUsernameOrFullname(messageToQuote.from),
      forwarded_by_id: receivedMessage.from.id,
      forwarded_by_name: getUsernameOrFullname(receivedMessage.from),
    });
  };
  const [query] = parseArguments(receivedMessage.text as string);
  try {
    await ctx.api.forwardMessage(
      ARCHIVE_CHANNEL_ID,
      receivedMessage.chat.id,
      messageToQuote.message_id,
    );
    recordOoc();
  } catch (e) {
    console.log("Message not found, not forwarded");
  } finally {
    if (messageToQuote.text !== undefined) {
      console.log("Message has text, generating quote");
      ctx.api.sendChatAction(ARCHIVE_CHANNEL_ID, "upload_photo");
      const quoteText = removeSurroundingQuotes(messageToQuote.text);
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
        recordOoc();
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
ooc.command("oocstats", async (ctx, next) => {
  const stats = oocStore.stats(ctx.from!.id);
  const output: string[] = [`Mensagens encaminhadas: ${stats.total}`];
  if (stats.topAuthor) {
    output.push(`Usuário mais encaminhado: ${stats.topAuthor.name}`);
  }
  if (stats.topForwarder) {
    output.push(`Usuário que mais encaminhou mensagens: ${stats.topForwarder.name}`);
  }
  output.push("===");
  output.push(
    `Você foi citado ${stats.timesQuoted} vez${stats.timesQuoted === 1 ? "" : "es"} e criou ${stats.timesCreated} citaç${stats.timesCreated === 1 ? "ão" : "ões"}`,
  );
  if (stats.since) {
    output.push(
      `Estatísticas contadas a partir de ${new Date(stats.since * 1000).toLocaleDateString("pt-BR")}`,
    );
  }
  await ctx.reply(output.join("\n"), { ...replyToSender(ctx) });
  await next();
});
ooc.on("message:entities:mention", async (ctx, next) => {
  const receivedMessage = ctx.update.message;
  const isPureMention = receivedMessage.text
    .toLowerCase()
    .startsWith(botUsername);

  if (isPureMention) {
    await archiveMessage(ctx, next);
    return;
  }
  await next();
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
