import { User } from "@grammyjs/types";
import { Composer } from "grammy";
import { OocContext } from "../config";
import { incrementMetaCount } from "../data/meta";
import {
  createQuote,
  getAllQuoteKeys,
  getQuoteByKey,
  getQuoteByMessageId,
  getQuoteStats,
  incrementUsesCountById,
  META_QUOTE_TOTAL_USES,
  removeQuoteByKey,
} from "../data/quote";
import { BotModule, mdEscape } from "../main";
import { replyToSender, sendAsMarkdown } from "../utils/message";
import { getUsernameOrFullname, isAdmin } from "../utils/user";

const quote = new Composer<OocContext>();

const replyInexistingQuote = async (key: string, ctx: OocContext) => {
  ctx.reply(`Não encontrei nenhuma citação com a chave ${key}`, {
    ...replyToSender(ctx),
  });
};

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
  if (!ctx.message?.text) {
    await next();
    return;
  }
  const receivedMessage = ctx.update.message;
  const [actionOrKey, key] = ctx.match?.split(" ");

  const commands = await ctx.api.getMyCommands();
  const reservedWords = [
    "add",
    "del",
    "delete",
    "remove",
    "list",
    "stats",
    ...commands.map((command) => command.command),
  ];

  if (reservedWords.includes(key)) {
    ctx.reply(`Você não pode usar "${key}" como uma chave de quote`, {
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

    case "delete":
    case "remove": {
      if (!key) {
        ctx.reply(
          `Você precisa enviar a chave da quote que você quer remover`,
          replyToSender(ctx)
        );
        await next();
        return;
      }
      const quoteToRemove = await getQuoteByKey(key);
      if (!quoteToRemove) {
        await replyInexistingQuote(key, ctx);
        await next();
        return;
      }
      const removeRequestAuthor = ctx.from as User;
      console.log({ removeRequestAuthor });
      const canRemoveQuote =
        removeRequestAuthor.id === quoteToRemove.author.telegram_id ||
        removeRequestAuthor.id === quoteToRemove.quoted_by.telegram_id ||
        (await isAdmin(ctx));
      if (!canRemoveQuote) {
        ctx.reply(
          "Você não tem permissão para remover essa quote",
          replyToSender(ctx)
        );
        await next();
        return;
      }
      const deletedQuote = await removeQuoteByKey(key);
      await ctx.reply(`Pronto! Removi a quote ${key}`, replyToSender(ctx));
      await ctx.reply(
        `A quote foi adicionada por ${getUsernameOrFullname(
          deletedQuote.quoted_by
        )} e é de autoria de ${getUsernameOrFullname(
          deletedQuote.author
        )}. Ela foi usada ${deletedQuote.uses} vez${
          deletedQuote.uses === 1 ? "" : "es"
        } antes de ser removida`
      );
      await next();
      return;
    }

    default: {
      // Check if the key is already being used
      const existingQuote = await getQuoteByKey(actionOrKey);
      if (!existingQuote) {
        replyInexistingQuote(actionOrKey, ctx);
        await next();
        return;
      }
      await incrementMetaCount(META_QUOTE_TOTAL_USES);
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

quote.on(":entities:bot_command", async (ctx, next) => {
  if (!ctx.message?.text) {
    await next();
    return;
  }
  const [currentCommand] = ctx.message.text.split(" ");
  const commands = await ctx.api.getMyCommands();
  const commandIsRegistered = commands.find(
    (command) => `/${command.command}` === currentCommand
  );
  if (commandIsRegistered) {
    await next();
    return;
  }
  const [, quoteKey] = currentCommand.split("/");
  const existingQuote = await getQuoteByKey(quoteKey);
  if (!existingQuote) {
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
});

export const quoteModule: BotModule = {
  composer: quote,
  command: "quote",
  shortDescription: "Registra uma citação nos anais do Tech Quest",
  description:
    "Utilize o formato `/quote add chave` para adicionar um citação e `/quote chave` para enviar uma citação adicionada anteriormente",
};
