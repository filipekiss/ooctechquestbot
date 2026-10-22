import { Composer } from "grammy";
import { Animation, createAnimatedMessage } from "../animations/helpers";
import { OocContext } from "../config";
import { BotModule } from "../main";
import { withNext } from "../utils/middleware";

const fireworksAnimation: Animation = [[["🧨"]], [["🎆"]]];

export const acende = new Composer<OocContext>();
// grammy's command() already matches /acende@<botname>
acende.command("acende", withNext(createAnimatedMessage(fireworksAnimation)));

export const acendeModule: BotModule = {
  command: "acende",
  composer: acende,
  shortDescription: "Acende o rojão",
};
