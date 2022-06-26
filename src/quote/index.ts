import { User } from "@grammyjs/types";
import { Composer } from "grammy";
import { OocContext } from "../config";
import {
  createQuote,
  getAllQuoteKeys,
  getQuoteByKey,
  getQuoteByMessageId,
  getQuoteStats,
  incrementUsesCountById,
} from "../data/quote";
import { BotModule, mdEscape } from "../main";
import { replyToSender, sendAsMarkdown } from "../utils/message";

const quote = new Composer<OocContext>();

async function replyAlreadyQuoted(ctx: OocContext, quoteKey: string) {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply(
    mdEscape(
      "Essa mensagem já foi encaminhada. Tente `/quote " + quoteKey + "`"
    ),
    {
      ...replyToSender(ctx),
      parse_mode: `MarkdownV2`,
    }
  );
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

quote.command("quote", async (ctx, next) => {
  const receivedMessage = ctx.update.message;
  const [actionOrKey, key] = ctx.match?.split(" ");

  const reservedWords = ["add", "del", "delete", "remove", "list", "stats"];

  if (reservedWords.includes(key)) {
    ctx.reply(`Você não pode usar "${key}" nesse contexto`, {
      ...replyToSender(ctx),
    });
    await next();
    return;
  }

  const messageToQuote = receivedMessage?.reply_to_message;
  switch (actionOrKey) {
    case "add": {
      // wrong usage of "add"
      if (!messageToQuote) {
        ctx.reply(
          "Você precisa responder pra uma mensagem pra adicionar uma citação",
          {
            ...replyToSender(ctx),
          }
        );
        await next();
        return;
      }
      if (!key) {
        ctx.reply(
          mdEscape(
            "Você precisa de uma chave pra essa citação. Tente nesse formato: `/quote add chave`"
          ),
          {
            parse_mode: "MarkdownV2",
          }
        );
        await next();
        return;
      }
      // this quote already exists
      const existingQuoteMessage = await getQuoteByMessageId(
        messageToQuote.message_id
      );
      if (existingQuoteMessage) {
        replyAlreadyQuoted(ctx, existingQuoteMessage.key as string);
        await next();
        return;
      }
      // Check if the key is already being used
      const existingQuote = await getQuoteByKey(key);
      if (existingQuote) {
        ctx.reply("Já existe uma citação com essa chave", {
          ...replyToSender(ctx),
        });
        await next();
        return;
      }
      // Add the quote to the database
      await createQuote(
        key,
        messageToQuote,
        messageToQuote.from as User,
        ctx.from as User
      );
      ctx.reply(
        mdEscape(
          "Pronto! Basta enviar `/quote " + key + "` para citar essa mensagem"
        ),
        {
          ...replyToSender(ctx),
          parse_mode: "MarkdownV2",
        }
      );
      await next();
      return;
    }
    case "list": {
      ctx.replyWithChatAction("typing");
      const quotesList = await getAllQuoteKeys();
      console.log({ quotesList });
      if (quotesList.length === 0) {
        ctx.reply("Não tenho nenhuma quote registrada", {
          ...replyToSender(ctx),
        });
      } else {
        ctx.reply(
          quotesList
            .map((quote) => mdEscape("`/quote " + quote.key + "`"))
            .join("\n"),
          {
            ...replyToSender(ctx),
            ...sendAsMarkdown(),
          }
        );
      }
      await next();
      return;
    }

    case "stats": {
      const quoteStats = await getQuoteStats();
      ctx.replyWithChatAction("typing");
      console.dir(
        {
          quoteStats,
        },
        { depth: null }
      );
      const output: string[] = [];
      output.push(`*Quantidade de Quotes*: ${quoteStats.totalQuotes}`);
      const { topQuotedUser } = quoteStats;
      output.push(
        `*Usuário mais citado*: ${
          topQuotedUser.author.username
            ? topQuotedUser.author.username
            : `${topQuotedUser.author.first_name} ${topQuotedUser.author.last_name}`
        }`
      );
      const { topQuoteAuthor } = quoteStats;
      output.push(
        `*Usuário que mais criou quotes*: ${
          topQuoteAuthor.author.username
            ? topQuoteAuthor.author.username
            : `${topQuoteAuthor.author.first_name} ${topQuoteAuthor.author.last_name}`
        }`
      );
      const { topThreeUsedQuotes } = quoteStats;
      output.push(
        `*Top ${
          topThreeUsedQuotes.length
        } quotes mais usadas*\n${topThreeUsedQuotes
          .map((quote) => ` • \`${quote.key}\` - ${quote.uses}`)
          .join("\n")}`
      );
      ctx.reply(mdEscape(output.join("\n")), {
        ...sendAsMarkdown(),
      });
      await next();
      return;
    }

    default: {
      // Check if the key is already being used
      const existingQuote = await getQuoteByKey(actionOrKey);
      if (!existingQuote) {
        ctx.reply("Não encontrei nenhuma citação relacionada", {
          ...replyToSender(ctx),
        });
        await next();
        return;
      }
      await incrementUsesCountById(existingQuote.id);
      ctx.api.forwardMessage(
        ctx.chat.id,
        existingQuote.chat_id,
        existingQuote.message_id
      );
      await next();
      return;
    }
  }
});

export const quoteModule: BotModule = {
  composer: quote,
  command: "quote",
  shortDescription: "Registra uma citação nos anais do Tech Quest",
  description:
    "Utilize o formato `/quote add chave` para adicionar um citação e `/quote chave` para enviar uma citação adicionada anteriormente",
};
