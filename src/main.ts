import {hydrate} from "@grammyjs/hydrate";
import {Bot} from "grammy";
import {acende} from "./acende";
import {OocContext, setup} from "./config";
import {BOT_TOKEN} from "./config/environment";
import {ooc} from "./ooc";

setup();


const bot = new Bot<OocContext>(BOT_TOKEN);

bot.use(hydrate());
bot.use(ooc);
bot.use(acende);

console.log("Starting...");
bot.start({
  onStart: (bot) => {
    console.log(`Started...`);
    console.log({ bot });
  },
});
