import { User } from "@grammyjs/types";
import { dbClient } from "./client";

export const upsertTelegramUser = async (user: User) => {
  return dbClient.telegramUser.upsert({
    where: {
      telegram_id: user.id,
    },
    update: {},
    create: {
      telegram_id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    },
  });
};
