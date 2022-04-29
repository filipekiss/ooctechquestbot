import { Composer } from "grammy";
import { OocContext } from "../config";

const magazinePattern =
  /(http(?:s)?:\/\/(?:www.)?magazinevoce.com.br)\/([^\/]+)\/(.*)/gm;

const magazineTransformer = (matches: RegExpMatchArray) => {
  const [, magazineUrl, , productDetails] = matches;
  const affiliate = "magazinepromosupoficial";
  return `${magazineUrl}/${affiliate}/${productDetails}`;
};

export const magazine = new Composer<OocContext>();
magazine.hears(magazinePattern, async (ctx) => {
  const receivedMessage = ctx.message!;
  const newLink = magazineTransformer(ctx.match as RegExpMatchArray);
  return await ctx.reply(`Use o [link do PromoSup](${newLink})\\!`, {
    reply_to_message_id: receivedMessage.message_id,
    parse_mode: "MarkdownV2",
  });
});
