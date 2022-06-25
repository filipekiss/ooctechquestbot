import { Composer } from "grammy";
import { Animation, createAnimatedMessage } from "../animations/helpers";
import { OocContext } from "../config";
import { withNext } from "../utils/middleware";

const fireworksAnimation: Animation = [[["🧨"]], [["🎆"]]];

export const acende = new Composer<OocContext>();
acende.command("acende", withNext(createAnimatedMessage(fireworksAnimation)));
const pattern = /\/acende\@papocobot/gim;
acende.hears(pattern, withNext(createAnimatedMessage(fireworksAnimation)));
