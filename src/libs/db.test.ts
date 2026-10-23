import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import { migrate } from "./db";

test("migration drops chat_id and keeps existing rows", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE quotes (
      id INTEGER PRIMARY KEY, chat_id TEXT NOT NULL, key TEXT NOT NULL,
      channel_message_id INTEGER NOT NULL, source_message_id INTEGER NOT NULL, text TEXT,
      message_date INTEGER NOT NULL, author_id INTEGER NOT NULL, author_name TEXT NOT NULL,
      added_by_id INTEGER NOT NULL, added_by_name TEXT NOT NULL, uses INTEGER NOT NULL DEFAULT 0,
      image_file_id TEXT, created_at INTEGER NOT NULL, refreshed_at INTEGER NOT NULL DEFAULT 0,
      UNIQUE (chat_id, key), UNIQUE (chat_id, source_message_id));
    CREATE TABLE oocs (
      id INTEGER PRIMARY KEY, chat_id TEXT NOT NULL, source_message_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL, author_name TEXT NOT NULL, forwarded_by_id INTEGER NOT NULL,
      forwarded_by_name TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE (chat_id, source_message_id));
    INSERT INTO quotes (chat_id, key, channel_message_id, source_message_id, message_date, author_id,
      author_name, added_by_id, added_by_name, uses, created_at, refreshed_at)
      VALUES ('-1', 'a', 5, 100, 1, 2, 'bob', 3, 'carol', 4, 10, 20), ('-2', 'b', 6, 101, 1, 2, 'bob', 3, 'carol', 0, 10, 20);
    INSERT INTO oocs (chat_id, source_message_id, author_id, author_name, forwarded_by_id, forwarded_by_name, created_at)
      VALUES ('-1', 7, 2, 'bob', 3, 'carol', 10);
  `);
  db.pragma("user_version = 2");
  migrate(db);
  const cols = (db.pragma("table_info(quotes)") as { name: string }[]).map((c) => c.name);
  assert.ok(!cols.includes("chat_id"));
  assert.deepEqual(db.prepare("SELECT key, uses, refreshed_at FROM quotes ORDER BY key").all(), [
    { key: "a", uses: 4, refreshed_at: 20 },
    { key: "b", uses: 0, refreshed_at: 20 },
  ]);
  assert.equal((db.prepare("SELECT COUNT(*) c FROM oocs").get() as { c: number }).c, 1);
  assert.equal(db.pragma("user_version", { simple: true }), 4);
});
