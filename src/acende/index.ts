import { Composer } from "grammy";
import { Animation, createAnimatedMessage } from "../animations/helpers";
import { OocContext } from "../config";

const fireworksAnimation: Animation = [[["🧨"]], [["🎆"]]];

export const acende = new Composer<OocContext>();
acende.command("acende", createAnimatedMessage(fireworksAnimation));
const pattern = /\/acende\@papocobot/gim;
acende.hears(pattern, createAnimatedMessage(fireworksAnimation));
