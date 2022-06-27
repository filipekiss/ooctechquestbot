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
