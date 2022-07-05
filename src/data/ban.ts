import { User } from "@grammyjs/types";
import { dbClient } from "./client";
import { getTelegramUserDetails } from "./user";
import { BanReason } from ".prisma/client";

export const banUser = (banned: User, reporter: User, reason: BanReason) => {
  return dbClient.ban.create({
    data: {
      reported: {
        connectOrCreate: {
          where: {
            telegram_id: banned.id,
          },
          create: getTelegramUserDetails(banned),
        },
      },
      reporter: {
        connectOrCreate: {
          where: {
            telegram_id: reporter.id,
          },
          create: getTelegramUserDetails(reporter),
        },
      },
      reason: {
        connect: {
          id: reason.id,
        },
      },
    },
  });
};
