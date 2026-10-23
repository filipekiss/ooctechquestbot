import assert from "node:assert/strict";
import { test } from "node:test";
import { openDb } from "../libs/db";
import { createOocStore } from "./store";

test("ooc store dedupes by message and counts stats", () => {
  const store = createOocStore(openDb(":memory:"));
  const base = { author_id: 2, author_name: "bob", forwarded_by_id: 3, forwarded_by_name: "carol" };
  store.add({ ...base, source_message_id: 10 });
  store.add({ ...base, source_message_id: 10 });
  store.add({ ...base, source_message_id: 11 });
  assert.equal(store.has(10), true);
  assert.equal(store.has(12), false);
  const stats = store.stats(2);
  assert.equal(stats.total, 2);
  assert.equal(stats.topAuthor?.name, "bob");
  assert.equal(stats.topForwarder?.name, "carol");
  assert.equal(stats.timesQuoted, 2);
  assert.equal(stats.timesCreated, 0);
});
