import { Composer } from "grammy";
import { BotModule } from "../main";
import { OocContext } from "../config";
import { replyToReply } from "../utils/message";
import { withNext } from "../utils/middleware";
import { Pronoun } from ".prisma/client";
import { getUserPronounByTelegramId } from "../data/user";
import { filterBanReason, getRandomBanReason } from "../data/ban-reason";
import { banUser } from "../data/ban";
import { User } from "@grammyjs/types";

export const ban = new Composer<OocContext>();

const banMessageFormat = {
  [Pronoun.HE]: (person: string, reason: string) =>
    `${person} foi banido por ${reason}`,
  [Pronoun.SHE]: (person: string, reason: string) =>
    `${person} foi banida por ${reason}`,
  [Pronoun.THEY]: (person: string, reason: string) =>
    `${person} foi banide por ${reason}`,
};

ban.command(
  ["ban", "warn"],
  withNext(async (context: OocContext) => {
    const receivedMessage = context.update.message;
    const banningMessage = receivedMessage?.reply_to_message;
    if (banningMessage) {
      const bannedPerson = banningMessage.from;
      if (!bannedPerson) {
        return;
      }
      const query = context.match as string;
      const randomReason = await getRandomBanReason();
      let [banReason] = randomReason;
      if (query) {
        const foundReason = await filterBanReason(query);
        if (foundReason.length > 0) {
          const random = [...foundReason][
            Math.floor(Math.random() * foundReason.length)
          ];
          banReason = random;
        }
      }
      const bannedPersonName = bannedPerson.first_name;
      const bannedPersonPronoun = (await getUserPronounByTelegramId(
        bannedPerson.id
      )) as Pronoun;
      const bannedMessageFormat =
        banMessageFormat[bannedPersonPronoun] || banMessageFormat[Pronoun.THEY];
      await banUser(bannedPerson, receivedMessage.from as User, banReason);
      await context.reply(
        bannedMessageFormat(bannedPersonName, banReason.reason),
        {
          ...replyToReply(context),
        }
      );
      return;
    }
  })
);

export const banModule: BotModule = {
  command: "ban",
  shortDescription: "Bane um usuário do chat",
  composer: ban,
};
