import { Composer } from "grammy";
import { BotModule } from "../main";
import { OocContext } from "../config";
import { getBanReason } from "./reason";
import { getUserPronouns, PRONOUNS } from "../prounous";
import { replyToReply } from "../utils/message";

export const ban = new Composer<OocContext>();

const banMessageFormat = {
  [PRONOUNS.HE]: (person: string, reason: string) =>
    `${person} foi banido por ${reason}`,
  [PRONOUNS.SHE]: (person: string, reason: string) =>
    `${person} foi banida por ${reason}`,
  [PRONOUNS.THEY]: (person: string, reason: string) =>
    `${person} foi banide por ${reason}`,
};

ban.command(["ban", "warn"], async (context: OocContext) => {
  const receivedMessage = context.update.message;
  const banningMessage = receivedMessage?.reply_to_message;
  if (banningMessage) {
    const query = context.match as string;
    const randomReason = (await getBanReason()).random();
    let banReason = randomReason;
    if (query) {
      const allReasons = (await getBanReason()).all();
      const foundReason = allReasons.filter((reason) => {
        return reason.toLowerCase().indexOf(query) > -1;
      });
      if (foundReason.length > 0) {
        const random = [...foundReason][
          Math.floor(Math.random() * foundReason.length)
        ];
        banReason = random;
      }
    }
    const bannedPerson = banningMessage.from;
    if (!bannedPerson) {
      return;
    }
    const bannedPersonName = bannedPerson.first_name;
    const bannedPersonPronoun = await getUserPronouns(bannedPerson);
    console.log(bannedPersonPronoun);
    const bannedMessageFormat =
      banMessageFormat[bannedPersonPronoun as unknown as PRONOUNS] ||
      banMessageFormat[PRONOUNS.THEY];
    await context.reply(bannedMessageFormat(bannedPersonName, banReason), {
      ...replyToReply(context),
    });
    return;
  }
});

export const banModule: BotModule = {
  command: "ban",
  shortDescription: "Bane um usuário do chat",
  composer: ban,
};
