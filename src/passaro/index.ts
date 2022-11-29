import { Composer, NextFunction } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";
import { replyToSender } from "../utils/message";

export const passaro = new Composer<OocContext>();

const generatePassaro = (target: string) => {
  return `🇧🇷🇧🇷🇧🇷🇧🇷🇧🇷
O POMBO 🐦🐦 TA ESPALHANDO A DOENÇA 🦠🦠DO PASSARO 🐣🐣 NO CATAR

PASSARO 🐥🐥🐥 O PAU ${target.toUpperCase()}
🇧🇷🇧🇷🇧🇷🇧🇷🇧🇷`
}

export const sendPassaro = async (context: OocContext, next: NextFunction) => {
  
  if (!context.message?.text) {
    await next();
    return;
  }
  const target = (context.match as string)
  if (!target) {
    await next();
    return;
  }
  await context.reply(generatePassaro(target), {
    ...replyToSender(context),
  })
};

passaro.command(["passaro"], sendPassaro);

export const passaroModule: BotModule = {
  command: "passaro",
  shortDescription: "🐦🐦🐦🐦",
  composer: passaro,
};
