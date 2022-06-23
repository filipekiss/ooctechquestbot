import { Message } from "@grammyjs/types";
import { Composer } from "grammy";
import Keyv from "keyv";
import { OocContext } from "../config";
import { DB_FOLDER } from "../config/environment";
import { BotModule, mdEscape } from "../main";
import { replyToSender, sendAsMarkdown } from "../utils/message";

const quote = new Composer<OocContext>();

const quoteDB = new Keyv(`sqlite://${DB_FOLDER}/quote.sqlite`);

export const QUOTE_SCHEMA = {
  QUOTES_KEYS: "quotes_keys",
};
export async function getQuoteKeys() {
  const quotesKeys = (await quoteDB.get(QUOTE_SCHEMA.QUOTES_KEYS)) as string;
  const allQuoteKeys = quotesKeys ? quotesKeys.split("\n") : [];
  return {
    all: () => [...allQuoteKeys],
  };
}

async function addQuote(quoteKey: string, messageToQuote: Message) {
  const allQuoteKeys = (await getQuoteKeys()).all();
  const newQuoteKeys = [...allQuoteKeys, quoteKey];

  await quoteDB.set(messageToQuote.message_id.toString(), {
    ...messageToQuote,
    ooc_quote_key: quoteKey,
  });
  await quoteDB.set(quoteKey, {
    ...messageToQuote,
    ooc_quote_key: quoteKey,
  });
  await quoteDB.set(QUOTE_SCHEMA.QUOTES_KEYS, newQuoteKeys.join("\n"));
}

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

  const reservedWords = ["add", "del", "delete", "remove"];

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
      const existingQuoteMessage = await quoteDB.get(
        messageToQuote.message_id.toString()
      );
      if (existingQuoteMessage) {
        replyAlreadyQuoted(ctx, existingQuoteMessage.ooc_quote_key as string);
        await next();
        return;
      }
      // Check if the key is already being used
      const existingQuote = await quoteDB.get(key);
      if (existingQuote) {
        ctx.reply("Já existe uma citação com essa chave", {
          ...replyToSender(ctx),
        });
        await next();
        return;
      }
      // Add the quote to the database
      await addQuote(key, messageToQuote);
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
      const quotesList = (await getQuoteKeys()).all();
      console.log({ quotesList });
      if (quotesList.length === 0) {
        ctx.reply("Não tenho nenhuma quote registrada", {
          ...replyToSender(ctx),
        });
      } else {
        ctx.reply(
          quotesList
            .map((quote) => mdEscape("`/quote " + quote + "`"))
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

    default: {
      // Check if the key is already being used
      const existingQuote = await quoteDB.get(actionOrKey);
      if (!existingQuote) {
        ctx.reply("Não encontrei nenhuma citação relacionada", {
          ...replyToSender(ctx),
        });
        await next();
        return;
      }
      ctx.api.forwardMessage(
        ctx.chat.id,
        existingQuote.chat.id,
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
