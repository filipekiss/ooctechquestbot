import { differenceInCalendarDays, format, parse } from "date-fns";
import { Composer } from "grammy";
import { InputFile, ReplyMessage } from "grammy/out/platform";
import Keyv from "keyv";
import { OocContext } from "../config";
import { DB_FOLDER } from "../config/environment";
import { generateStreakImage } from "./generate-streak-image";
import { isReply } from "./is-message-reply.filter";

const REPORT_SCHEMA = {
  LAST_INCIDENT_DATE: "last_incident_date",
  LONGEST_STREAK: "longest_streak",
  LAST_REPORTED_MESSAGE_ID: "last_reported_message_id",
};

function calculateStreakDifference(laterDate: string, earlierDate: string) {
  if (!laterDate || !earlierDate) {
    return differenceInCalendarDays(new Date(), new Date());
  }
  const parsedLaterDate = parse(laterDate, "T", new Date());
  const parsedEarlierDate = parse(earlierDate, "T", new Date());
  return differenceInCalendarDays(parsedLaterDate, parsedEarlierDate);
}

const reportDB = new Keyv(`sqlite://${DB_FOLDER}/report.sqlite`);
export const report = new Composer<OocContext>();

export async function getStreakData(latestIncidentDate: string) {
  const previousIncidentDate = await reportDB.get(
    REPORT_SCHEMA.LAST_INCIDENT_DATE
  );
  const previousStreak: number =
    (await reportDB.get(REPORT_SCHEMA.LONGEST_STREAK)) || 0;
  const currentStreak = calculateStreakDifference(
    latestIncidentDate,
    previousIncidentDate
  );
  const longestStreak = Math.max(currentStreak, previousStreak);
  return {
    previousIncidentDate,
    previousStreak,
    currentStreak,
    longestStreak,
  };
}

async function updateStreakWithLargest(
  currentStreak: number,
  previousStreak: number
) {
  await reportDB.set(
    REPORT_SCHEMA.LONGEST_STREAK,
    Math.max(currentStreak, previousStreak)
  );
}

async function replyAlreadyReported(ctx: OocContext) {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply("Essa mensagem já foi reportada.", {
    reply_to_message_id: receivedMessage.message_id,
  });
  setTimeout(async () => {
    try {
      await receivedMessage.delete();
      await botReply.delete();
    } catch {
      console.warn("Unable to delete message. Skipping…");
    }
  }, 15000);
  return;
}

const today = format(new Date(), "T");

async function sendReport(ctx: OocContext, isReport?: boolean) {
  const streakData = await getStreakData(today);
    return ctx.replyWithPhoto(
      new InputFile(
        await generateStreakImage(
          streakData.currentStreak.toString(),
          streakData.longestStreak.toString()
        )
      ),
      {
        reply_to_message_id: isReport
          ? ctx.message!.reply_to_message!.message_id
          : undefined,
      }
    );
}

// command without reply
report
  .filter((x) => {
    return !isReply(x);
  })
  .command(`report`, async (ctx) => {
    return sendReport(ctx);
  });

// command with reply
report.filter(isReply).command(`report`, async (ctx) => {
  if (ctx.message && ctx.message.reply_to_message) {
    const receivedMessage = ctx.message;
    const reportedMessage = receivedMessage.reply_to_message as ReplyMessage;
    // Check if message has been reported
    if (await reportDB.get(reportedMessage.message_id.toString())) {
      return replyAlreadyReported(ctx);
    }
    const { longestStreak, currentStreak } = await getStreakData(today);
    updateStreakWithLargest(longestStreak, currentStreak);
    await reportDB.set(REPORT_SCHEMA.LAST_INCIDENT_DATE, today);
    await reportDB.set(
      REPORT_SCHEMA.LAST_REPORTED_MESSAGE_ID,
      reportedMessage.message_id
    );
    await reportDB.set(reportedMessage.message_id.toString(), reportedMessage);

    return sendReport(ctx, true);
  }
});
