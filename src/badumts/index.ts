import { Composer } from 'grammy'
import {OocContext} from '../config';

export const badumts = new Composer<OocContext>();

const replyBadumts =
badumts.command(["badumtss", "badumts"], (context: OocContext) => {
  const receivedMessage = context.update.message;
  return context.reply(
    "(☞ﾟヮﾟ)☞ ",
    {
      reply_to_message_id: receivedMessage?.reply_to_message?.message_id ?? context.message!.message_id
    }
  )
});

