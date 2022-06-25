import { BotChat, Prisma, PrismaClient, TelegramUser } from ".prisma/client";
import { ChatFromGetChat } from "@grammyjs/types";
import { GroupGetChat, PrivateGetChat } from "../utils/chat";
import { dbClient, JsonObject } from "./client";

export const getBotChatByTelegramChatId = async (telegram_id: number) => {
  return dbClient.botChat.findFirst({
    where: {
      telegram_id: telegram_id,
    },
  });
};

export const upsertTelegramGroupChat = async (chat: GroupGetChat) => {
  const chatDetails = {
    telegram_id: chat.id,
    type: chat.type,
    is_enabled: true,
    title: chat.title,
    TelegramGroupChat: {
      create: {
        type: chat.type,
        telegram_id: chat.id,
        title: chat.title,
        permissions: chat.permissions as JsonObject,
        photo: chat.photo as unknown as JsonObject,
      },
    },
  };
  return dbClient.botChat.upsert({
    where: {
      telegram_id: chat.id,
    },
    create: chatDetails,
    update: {
      is_enabled: true,
    },
  });
};

export const upsertTelegramPrivateChat = async (chat: PrivateGetChat) => {
  return dbClient.botChat.upsert({
    where: {
      telegram_id: chat.id,
    },
    create: {
      telegram_id: chat.id,
      type: chat.type,
      is_enabled: true,
      title: `${chat.first_name} ${chat.last_name} ${
        chat.username ? `(@${chat.username})` : ""
      }`,
      TelegramPrivateChat: {
        create: {
          type: chat.type,
          telegram_id: chat.id,
          photo: chat.photo as unknown as JsonObject,
        },
      },
    },
    update: {
      is_enabled: true,
    },
  });
};

export const upsertTelegramChat = async (chat: ChatFromGetChat) => {
  switch (chat.type) {
    case "supergroup":
    case "group": {
      return await upsertTelegramGroupChat(chat);
    }

    case "private": {
      return await upsertTelegramPrivateChat(chat);
    }

    default:
      console.log(`${chat.type} is not supported by Metadata Middleware`);
      return undefined;
  }
};

export const linkChatToUser = (chat: BotChat, user: TelegramUser) => {
  return updateChatById(chat.id)({
    users: {
      connect: {
        id: user.id,
      },
    },
  });
};

export const disableBotInChat = (chat: BotChat) => {
  return updateChatById(chat.id)({ is_enabled: false });
};

const updateChatById = (id: number) => {
  return async (data: Prisma.BotChatUpdateArgs["data"]) => {
    return dbClient.botChat.update({
      where: {
        id,
      },
      data,
    });
  };
};
