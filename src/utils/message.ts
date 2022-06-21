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