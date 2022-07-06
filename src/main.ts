import { hydrate } from "@grammyjs/hydrate";
import { FileApiFlavor, hydrateFiles } from "@grammyjs/files";
import { Api, Bot, Composer, InputFile } from "grammy";
import { acende } from "./acende";
import { badumtsModule } from "./badumts";
import { OocContext, setup } from "./config";
import { BOT_TOKEN } from "./config/environment";
import { ooc } from "./ooc";
import { reportModule } from "./report";
import { nftModule } from "./nft";
import { revoltaModule } from "./revolta";
import { keyboardModule } from "./keyboard";
import { repetidaModule } from "./repetida";
import { paolica } from "./paolica";
import { salpicao } from "./salpicao";
import { banModule } from "./ban";
import { wow } from "./wow";
import { referral } from "./referral";
import { banReasonModule } from "./ban/reason";
import { pronounModule } from "./pronouns";
import { deliriosModule } from "./delirio";
import { simpleReply } from "./simple-reply";
import { lazer } from "./lazer";
import { replyToSender } from "./utils/message";
import { quoteModule } from "./quote";
import { metadataMiddleware } from "./metadata";
import { reportStatsModule } from "./report/stats";

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

const bot = new Bot<OocContext, FileApiFlavor<Api>>(BOT_TOKEN);
const addModuleToBot = (module: BotModule) => {
  if (module.shortDescription && module.command) {
    addToCommandRegister(module.command, module);
  }
  bot.use(module.composer);
};

export function mdEscape(text: string): string {
  return text.replace(/[[\]()~>#+\-=|{}.!\\]/g, "\\$&");
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
        "Se você responder a uma mensagem mencionando o bot, a mensagem é encaminhada para o canal t.me/ooctechquest"
      );
      lines.push("");
      lines.push("Comandos");
      lines.push("———————————");
      lines.push("");
      lines.push(
        "Você pode solicitar ajuda pra um comando específico, por exemplo: `/ajuda luciano` para ver ajuda do comando `luciano`"
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

bot.use(hydrate());
bot.use(metadataMiddleware);
addModuleToBot(nftModule);
addModuleToBot(revoltaModule);
addModuleToBot(reportModule);
addModuleToBot(reportStatsModule);
addModuleToBot(keyboardModule);
addModuleToBot(pronounModule);
addModuleToBot(repetidaModule);
addModuleToBot(banModule);
addModuleToBot(banReasonModule);
addModuleToBot(deliriosModule);
addModuleToBot(quoteModule);
addModuleToBot(badumtsModule);
bot.use(help(commandRegister));
bot.use(lazer);
bot.use(simpleReply);
bot.use(paolica);
bot.use(salpicao);
bot.use(referral);
bot.use(wow);
bot.use(acende);
bot.use(ooc);

bot.start({
  onStart: async (me) => {
    console.log(`Started...`);
    console.log({ me });

    bot.api.config.use(hydrateFiles(bot.token));
    await bot.api.setMyCommands(
      [...commandRegister.values()]
        .filter((command) => command.command && command.shortDescription)
        .map((command) => {
          return {
            command: command.command as string,
            description: command.shortDescription as string,
          };
        })
    );
  },
});
