import { Composer } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";
import { removeKeyboard, replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const keyboard = new Composer<OocContext>();

// command without reply
keyboard.command(
  ["keyboard", "teclado"],
  withNext(async (ctx) => {
    const receivedMessage = ctx.message!;
    const botReply = await ctx.reply("Tentando desativar o teclado...", {
      ...replyToSender(ctx),
      ...removeKeyboard(),
    });
    setTimeout(async () => {
      try {
        await receivedMessage.delete();
        await botReply.delete();
      } catch {
        console.warn("Unable to delete message. Skipping…");
      }
    }, 500);
    return;
  })
);

export const keyboardModule: BotModule = {
  composer: keyboard,
  command: "keyboard",
  alias: ["teclado"],
  shortDescription: "Tenta desativar o teclado amaldiçoado",
  description:
    "Se as palavras 'Loirinha', 'Ofendido' e 'Preocupado' não fazem sentido pra você, você não precisa desse comando",
};
