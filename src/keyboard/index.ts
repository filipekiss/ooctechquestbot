import { Composer } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";

export const keyboard = new Composer<OocContext>();

// command without reply
keyboard.command(["keyboard", "teclado"], async (ctx) => {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply("Tentando desativar o teclado...", {
    reply_to_message_id: receivedMessage.message_id,
    reply_markup: {
      remove_keyboard: true,
    },
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
});

export const keyboardModule: BotModule = {
  composer: keyboard,
  command: "keyboard",
  alias: ["teclado"],
  shortDescription: "Tenta desativar o teclado amaldiçoado",
  description:
    "Se as palavras 'Loirinha', 'Ofendido' e 'Preocupado' não fazem sentido pra você, você não precisa desse comando",
};
