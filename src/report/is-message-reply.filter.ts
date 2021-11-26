import { OocContext } from "../config";

export const isReply = (ctx: OocContext) => {
  return ctx.msg!.reply_to_message ? true : false;
};
