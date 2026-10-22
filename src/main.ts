import { FileApiFlavor, hydrateFiles } from "@grammyjs/files";
import { hydrate } from "@grammyjs/hydrate";
import { Api, Bot, Composer, InputFile } from "grammy";
import { acendeModule } from "./acende";
import { badumtsModule } from "./badumts";
import { OocContext, setup } from "./config";
import { BOT_TOKEN, QUOTES_CHANNEL_ID } from "./config/environment";
import { deliriosModule } from "./delirio";
import { keyboardModule } from "./keyboard";
import { lazerModule } from "./lazer";
import { oocModule } from "./ooc";
import { paolica } from "./paolica";
import { perdoaModule } from "./perdao";
import { db } from "./libs/db";
import { createQuoteModule } from "./quote";
import { createQuoteStore } from "./quote/store";
import { referral } from "./referral";
import { repetidaModule } from "./repetida";
import { revoltaModule } from "./revolta";
import { salpicao } from "./salpicao";
import { replyToSender } from "./utils/message";

setup();
console.log("Starting...");

export type BotModule = {
  composer: Composer<OocContext>;
  command?: string;
  alias?: Array<string>;
  shortDescription?: string;
  description?: string;
};

const commandRegister = new Map<string, BotModule>();

const addToRegister =
  <K, V>(register: Map<K, V>) =>
  (key: K, value: V) => {
    console.log(`Registering ${key}`);
    return register.set(key, value);
  };
const addToCommandRegister = addToRegister(commandRegister);

const { module: quoteModule, shortcut: quoteShortcut } = createQuoteModule({
  store: createQuoteStore(db),
  channelId: QUOTES_CHANNEL_ID,
  reservedWords: () => [
    ...commandRegister.keys(),
    ...[...commandRegister.values()].flatMap((botModule) => botModule.alias ?? []),
  ],
});

const bot = new Bot<OocContext, FileApiFlavor<Api>>(BOT_TOKEN);
const addModuleToBot = (module: BotModule) => {
  if (module.shortDescription && module.command) {
    addToCommandRegister(module.command, module);
  }
  bot.use(module.composer);
};

export function mdEscape(
  text: string,
  options: { escapeItalic: boolean } = { escapeItalic: false },
): string {
  const noItalicRegex = /[[\]()~>#+\-=|{}.!\\]/g;
  const italicRegex = /[[\]_()~>#+\-=|{}.!\\]/g;
  if (options.escapeItalic) {
    return text.replace(italicRegex, "\\$&");
  }
  return text.replace(noItalicRegex, "\\$&");
}

const help = (commandsRegister: any) => {
  const helpModule = new Composer<OocContext>();
  helpModule.command(["ajuda"], async (ctx: OocContext) => {
    const commandHelp = ctx.match;
    if ((commandHelp as string).toLowerCase() === "luciano") {
      const image = new InputFile("./src/ajuda-luciano.png");
      return ctx.replyWithPhoto(image, {
        ...replyToSender(ctx),
      });
    }
    const lines = [];
    if (!commandHelp) {
      lines.push("———");
      lines.push("");
      lines.push(
        "Se você responder a uma mensagem mencionando o bot, a mensagem é encaminhada para o canal t.me/ooctechquest",
      );
      lines.push("");
      lines.push("Comandos");
      lines.push("———————————");
      lines.push("");
      lines.push(
        "Você pode solicitar ajuda pra um comando específico, por exemplo: `/ajuda luciano` para ver ajuda do comando `luciano`",
      );
      lines.push("");
      commandsRegister.forEach((botModule: any, command: string) => {
        lines.push(`/${command} — ${botModule.shortDescription}`);
        if (botModule.alias?.length > 0) {
          lines.push(`Aliases: ${botModule.alias.join(", ")}`);
        }
      });
      return ctx.reply(mdEscape(lines.join("\n")), {
        ...replyToSender(ctx),
        parse_mode: "MarkdownV2",
      });
    }
    const module = commandRegister.get(commandHelp as string);
    if (module) {
      if (module?.description) {
        lines.push(`/${module.command} — ${module.description}`);
      } else {
        lines.push(`/${module.command} — ${module.shortDescription}`);
      }
    } else {
      lines.push(`Não encontrei nenhuma ajuda pro comando ${commandHelp}`);
    }
    ctx.reply(mdEscape(lines.join("\n")), {
      ...replyToSender(ctx),
      parse_mode: "MarkdownV2",
    });
  });
  return helpModule;
};

bot.catch((err) => {
  console.error(`Error handling update ${err.ctx.update.update_id}:`, err.error);
});

bot.use(hydrate());
addModuleToBot(oocModule);
addModuleToBot(badumtsModule);
addModuleToBot(deliriosModule);
addModuleToBot(keyboardModule);
addModuleToBot(repetidaModule);
addModuleToBot(revoltaModule);
addModuleToBot(perdoaModule);
addModuleToBot(lazerModule);
addModuleToBot(acendeModule);
addModuleToBot(quoteModule);
bot.use(help(commandRegister));
bot.use(paolica);
bot.use(salpicao);
bot.use(referral);
// Must stay last: any /<key> that no command handled is looked up as a quote
bot.use(quoteShortcut);

bot.start({
  onStart: async (me) => {
    console.log(`Started...`);
    console.log(`Bot username is ${me.username} (id: ${me.id})`);

    bot.api.config.use(hydrateFiles(bot.token));
    await bot.api.setMyCommands(
      [
        {
          command: "ajuda",
          shortDescription: "Lista os comandos do bot",
        },
        ...commandRegister.values(),
      ]
        .filter((command) => command.command && command.shortDescription)
        .map((command) => {
          console.log(`setting command ${command.command} `);
          return {
            command: command.command as string,
            description: command.shortDescription as string,
          };
        }),
    );
  },
});
