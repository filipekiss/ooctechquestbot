import {hydrate} from "@grammyjs/hydrate";
import {Bot} from "grammy";
import {acende} from "./acende";
import {badumts} from "./badumts";
import {OocContext, setup} from "./config";
import {BOT_TOKEN} from "./config/environment";
import {ooc} from "./ooc";
import {report} from "./report";
import {nft} from "./nft";
import { revolta } from "./revolta";

setup();


const bot = new Bot<OocContext>(BOT_TOKEN);

bot.use(hydrate());
bot.use(badumts);
bot.use(revolta);
bot.use(ooc);
bot.use(report);
// these must come last
bot.use(nft);
bot.use(acende);

console.log("Starting...");
bot.start({
  onStart: (bot) => {
    console.log(`Started...`);
    console.log({ bot });
  },
});
