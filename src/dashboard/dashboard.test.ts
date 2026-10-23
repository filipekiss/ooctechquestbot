import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { test } from "node:test";
import { openDb } from "../libs/db";
import { createQuoteStore } from "../quote/store";
import { startDashboard } from ".";

test("dashboard renders pages, searches and stays read-only", async () => {
  const db = openDb(":memory:");
  const store = createQuoteStore(db);
  store.add({
    key: "oi", channel_message_id: 1, source_message_id: 2, text: "<b>hello</b>", message_date: 1700000000,
    author_id: 3, author_name: "@bob", added_by_id: 4, added_by_name: "@carol", image_file_id: null,
  });
  const server = startDashboard({ db, port: 0, info: { username: "testbot", startedAt: Date.now() / 1000, commands: [{ command: "quote", description: "d" }] } });
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const get = async (path: string, init?: RequestInit) => {
    const res = await fetch(base + path, init);
    return { status: res.status, body: await res.text() };
  };
  try {
    assert.match((await get("/")).body, /@testbot/);
    const list = await get("/quotes?q=bob");
    assert.match(list.body, /href="\/quotes\/oi"/);
    assert.ok(!list.body.includes("<b>hello</b>"));
    assert.match(list.body, /&#60;b&#62;hello/);
    assert.match((await get("/quotes?q=nomatch")).body, /nada encontrado/);
    assert.match((await get("/quotes/oi")).body, /@carol/);
    assert.equal((await get("/quotes/nope")).status, 404);
    assert.equal((await get("/oocs")).status, 200);
    assert.equal((await get("/users")).status, 200);
    assert.match((await get("/static/dash80/tokens.css")).body, /--c/);
    assert.equal((await get("/static/../package.json")).status, 404);
    assert.equal((await get("/", { method: "POST" })).status, 405);
  } finally {
    server.close();
  }
});
