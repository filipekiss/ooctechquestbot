import { ChatFromGetChat, ChatMemberUpdated, User } from "@grammyjs/types";
import { Composer, GrammyError, MiddlewareFn } from "grammy";
import { OocContext } from "../config";
import {
  upsertTelegramChat,
  disableBotInChat,
  getBotChatByTelegramChatId,
  linkChatToUser,
} from "../data/chat";
import { upsertTelegramUser } from "../data/user";

type OocMiddleware = MiddlewareFn<OocContext>;

export const metadataMiddleware = new Composer<OocContext>();

const toggleChatStatus: OocMiddleware = async (ctx, next) => {
  console.log("my_chat_member");
  const status = ctx.update?.my_chat_member?.new_chat_member.status;
  switch (status) {
    case "left":
    case "kicked": {
      console.log(`bot was removed or left chat`);
      const { chat: telegramChat } = ctx.update
        .my_chat_member as ChatMemberUpdated;
      const chat = await getBotChatByTelegramChatId(telegramChat.id);
      if (chat) {
        await disableBotInChat(chat);
        return;
      }
      console.log("Chat not found. Skipping…");
    }
    case "member":
    case "administrator": {
      const telegramChat = await ctx.getChat();
      const botChat = await upsertTelegramChat(telegramChat);
      console.log({ botChat });
      break;
    }
    default:
      console.log(status);
      await next();
      break;
  }
};

metadataMiddleware.on("my_chat_member", toggleChatStatus);

const registerChatDetails: OocMiddleware = async (ctx, next) => {
  try {
    const user = await upsertTelegramUser(ctx.from as User);
    const telegramChat = await ctx.getChat();
    const botChat = await upsertTelegramChat(telegramChat);
    if (botChat) {
      await linkChatToUser(botChat, user);
    }
  } catch (e) {
    if (e instanceof GrammyError) {
      console.log("Error when saving metadata");
      console.log(e.description);
    } else {
      console.log("Unknown error");
      console.log(e);
    }
  } finally {
    await next();
  }
};

const isBotMentioned = async (ctx: OocContext) => {
  return Boolean(
    ctx.message?.text && ctx.message.text.includes(ctx.me.username)
  );
};
metadataMiddleware
  .on(":entities:mention")
  .filter(isBotMentioned, registerChatDetails);
metadataMiddleware.on(":entities:bot_command", registerChatDetails);
