import { Pronoun } from ".prisma/client";
import { User } from "@grammyjs/types";
import { Composer, Keyboard, NextFunction } from "grammy";
import { OocContext } from "../config";
import { BOT_MESSAGE_TRACKER } from "../config/environment";
import {
  getUserById,
  getUserPronounByTelegramId,
  updateUserPronounByTelegramId,
} from "../data/user";
import { BotModule } from "../main";
import { replyToSender } from "../utils/message";

export const pronouns = new Composer<OocContext>();

const PRONOUNS_TRIGGERS = {
  [Pronoun.HE]: `${BOT_MESSAGE_TRACKER}Ele/Dele 💁‍♂️`,
  [Pronoun.SHE]: `${BOT_MESSAGE_TRACKER}Ela/Dela 💁‍♀️`,
  [Pronoun.THEY]: `${BOT_MESSAGE_TRACKER}Elu/Delu 💁`,
};

const pronounsKeyboard = new Keyboard()
  .text(PRONOUNS_TRIGGERS[Pronoun.SHE])
  .row()
  .text(PRONOUNS_TRIGGERS[Pronoun.HE])
  .row()
  .text(PRONOUNS_TRIGGERS[Pronoun.THEY]);

const isGroupChat = (chatId: string) => chatId.startsWith("-");

pronouns.command(["pronome", "pronomes"], async (ctx, next) => {
  if (isGroupChat(String(ctx.chat.id))) {
    await ctx.reply("Esse comando só funciona em chats privados.", {
      ...replyToSender(ctx),
    });
    await next();
    return;
  }
  if (!ctx.from) {
    // no from, ignore the message
    await next();
    return;
  }
  const currentPronoun = await getUserPronounByTelegramId(
    ctx.from.id as number
  );
  const pronounsChamado = {
    [Pronoun.HE]: "chamado",
    [Pronoun.SHE]: "chamada",
    [Pronoun.THEY]: "chamade",
  };
  await ctx.reply(
    `Como você prefere ser ${pronounsChamado[currentPronoun]}? (Seu pronome atual é ${PRONOUNS_TRIGGERS[currentPronoun]})`,
    {
      ...replyToSender(ctx),
      reply_markup: {
        one_time_keyboard: true,
        keyboard: pronounsKeyboard.build(),
      },
    }
  );
  await next();
  return;
});

async function updateUserPronouns(user: User, pronoun: Pronoun) {
  await updateUserPronounByTelegramId(user.id, pronoun);
}

function makePronounTrigger(pronoun: Pronoun) {
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
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
    await next();
  };
}

pronouns.hears(PRONOUNS_TRIGGERS[Pronoun.SHE], makePronounTrigger(Pronoun.SHE));
pronouns.hears(PRONOUNS_TRIGGERS[Pronoun.HE], makePronounTrigger(Pronoun.HE));
pronouns.hears(
  PRONOUNS_TRIGGERS[Pronoun.THEY],
  makePronounTrigger(Pronoun.THEY)
);

export const pronounModule: BotModule = {
  composer: pronouns,
  command: "pronome",
  alias: ["pronomes"],
  shortDescription:
    "Escolha seus pronomes. Personaliza alguns comandos do bot. Só funciona em chat privado",
};
