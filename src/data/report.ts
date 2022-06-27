import { TelegramUser } from ".prisma/client";
import { Message, User } from "@grammyjs/types";
import { dbClient, JsonObject } from "./client";
import { getUserById } from "./user";

export const getReportedMessageByMessageId = async (messageId: number) => {
  return dbClient.reportedMessage.findUnique({
    where: {
      message_id: messageId,
    },
  });
};

export const reportMessage = async (message: Message) => {
  const reporter = message.from;
  const reportedMessage = message.reply_to_message;
  const reported = reportedMessage?.from;
  console.log({ message, reported, reporter });
  if (!reporter || !reported) {
    throw new Error("No reporter or reported");
  }
  return dbClient.reportedMessage.create({
    data: {
      message_id: message.message_id,
      message: message as unknown as JsonObject,
      reported: {
        connectOrCreate: {
          where: {
            telegram_id: reported.id,
          },
          create: {
            telegram_id: reported.id,
            first_name: reported.first_name,
            last_name: reported.last_name,
            username: reported.username,
          },
        },
      },
      reporter: {
        connectOrCreate: {
          where: {
            telegram_id: reporter.id,
          },
          create: {
            telegram_id: reporter.id,
            first_name: reporter.first_name,
            last_name: reporter.last_name,
            username: reporter.username,
          },
        },
      },
    },
  });
};

export const getReportStats = async () => {
  const totalReportedMessages = await dbClient.reportedMessage.count();
  const [topReportedUser] = await Promise.all(
    (
      await dbClient.reportedMessage.groupBy({
        by: ["reported_id"],
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
    ).map(async (message) => {
      const reported = (await getUserById(message.reported_id)) as TelegramUser;
      return {
        ...message,
        reported,
      };
    })
  );
  const [topReporter] = await Promise.all(
    (
      await dbClient.reportedMessage.groupBy({
        by: ["reporter_id"],
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
    ).map(async (message) => {
      const reporter = (await getUserById(message.reporter_id)) as TelegramUser;
      return {
        ...message,
        reporter,
      };
    })
  );
  return {
    totalReportedMessages,
    topReportedUser,
    topReporter,
  };
};
