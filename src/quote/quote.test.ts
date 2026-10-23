import assert from "node:assert/strict";
import { test } from "node:test";
import { Bot } from "grammy";
import { OocContext } from "../config";
import { openDb } from "../libs/db";
import { createQuoteModule } from ".";
import { createQuoteStore } from "./store";

const CHAT = { id: 10, type: "supergroup", title: "t" };
const ALICE = { id: 1, is_bot: false, first_name: "Alice" };
const BOB = { id: 2, is_bot: false, first_name: "Bob", last_name: "B" };

function setup(opts: { forwardFails?: boolean; admin?: boolean } = {}) {
  let clock = 1_700_000_000;
  const db = openDb(":memory:");
  const store = createQuoteStore(db);
  const { module, shortcut } = createQuoteModule({
    store,
    channelId: "-100",
    reservedWords: () => ["badumts"],
    now: () => clock,
  });
  const bot = new Bot<OocContext>("1:fake");
  bot.botInfo = { id: 1, is_bot: true, first_name: "b", username: "testbot" } as any;
  const calls: { method: string; payload: any }[] = [];
  let failForwards = opts.forwardFails ?? false;
  bot.api.config.use(async (_prev, method, rawPayload) => {
    const payload = rawPayload as any;
    calls.push({ method, payload });
    if (method === "forwardMessage") {
      if (failForwards && String(payload.chat_id) === String(CHAT.id)) {
        return { ok: false, error_code: 400, description: "message to forward not found" } as any;
      }
      return { ok: true, result: { message_id: payload.from_chat_id === "-100" && payload.chat_id === "-100" ? 501 : 500 } } as any;
    }
    if (method === "sendPhoto") {
      return { ok: true, result: { message_id: 600, photo: [{ file_id: "small" }, { file_id: "FILE" }] } } as any;
    }
    if (method === "getChatMember") {
      return { ok: true, result: { status: opts.admin ? "administrator" : "member", user: ALICE } } as any;
    }
    return { ok: true, result: { message_id: 700 } } as any;
  });
  bot.use(module.composer);
  bot.use(shortcut);
  let id = 100;
  const say = (text: string, extra: object = {}, from = ALICE) =>
    bot.handleUpdate({
      update_id: ++id,
      message: {
        message_id: id,
        date: 1700000000,
        chat: CHAT,
        from,
        text,
        entities: text.startsWith("/")
          ? [{ type: "bot_command", offset: 0, length: text.split(" ")[0].length }]
          : undefined,
        ...extra,
      },
    } as any);
  const sent = () => calls.filter((c) => c.method === "sendMessage").map((c) => c.payload.text);
  const target = { message_id: 55, date: 1699999999, chat: CHAT, from: BOB, text: "hello world" };
  return { db, store, calls, say, sent, advance: (seconds: number) => (clock += seconds), target, setForwardFails: (v: boolean) => (failForwards = v) };
}

test("add stores quote, archives to channel and pre-renders image", async () => {
  const t = setup();
  await t.say("/quote add Oi", { reply_to_message: t.target });
  const row = t.store.get("10", "oi")!;
  assert.equal(row.channel_message_id, 500);
  assert.equal(row.author_name, "Bob B");
  assert.equal(row.image_file_id, "FILE");
  assert.ok(t.calls.some((c) => c.method === "forwardMessage" && c.payload.chat_id === "-100"));
});

test("add credits the original author of a forwarded message", async () => {
  const t = setup();
  const carol = { id: 3, is_bot: false, first_name: "Carol" };
  await t.say("/quote add a", { reply_to_message: { ...t.target, forward_from: carol, forward_date: 1600000000 } });
  assert.equal(t.store.get("10", "a")!.author_name, "Carol");
  assert.equal(t.store.get("10", "a")!.author_id, 3);
  const users = t.db.prepare("SELECT telegram_id, first_name FROM users ORDER BY telegram_id").all();
  assert.deepEqual(users.map((u: any) => u.telegram_id), [ALICE.id, 3]);
  await t.say("/quote add b", { reply_to_message: { ...t.target, message_id: 56, forward_sender_name: "Hidden Dan" } });
  assert.equal(t.store.get("10", "b")!.author_name, "Bob B");
});

test("rejects reserved, duplicate keys and already quoted messages", async () => {
  const t = setup();
  await t.say("/quote add badumts", { reply_to_message: t.target });
  await t.say("/quote add list", { reply_to_message: t.target });
  await t.say("/quote add Bad-Key", { reply_to_message: t.target });
  await t.say("/quote add oi", { reply_to_message: t.target });
  await t.say("/quote add oi", { reply_to_message: { ...t.target, message_id: 56 } });
  await t.say("/quote add outra", { reply_to_message: t.target });
  assert.deepEqual(t.store.keys("10"), ["oi"]);
  assert.equal(t.sent().filter((m) => m.includes("Já existe")).length, 1);
  assert.equal(t.sent().filter((m) => m.includes("já é uma quote")).length, 1);
});

test("/quote key and /key forward from the channel and count uses", async () => {
  const t = setup();
  await t.say("/quote add oi", { reply_to_message: t.target });
  await t.say("/quote oi");
  await t.say("/oi");
  await t.say("/oi@testbot");
  await t.say("/oi@otherbot");
  await t.say("/nope");
  assert.equal(t.store.get("10", "oi")!.uses, 3);
  const forwards = t.calls.filter((c) => c.method === "forwardMessage" && String(c.payload.chat_id) === "10");
  assert.equal(forwards.length, 3);
  assert.equal(forwards[0].payload.message_id, 500);
});

test("falls back to the cached bubble image when forwarding fails", async () => {
  const t = setup();
  await t.say("/quote add oi", { reply_to_message: t.target });
  t.setForwardFails(true);
  await t.say("/oi");
  const photo = t.calls.filter((c) => c.method === "sendPhoto" && String(c.payload.chat_id) === "10");
  assert.equal(photo.length, 1);
  assert.equal(photo[0].payload.photo, "FILE");
});

test("media quote without text reports expired instead of an image", async () => {
  const t = setup();
  const media = { message_id: 57, date: 1, chat: CHAT, from: BOB, photo: [{ file_id: "p" }] };
  await t.say("/quote add foto", { reply_to_message: media });
  assert.equal(t.store.get("10", "foto")!.text, null);
  t.setForwardFails(true);
  await t.say("/foto");
  assert.ok(t.sent().some((m) => m.includes("expirou")));
});

test("remove is admin only, list and stats work", async () => {
  const user = setup();
  await user.say("/quote add oi", { reply_to_message: user.target });
  await user.say("/quote remove oi");
  assert.ok(user.store.get("10", "oi"));
  await user.say("/quote list");
  await user.say("/quote stats");
  await user.say("/quote stats oi");
  assert.ok(user.sent().some((m) => m === "/oi"));
  assert.ok(user.sent().some((m) => m.includes("Quantidade de quotes: 1")));
  assert.ok(user.sent().some((m) => m.includes("adicionada por Alice")));

  const admin = setup({ admin: true });
  await admin.say("/quote add oi", { reply_to_message: admin.target });
  await admin.say("/quote remove oi");
  assert.equal(admin.store.get("10", "oi"), undefined);
});

test("reposts a copy older than 3 months to the channel on use, only once", async () => {
  const t = setup();
  const DAY = 24 * 60 * 60;
  await t.say("/quote add oi", { reply_to_message: t.target });
  t.store.setChannelMessage(t.store.get("10", "oi")!.id, 500, 1_700_000_000);
  const repost = () =>
    t.calls.filter((c) => c.method === "forwardMessage" && c.payload.chat_id === "-100" && c.payload.from_chat_id === "-100");

  t.advance(89 * DAY);
  await t.say("/oi");
  assert.equal(repost().length, 0);

  t.advance(2 * DAY);
  await t.say("/oi");
  assert.equal(repost().length, 1);
  assert.equal(repost()[0].payload.message_id, 500);
  const row = t.store.get("10", "oi")!;
  assert.equal(row.channel_message_id, 501);
  const toChat = t.calls.filter((c) => c.method === "forwardMessage" && String(c.payload.chat_id) === "10");
  assert.equal(toChat.at(-1)!.payload.message_id, 501);

  await t.say("/oi");
  assert.equal(repost().length, 1);
});
