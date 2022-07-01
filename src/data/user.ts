import { Pronoun, TelegramUser } from ".prisma/client";
import { User } from "@grammyjs/types";
import { dbClient } from "./client";

export const getTelegramUserDetails = (user: User) => {
  return {
    first_name: user.first_name,
    last_name: user.last_name ?? null,
    username: user.username ?? null,
    telegram_id: user.id,
  };
};

export const upsertTelegramUser = async (user: User) => {
  return dbClient.telegramUser.upsert({
    where: {
      telegram_id: user.id,
    },
    update: {},
    create: {
      ...getTelegramUserDetails(user),
    },
  });
};

export const getUserById = async (id: number) => {
  return dbClient.telegramUser.findUnique({
    where: {
      id,
    },
  });
};

export const updateUserPronounByTelegramId = async (
  id: number,
  pronoun: Pronoun
) => {
  return dbClient.telegramUser.update({
    where: {
      telegram_id: id,
    },
    data: {
      pronoun,
    },
  });
};

export const getUserPronounByTelegramId = async (id: number) => {
  const pronoun = await dbClient.telegramUser.findUnique({
    where: {
      telegram_id: id,
    },
    select: {
      pronoun: true,
    },
  });
  if (pronoun?.pronoun) {
    return pronoun.pronoun;
  }
  return Pronoun.THEY;
};
