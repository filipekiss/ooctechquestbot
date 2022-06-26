import { TelegramUser } from ".prisma/client";
import { Message, User } from "@grammyjs/types";
import { dbClient, JsonObject } from "./client";
import { getUserById } from "./user";

export const getQuoteByKey = (key: string) => {
  return dbClient.quote.findUnique({
    where: {
      key,
    },
  });
};

export const getQuoteByMessageId = (message_id: number) => {
  return dbClient.quote.findUnique({
    where: {
      message_id,
    },
  });
};

export const getAllQuoteKeys = () => {
  return dbClient.quote.findMany({
    select: {
      key: true,
    },
  });
};

export const createQuote = (
  key: string,
  message_to_quote: Message,
  author: User,
  quoted_by: User
) => {
  return dbClient.quote.create({
    data: {
      key,
      chat_id: message_to_quote.chat.id.toString(),
      message_id: message_to_quote.message_id,
      message: message_to_quote as unknown as JsonObject,
      author: {
        connectOrCreate: {
          where: {
            telegram_id: author.id,
          },
          create: {
            telegram_id: author.id,
            first_name: author.first_name,
            last_name: author.last_name,
            username: author.username,
          },
        },
      },
      quoted_by: {
        connectOrCreate: {
          where: {
            telegram_id: quoted_by.id,
          },
          create: {
            telegram_id: quoted_by.id,
            first_name: quoted_by.first_name,
            last_name: quoted_by.last_name,
            username: quoted_by.username,
          },
        },
      },
    },
  });
};

export const incrementUsesCountById = (id: number) => {
  return dbClient.quote.update({
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

export const getQuoteStats = async () => {
  const totalQuotes = await dbClient.quote.count();
  const topThreeUsedQuotes = await dbClient.quote.findMany({
    select: {
      key: true,
      uses: true,
    },
    orderBy: {
      uses: "desc",
    },
    where: {
      uses: {
        gt: 0,
      },
    },
    take: 3,
  });
  const [topQuotedUser] = await Promise.all(
    (
      await dbClient.quote.groupBy({
        by: ["author_id"],
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
      const author = (await getUserById(quote.author_id)) as TelegramUser;
      return {
        ...quote,
        author,
      };
    })
  );
  const [topQuoteAuthor] = await Promise.all(
    (
      await dbClient.quote.groupBy({
        by: ["quoted_by_id"],
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
      const author = (await getUserById(quote.quoted_by_id)) as TelegramUser;
      return {
        ...quote,
        author,
      };
    })
  );
  return {
    totalQuotes,
    topThreeUsedQuotes,
    topQuotedUser,
    topQuoteAuthor,
  };
};
