import { differenceInCalendarDays, format, parse } from "date-fns";
import { Composer } from "grammy";
import { InputFile, ReplyMessage } from "grammy/out/platform";
import { OocContext } from "../config";
import { getMetaValue, setMetaValue } from "../data/meta";
import { getReportedMessageByMessageId, reportMessage } from "../data/report";
import { BotModule } from "../main";
import { replyToReply, replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";
import { generateStreakImage } from "./generate-streak-image";
import { isReply } from "./is-message-reply.filter";

const REPORT_SCHEMA = {
	LAST_INCIDENT_DATE: "report_last_incident_date",
	LONGEST_STREAK: "report_longest_streak",
	CURRENT_STREAK: "report_current_streak",
};

function calculateStreakDifference(laterDate: string, earlierDate: string) {
	const parsedLaterDate = parse(laterDate, "T", new Date());
	if (!earlierDate) {
		return differenceInCalendarDays(new Date(), parsedLaterDate);
	}
	const parsedEarlierDate = parse(earlierDate, "T", new Date());
	return differenceInCalendarDays(parsedLaterDate, parsedEarlierDate);
}

export const report = new Composer<OocContext>();

export async function getStreakData(latestIncidentDate: string) {
	const previousIncidentDate = (await getMetaValue(
		REPORT_SCHEMA.LAST_INCIDENT_DATE
	)) as string;
	const previousStreak: number =
		Number(await getMetaValue(REPORT_SCHEMA.LONGEST_STREAK)) || 0;
	const currentStreak = Number(await getMetaValue(REPORT_SCHEMA.CURRENT_STREAK)) || calculateStreakDifference(latestIncidentDate, previousIncidentDate);
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
	await setMetaValue(
		REPORT_SCHEMA.LONGEST_STREAK,
		String(Math.max(currentStreak, previousStreak))
	);
}

async function replyAlreadyReported(ctx: OocContext) {
	return ctx.reply("Essa mensagem já foi reportada.", {
		...replyToSender(ctx),
	});
}

const today = format(new Date(), "T");

async function sendReport(ctx: OocContext, isReport?: boolean) {
	await ctx.replyWithChatAction("upload_photo");
	const streakData = await getStreakData(today);
	ctx.replyWithPhoto(
		new InputFile(
			await generateStreakImage(
				streakData.currentStreak.toString(),
				streakData.longestStreak.toString()
			)
		),
		{
			reply_to_message_id: isReport
				? replyToReply(ctx).reply_to_message_id
				: undefined,
		}
	);
}

// command without reply
report
	.filter((x) => {
		return !isReply(x);
	})
	.command(
		`report`,
		withNext(async (ctx) => {
			sendReport(ctx);
		})
	);

// command with reply
report.filter(isReply).command(
	`report`,
	withNext(async (ctx) => {
		if (ctx.message && ctx.message.reply_to_message) {
			const receivedMessage = ctx.message;
			const reportedMessage = receivedMessage.reply_to_message as ReplyMessage;
			// Check if message has been reported
			if (await getReportedMessageByMessageId(reportedMessage.message_id)) {
				await replyAlreadyReported(ctx);
				return;
			}
			const { longestStreak, previousIncidentDate } = await getStreakData(today);
			const currentStreak = calculateStreakDifference(today, previousIncidentDate);
			await updateStreakWithLargest(longestStreak, currentStreak);
			await setMetaValue(REPORT_SCHEMA.LAST_INCIDENT_DATE, today);
			console.log(reportedMessage);
			await reportMessage(receivedMessage);

			return sendReport(ctx, true);
		}
	})
);

export const reportModule: BotModule = {
	composer: report,
	command: "report",
	shortDescription: "Reporta uma mensagem e zera o contador",
	description:
		"Se enviado como reposta a uma mensagem, reporta aquela mensagem e zera o contador. Se enviado sem responder, apenas mostra o recorde atual.",
};
