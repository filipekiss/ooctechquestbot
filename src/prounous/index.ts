import { User } from "@grammyjs/types";
import { Composer, Keyboard, NextFunction } from "grammy";
import Keyv from "keyv";
import { OocContext } from "../config";
import { BOT_MESSAGE_TRACKER, DB_FOLDER } from "../config/environment";
import { BotModule } from "../main";

export const pronouns = new Composer<OocContext>();

const pronounsDB = new Keyv(`sqlite://${DB_FOLDER}/pronouns.sqlite`);

export enum PRONOUNS {
  HE = "HE",
  SHE = "SHE",
  THEY = "THEY",
}

const PRONOUNS_TRIGGERS = {
  [PRONOUNS.HE]: `${BOT_MESSAGE_TRACKER}Ele/Dele`,
  [PRONOUNS.SHE]: `${BOT_MESSAGE_TRACKER}Ela/Dela`,
  [PRONOUNS.THEY]: `${BOT_MESSAGE_TRACKER}Elu/Delu`,
};

const PRONOUNS_VALUES = {
  [`${BOT_MESSAGE_TRACKER}Ele/Dele`]: [PRONOUNS.HE],
  [`${BOT_MESSAGE_TRACKER}Ela/Dela`]: [PRONOUNS.SHE],
  [`${BOT_MESSAGE_TRACKER}Elu/Delu`]: [PRONOUNS.THEY],
};

const pronounsKeyboard = new Keyboard()
  .text(PRONOUNS_TRIGGERS[PRONOUNS.SHE])
  .row()
  .text(PRONOUNS_TRIGGERS[PRONOUNS.HE])
  .row()
  .text(PRONOUNS_TRIGGERS[PRONOUNS.THEY]);

pronouns.command(["pronome", "pronomes"], async (ctx, next) => {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply("Como você prefere ser chamado?", {
    reply_to_message_id: receivedMessage.message_id,
    reply_markup: {
      one_time_keyboard: true,
      keyboard: pronounsKeyboard.build(),
    },
  });
  await next();
  return;
});

async function updateUserPronouns(user: User, pronouns: PRONOUNS) {
  console.log({ user, pronouns });
  await pronounsDB.set(String(user.id), pronouns);
}

export async function getUserPronouns(user: User) {
  const pronouns = (await pronounsDB.get(String(user.id))) as PRONOUNS;
  console.log({ pronouns });
  if (pronouns) {
    return PRONOUNS[pronouns];
  }
  return PRONOUNS.THEY;
}

function makePronounTrigger(pronoun: PRONOUNS) {
  return async (ctx: OocContext, next: NextFunction) => {
    const from = ctx.message?.from;
    if (!from) {
      console.log("No from, skipping…");
      await next();
      return;
    }
    await updateUserPronouns(from, pronoun);
    await ctx.reply(
      `Pronto! Seu pronome foi gravado como ${PRONOUNS_TRIGGERS[
        pronoun
      ].replace(BOT_MESSAGE_TRACKER, "")}`,
      {
        reply_to_message_id: ctx.message.message_id,
      }
    );
    await next();
  };
}

pronouns.hears(
  PRONOUNS_TRIGGERS[PRONOUNS.SHE],
  makePronounTrigger(PRONOUNS.SHE)
);
pronouns.hears(PRONOUNS_TRIGGERS[PRONOUNS.HE], makePronounTrigger(PRONOUNS.HE));
pronouns.hears(
  PRONOUNS_TRIGGERS[PRONOUNS.THEY],
  makePronounTrigger(PRONOUNS.THEY)
);

export const pronounModule: BotModule = {
  composer: pronouns,
  command: "pronome",
  alias: ["pronomes"],
  shortDescription: "Escolha seus pronomes. Personaliza alguns comandos do bot",
};