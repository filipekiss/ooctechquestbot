import { Bot, Context, InputFile } from "grammy";
import {
  ARCHIVE_CHANNEL_ID,
  BOT_TOKEN,
  BOT_USERNAME,
  CUSTOM_ASSETS_FOLDER,
  DEFAULT_ASSETS_FOLDER,
} from "./environment";
import {
  generateQuoteImage,
  listAvailableTemplates,
} from "./helpers/generate-quote-image";
import { parseArguments } from "./helpers/message";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import {
  fireworksAnimation,
  AnimationDefinition,
  Animation,
} from "./animations/fireworks";

function abortIfEmpty(key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${key} cannot be "${value}"`);
  }
  console.log(`Using ${key}: ${value}`);
}
abortIfEmpty(`BOT_TOKEN`, BOT_TOKEN);
abortIfEmpty(`BOT_USERNAME`, BOT_USERNAME);
abortIfEmpty(`ARCHIVE_CHANNEL_ID`, ARCHIVE_CHANNEL_ID);
abortIfEmpty(`DEFAULT_ASSETS_FOLDER`, DEFAULT_ASSETS_FOLDER);
abortIfEmpty(`CUSTOM_ASSETS_FOLDER`, CUSTOM_ASSETS_FOLDER);

type OocContext = HydrateFlavor<Context>;

const bot = new Bot<OocContext>(BOT_TOKEN);
const botUsername = BOT_USERNAME.toLowerCase();

bot.use(hydrate());
bot.on("message:text").on("::mention", async (ctx) => {
  console.log("Bot was mentioned");
  const receivedMessage = ctx.update.message;
  const isPureMention = receivedMessage.text
    .toLowerCase()
    .startsWith(botUsername);

  if (isPureMention && receivedMessage && receivedMessage.reply_to_message) {
    console.log("The message was a reply, forwarding to archive channel");
    const [action] = parseArguments(receivedMessage.text!);
    const messageToQuote = receivedMessage.reply_to_message;
    console.log(messageToQuote);
    ctx.api.forwardMessage(
      ARCHIVE_CHANNEL_ID,
      receivedMessage.chat.id,
      messageToQuote.message_id
    );
    if (messageToQuote.text !== undefined) {
      ctx.api.sendPhoto(
        ARCHIVE_CHANNEL_ID,
        new InputFile(
          await generateQuoteImage({
            text: messageToQuote.text,
            author:
              messageToQuote.from!.username ?? messageToQuote.from!.first_name,
            query: action,
          })
        )
      );
    }
  }
});

bot.command("images", (ctx) => {
  const availableImages = listAvailableTemplates([
    DEFAULT_ASSETS_FOLDER,
    CUSTOM_ASSETS_FOLDER,
  ]);
  ctx.reply(availableImages.join("\n"));
});

function isAnimationDefinition(
  x: Animation | AnimationDefinition
): x is AnimationDefinition {
  if ("tick" in x) {
    return true;
  }
  return false;
}

function createAnimatedMessage(animation: Animation | AnimationDefinition) {
  let animationFrames: Animation;
  let animationSpeed = 1000;
  if (isAnimationDefinition(animation)) {
    animationFrames = animation.frames;
    animationSpeed = animation.tick;
  } else {
    animationFrames = animation;
  }
  return async function (ctx: OocContext) {
    const [firstFrame, ...restOfFrames] = animationFrames;
    const acendeMsg = await ctx.reply(firstFrame.join("\n"));
    restOfFrames.map((frame, index) => {
      setTimeout(async () => {
        await acendeMsg.editText(frame.join("\n"));
      }, (index + 1) * animationSpeed);
    });
  };
}

bot.command("acende", createAnimatedMessage(fireworksAnimation));
bot.on("message:text", (ctx) => {
  if (ctx.message.text.toLowerCase() === "/acende@papocobot") {
    createAnimatedMessage(fireworksAnimation)(ctx);
  }
});

bot.start({
  onStart: (bot) => {
    console.log(`Started...`);
    console.log({ bot });
  },
});

console.log("Starting...");
