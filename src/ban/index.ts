import { Composer } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";

export const ban = new Composer<OocContext>();

const banReasons = [
  "amar demais",
  "defender bilionários",
  "pedir pack do pezinho",
  "não gostar de One Piece",
  "falar mal de Naruto",
  "seguir a Juzão no instagram",
  "chorar no banheiro da empresa",
];

ban.command(["ban"], async (context: OocContext) => {
  const receivedMessage = context.update.message;
  const banningMessage = receivedMessage?.reply_to_message;
  if (banningMessage) {
    const banReason = banReasons[Math.floor(Math.random() * banReasons.length)];
    const bannedPerson = banningMessage.from?.first_name;
    await context.reply(`${bannedPerson} foi banido por ${banReason}`, {
      reply_to_message_id: banningMessage.message_id,
    });
  }
});

export const banModule: BotModule = {
  command: "ban",
  shortDescription: "Bane um usuário do chat",
  composer: ban,
};
