import { Composer } from "grammy";
import { OocContext } from "../config";

const americanasPattern = /(https:\/\/(?:www.)?americanas.com.br\/.*)/gm;

const americanasTransformer = (matches: RegExpMatchArray) => {
  const [, productUrl] = matches;
  const affiliate =
    "https://www.awin1.com/cread.php?awinmid=22193&awinaffid=898295&ued=";
  return `${affiliate}${encodeURIComponent(productUrl)}`;
};

export const americanas = new Composer<OocContext>();
americanas.hears(americanasPattern, async (ctx) => {
  const receivedMessage = ctx.message!;
  const newLink = americanasTransformer(ctx.match as RegExpMatchArray);
  return await ctx.reply(`Use o [link do PromoSup](${newLink})\\!`, {
    reply_to_message_id: receivedMessage.message_id,
    parse_mode: "MarkdownV2",
  });
});
