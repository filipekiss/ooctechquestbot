import { Composer, InlineKeyboard } from "grammy";
import { OocContext } from "../config";

const amazonPattern =
  /(https:\/\/(?:www.)?amazon.com.br)\/(?:[^\/]+\/)?dp\/([^\/?]+)/gm;
const amazonTransformer = (matches: RegExpMatchArray) => {
  const [, amazonUrl, id] = matches;
  const affiliate = "?tag=mq08-20";
  return `${amazonUrl}/dp/${id}${affiliate}`;
};

export const amazon = new Composer<OocContext>();
amazon.hears(amazonPattern, async (ctx) => {
  const receivedMessage = ctx.message!;
  const newLink = amazonTransformer(ctx.match as RegExpMatchArray);
  const linkButton = new InlineKeyboard().url("Ver na Amazon", newLink);
  return await ctx.reply(`Use o [link do PromoSup](${newLink})\\!`, {
    reply_to_message_id: receivedMessage.message_id,
    parse_mode: "MarkdownV2",
    reply_markup: linkButton,
  });
});
