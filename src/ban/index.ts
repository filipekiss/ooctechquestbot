import { Composer } from "grammy";
import { BotModule } from "../main";
import { OocContext } from "../config";
import { getBanReason } from "./reason";

export const ban = new Composer<OocContext>();

ban.command(["ban", "warn"], async (context: OocContext) => {
  const receivedMessage = context.update.message;
  const banningMessage = receivedMessage?.reply_to_message;
  if (banningMessage) {
    const query = context.match as string;
    const randomReason = (await getBanReason()).random();
    let banReason = randomReason;
    if (query) {
      const allReasons = (await getBanReason()).all();
      const foundReason = allReasons.find((reason) => {
        return reason.toLowerCase().indexOf(query) > -1;
      });
      if (foundReason) {
        banReason = foundReason;
      }
    }
    const bannedPerson = banningMessage.from?.first_name;
    await context.reply(`${bannedPerson} foi banido por ${banReason}`, {
      reply_to_message_id: banningMessage.message_id,
    });
    return;
  }
});

export const banModule: BotModule = {
  command: "ban",
  shortDescription: "Bane um usuário do chat",
  composer: ban,
};
