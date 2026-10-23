import { Api, Composer, GrammyError, InputFile } from "grammy";
import type { User } from "@grammyjs/types";
import { OocContext } from "../config";
import { QUOTES_CHANNEL_ID } from "../config/environment";
import type { BotModule } from "../main";
import { replyToSender } from "../utils/message";
import { getUsernameOrFullname, isAdmin } from "../utils/user";
import { renderQuoteBubble } from "./bubble";
import { NewQuote, QuoteRow, QuoteStore } from "./store";

/** Telegram stops forwarding old messages at some point, so old copies are reposted when used */
const REFRESH_AFTER_SECONDS = 90 * 24 * 60 * 60;
const KEY_PATTERN = /^[a-z0-9_]{1,32}$/;
const BUILTIN_WORDS = ["add", "del", "delete", "remove", "list", "stats", "ajuda", "oocstats"];
const USAGE =
  "Use /quote chave, /quote add chave (respondendo uma mensagem), /quote list, /quote stats [chave] ou /quote remove chave";

/**
 * Telegram answers 429 when several messages go to one chat in a burst (quote add sends a
 * forward and an upload). The auto-retry plugin cannot be used: it replays an already
 * consumed file upload, so we retry here with a fresh payload instead.
 */
const retryOnFlood = async <T>(call: () => Promise<T>, attempts = 3): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      const retryAfter = error instanceof GrammyError ? error.parameters.retry_after : undefined;
      if (!retryAfter || attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000));
    }
  }
};

type QuoteModuleOptions = {
  store: QuoteStore;
  channelId: string;
  /** Command names (and aliases) that cannot be used as quote keys */
  reservedWords: () => string[];
  /** Unix seconds, injectable for tests */
  now?: () => number;
};

export function createQuoteModule({
  store,
  channelId,
  reservedWords,
  now = () => Math.floor(Date.now() / 1000),
}: QuoteModuleOptions) {
  const composer = new Composer<OocContext>();
  // Needs to be registered after every real command, see main.ts
  const shortcut = new Composer<OocContext>();

  /** Renders the bubble and uploads it to the quotes channel to get a reusable file_id */
  const uploadBubble = async (api: Api, quote: QuoteRow | NewQuote) => {
    const image = renderQuoteBubble({ ...quote, text: quote.text as string });
    const sent = await retryOnFlood(() => api.sendPhoto(channelId, new InputFile(image)));
    return sent.photo[sent.photo.length - 1].file_id;
  };

  const sendFallbackImage = async (ctx: OocContext, quote: QuoteRow) => {
    const caption = "Não consegui encaminhar a mensagem original, então aqui vai uma imagem";
    if (quote.image_file_id) {
      try {
        await retryOnFlood(() => ctx.replyWithPhoto(quote.image_file_id!, { caption }));
        return;
      } catch {
        store.setImageFileId(quote.id, null);
      }
    }
    const fileId = await uploadBubble(ctx.api, quote);
    store.setImageFileId(quote.id, fileId);
    await retryOnFlood(() => ctx.replyWithPhoto(fileId, { caption }));
  };

  /** Reposts a stale channel copy (on demand, only when the quote is used) */
  const refreshIfStale = async (ctx: OocContext, quote: QuoteRow) => {
    if (now() - quote.refreshed_at <= REFRESH_AFTER_SECONDS) return quote;
    try {
      const copy = await retryOnFlood(() =>
        ctx.api.forwardMessage(channelId, channelId, quote.channel_message_id),
      );
      store.setChannelMessage(quote.id, copy.message_id, now());
      return { ...quote, channel_message_id: copy.message_id, refreshed_at: now() };
    } catch (error) {
      console.warn(`Unable to refresh quote ${quote.key}`, error);
      return quote;
    }
  };

  const sendQuote = async (ctx: OocContext, staleQuote: QuoteRow) => {
    const quote = await refreshIfStale(ctx, staleQuote);
    try {
      await retryOnFlood(() =>
        ctx.api.forwardMessage(ctx.chat!.id, channelId, quote.channel_message_id),
      );
      store.incrementUses(quote.id);
      return;
    } catch (error) {
      console.warn(`Unable to forward quote ${quote.key}`, error);
    }
    if (!quote.text) {
      await ctx.reply(`A quote ${quote.key} expirou e não dá pra recriar uma mensagem com mídia`, {
        ...replyToSender(ctx),
      });
      return;
    }
    store.incrementUses(quote.id);
    await sendFallbackImage(ctx, quote);
  };

  const addQuote = async (ctx: OocContext, rawKey: string | undefined) => {
    const reply = (text: string) =>
      retryOnFlood(() => ctx.reply(text, { ...replyToSender(ctx) }));
    const target = ctx.message!.reply_to_message;
    if (!target?.from) {
      return reply("Você precisa responder a uma mensagem pra adicionar uma quote");
    }
    const key = rawKey?.toLowerCase();
    if (!key) {
      return reply("Você precisa de uma chave pra essa quote: /quote add chave");
    }
    if (!KEY_PATTERN.test(key)) {
      return reply("A chave só pode ter letras minúsculas, números e _ (até 32 caracteres)");
    }
    if ([...BUILTIN_WORDS, ...reservedWords()].includes(key)) {
      return reply(`Você não pode usar "${key}" como chave de quote`);
    }
    if (store.get(key)) {
      return reply("Já existe uma quote com essa chave");
    }
    const existing = store.getBySourceMessage(target.message_id);
    if (existing) {
      return reply(`Essa mensagem já é uma quote. Tente /quote ${existing.key}`);
    }
    let copy;
    try {
      copy = await retryOnFlood(() =>
        ctx.api.forwardMessage(channelId, ctx.chat!.id, target.message_id),
      );
    } catch (error) {
      console.warn("Unable to archive quote", error);
      return reply("Não consegui salvar essa mensagem no canal de quotes");
    }
    // forwarded messages credit the original author; hidden senders fall back to the forwarder
    const author = (target as { forward_from?: User }).forward_from ?? target.from;
    const newQuote: NewQuote = {
      key,
      channel_message_id: copy.message_id,
      source_message_id: target.message_id,
      text: target.text ?? null,
      message_date: target.date,
      author_id: author.id,
      author_name: getUsernameOrFullname(author),
      added_by_id: ctx.from!.id,
      added_by_name: getUsernameOrFullname(ctx.from!),
      image_file_id: null,
    };
    if (newQuote.text) {
      try {
        newQuote.image_file_id = await uploadBubble(ctx.api, newQuote);
      } catch (error) {
        console.warn("Unable to pre-render quote image", error);
      }
    }
    store.add(newQuote);
    store.saveUser(author);
    store.saveUser(ctx.from!);
    return reply(`Pronto! Envie /quote ${key} (ou só /${key}) pra citar essa mensagem`);
  };

  const showStats = async (ctx: OocContext, key: string | undefined) => {
    const reply = (text: string) => ctx.reply(text, { ...replyToSender(ctx) });
    if (key) {
      const quote = store.get(key.toLowerCase());
      if (!quote) return reply(`Não encontrei nenhuma quote com a chave ${key}`);
      return reply(
        `A quote foi adicionada por ${quote.added_by_name} e é de autoria de ${quote.author_name}. Ela foi usada ${quote.uses} vez${quote.uses === 1 ? "" : "es"}`,
      );
    }
    const stats = store.stats();
    const lines = [`Quantidade de quotes: ${stats.quotes}`, `Usos no total: ${stats.uses}`];
    if (stats.topAuthor) {
      lines.push(`Usuário mais citado: ${stats.topAuthor.name} (${stats.topAuthor.total})`);
    }
    if (stats.topAdder) {
      lines.push(`Quem mais adicionou quotes: ${stats.topAdder.name} (${stats.topAdder.total})`);
    }
    return reply(lines.join("\n"));
  };

  composer.command("quote", async (ctx, next) => {
    const reply = (text: string) => ctx.reply(text, { ...replyToSender(ctx) });
    if (!channelId) {
      await reply("As quotes estão desativadas (QUOTES_CHANNEL_ID não configurado)");
      return next();
    }
    const [action, key] = ctx.match.trim().split(/\s+/);
    switch (action?.toLowerCase()) {
      case undefined:
      case "":
        await reply(USAGE);
        break;
      case "add":
        await addQuote(ctx, key);
        break;
      case "list": {
        const keys = store.keys();
        const text = keys.length ? keys.map((k) => `/${k}`).join("\n") : "Não tenho nenhuma quote registrada";
        await reply(text.length > 4000 ? `${text.slice(0, 4000)}\n…` : text);
        break;
      }
      case "stats":
        await showStats(ctx, key);
        break;
      case "del":
      case "delete":
      case "remove": {
        if (!(await isAdmin(ctx))) {
          await reply("Só admins podem remover quotes");
        } else if (!key) {
          await reply("Use /quote remove chave");
        } else {
          await reply(
            store.remove(key.toLowerCase())
              ? "Quote removida"
              : `Não encontrei nenhuma quote com a chave ${key}`,
          );
        }
        break;
      }
      default: {
        const quote = store.get(action.toLowerCase());
        if (quote) {
          await sendQuote(ctx, quote);
        } else {
          await reply(`Não encontrei nenhuma quote com a chave ${action}`);
        }
      }
    }
    await next();
  });

  shortcut.on("message:text", async (ctx, next) => {
    const match = ctx.message.text.match(/^\/([a-z0-9_]+)(?:@(\w+))?(?:\s|$)/i);
    if (!channelId || !match) return next();
    const [, key, botName] = match;
    if (botName && botName.toLowerCase() !== ctx.me.username.toLowerCase()) return next();
    const quote = store.get(key.toLowerCase());
    if (!quote) return next();
    await sendQuote(ctx, quote);
    await next();
  });

  const module: BotModule = {
    command: "quote",
    composer,
    shortDescription: "Envia uma quote salva. Use /quote add chave",
    description:
      "/quote chave envia a quote (ou só /chave). /quote add chave (respondendo uma mensagem) salva, /quote list lista, /quote stats [chave] mostra estatísticas, /quote remove chave (admins) apaga",
  };

  return { module, shortcut };
}
