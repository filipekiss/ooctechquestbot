import {Composer} from 'grammy'
import {Animation, createAnimatedMessage} from '../animations/helpers';
import {OocContext} from '../config';

const fireworksAnimation: Animation = [[["🧨"]], [["🎆"]]];

export const acende = new Composer<OocContext>();
acende.command("acende", createAnimatedMessage(fireworksAnimation));
acende.on("message:text", (ctx) => {
  if (ctx.message.text.toLowerCase() === "/acende@papocobot") {
    createAnimatedMessage(fireworksAnimation)(ctx);
  }
});

