import { MessageX } from "@grammyjs/hydrate/out/data/message";
import { Message, User } from "@grammyjs/types";
import { OocContext } from "../config";

export const replyToSender = (context: OocContext) => {
  return {
    reply_to_message_id: context.message?.message_id,
  };
};

export const replyToReply = (context: OocContext) => {
  return {
    reply_to_message_id: context.message?.reply_to_message?.message_id,
  };
};

export const replyToReplyOrToSender = (context: OocContext) => {
  return {
    reply_to_message_id:
      context.message?.reply_to_message?.message_id ??
      context.message!.message_id,
  };
};

export const sendAsMarkdown = (): { parse_mode: "MarkdownV2" } => {
  return {
    parse_mode: "MarkdownV2",
  };
};

export const removeKeyboard = (): {
  reply_markup: { remove_keyboard: true };
} => {
  return {
    reply_markup: {
      remove_keyboard: true,
    },
  };
};

export const deleteMessage = async (message: MessageX, timeout: number) => {
  setTimeout(async () => {
    try {
      await message.delete();
    } catch {
      console.warn("Unable to delete message. Skipping…");
    }
  }, timeout);
};

export const getMessageAuthor = (message: Message) => {
  return message.forward_from?.id
    ? message.forward_from
    : (message.from as User);
};

export const getMessageDate = (message: Message) => {
  return message.forward_date ? message.forward_date : message.date;
};
