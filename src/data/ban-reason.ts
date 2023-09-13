import { User } from "@grammyjs/types";
import { dbClient } from "./client";
import { getTelegramUserDetails } from "./user";
import { v5 as uuidv5 } from "uuid";
import { BanReason, Prisma } from ".prisma/client";

const BAN_REASON_NAMESPACE = "2232e283-9137-4473-a1f8-25b5fa1ac643";

export const getBanReasonFromReason = (reason: string) => {
  const id = generateIdFromReason(reason);
  return dbClient.banReason.findFirst({
    where: {
      id,
    },
  });
};

export const filterBanReason = (reason: string) => {
  console.log(`querying for reason: ${reason}`);
  return dbClient.banReason.findMany({
    where: {
      is_active: true,
      reason: {
        contains: reason,
        mode: "insensitive",
      },
    },
  });
};

export const getAllBanReasons = () => {
  return dbClient.banReason.findMany({
    where: {
      is_active: true,
    },
    orderBy: {
      reason: "asc",
    },
  });
};

export const addBanReason = async (reason: string, creator: User) => {
  const id = generateIdFromReason(reason);
  return await dbClient.banReason.create({
    data: {
      id,
      reason,
      creator: {
        connectOrCreate: {
          create: getTelegramUserDetails(creator),
          where: {
            telegram_id: creator.id,
          },
        },
      },
    }
  });
};

export const enableReason = async (reason: string) => {
  return dbClient.banReason.update({
    where: {
      id: generateIdFromReason(reason),
    },
    data: {
      is_active: true,
    },
  });
};

export const disableReason = async (reason: string) => {
  return dbClient.banReason.update({
    where: {
      id: generateIdFromReason(reason),
    },
    data: {
      is_active: false,
    },
  });
};

export const generateIdFromReason = (reason: string) => {
  return uuidv5(reason.toLowerCase(), BAN_REASON_NAMESPACE);
};

export const getRandomBanReason = () => {
  return dbClient.$queryRaw`SELECT * FROM "BanReason" WHERE is_active = TRUE ORDER BY random() LIMIT 1;` as Promise<
    BanReason[]
  >;
};

export const incrementUsesCountById = (id: string) => {
  return dbClient.banReason.update({
    where: {
      id,
    },
    data: {
      uses: {
        increment: 1,
      },
    },
  });
};

export const deleteBanReason = (reason: string) => {
  return dbClient.banReason.delete({
    where: {
      id: generateIdFromReason(reason),
    },
  });
};
