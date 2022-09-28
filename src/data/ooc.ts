import { Ooc, TelegramUser } from ".prisma/client";
import { Message, User } from "@grammyjs/types";
import { dbClient, JsonObject } from "./client";
import {
  getTelegramUserDetails,
  getUserById,
  upsertTelegramUser,
} from "./user";

export const getOocByMessageId = (message_id: number) => {
  return dbClient.ooc.findUnique({
    where: {
      message_id,
    },
  });
};

export const createOoc = (
  message: Message,
  quotedUser: User,
  creatorUser: User
) => {
  return dbClient.ooc.create({
    data: {
      message_id: message.message_id,
      quoted: {
        connectOrCreate: {
          where: {
            telegram_id: quotedUser.id,
          },
          create: getTelegramUserDetails(quotedUser),
        },
      },
      creator: {
        connectOrCreate: {
          where: {
            telegram_id: creatorUser.id,
          },
          create: getTelegramUserDetails(creatorUser),
        },
      },
    },
  });
};

export const addImageToOoc = async (ooc: Ooc, image: string) => {
  return dbClient.ooc.update({
    where: {
      id: ooc.id,
    },
    data: {
      image: image,
    },
  });
};

export const getOocStats = async () => {
  const totalOoc = await dbClient.ooc.count();
  const [topOocUser] = await Promise.all(
    (
      await dbClient.ooc.groupBy({
        by: ["quoted_id"],
        take: 1,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      })
    ).map(async (quote) => {
      const author = (await getUserById(quote.quoted_id)) as TelegramUser;
      return {
        ...quote,
        author,
      };
    })
  );
  const [topOocAuthor] = await Promise.all(
    (
      await dbClient.ooc.groupBy({
        by: ["creator_id"],
        take: 1,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      })
    ).map(async (quote) => {
      const author = (await getUserById(quote.creator_id)) as TelegramUser;
      return {
        ...quote,
        author,
      };
    })
  );

  return {
    totalOoc,
    topOocUser,
    topOocAuthor,
  };
};

export const getOocStatsForUser = async (user: User) => {
  const oocUser = await upsertTelegramUser(user);
  const [timesQuoted] = await Promise.all(
    (
      await dbClient.ooc.groupBy({
        by: ["quoted_id"],
        take: 1,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        where: {
          quoted_id: oocUser.id,
        },
      })
    ).map(async (quote) => {
      return {
        ...quote,
        author: user,
      };
    })
  );
  const [timesCreated] = await Promise.all(
    (
      await dbClient.ooc.groupBy({
        by: ["creator_id"],
        take: 1,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        where: {
          creator_id: oocUser.id,
        },
      })
    ).map(async (quote) => {
      return {
        ...quote,
        author: user,
      };
    })
  );

  return {
    timesQuoted,
    timesCreated,
  };
};
