import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { SQLITE_DB_PATH } from "../config/environment";

// Append only. PRAGMA user_version stores how many entries already ran.
const migrations: string[] = [
  `
  CREATE TABLE quotes (
    id INTEGER PRIMARY KEY,
    chat_id TEXT NOT NULL,
    key TEXT NOT NULL,
    channel_message_id INTEGER NOT NULL,
    source_message_id INTEGER NOT NULL,
    text TEXT,
    message_date INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    added_by_id INTEGER NOT NULL,
    added_by_name TEXT NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0,
    image_file_id TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE (chat_id, key),
    UNIQUE (chat_id, source_message_id)
  );

  CREATE TABLE oocs (
    id INTEGER PRIMARY KEY,
    chat_id TEXT NOT NULL,
    source_message_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    forwarded_by_id INTEGER NOT NULL,
    forwarded_by_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE (chat_id, source_message_id)
  );
  `,
  // when the copy in the quotes channel was last (re)posted, see quote refresh
  `
  ALTER TABLE quotes ADD COLUMN refreshed_at INTEGER NOT NULL DEFAULT 0;
  UPDATE quotes SET refreshed_at = created_at;
  `,
  // telegram profile of everyone who adds a quote or is quoted
  `
  CREATE TABLE users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    updated_at INTEGER NOT NULL
  );
  `,
  // the bot serves a single group, so quotes and oocs are global
  `
  CREATE TABLE quotes_new (
    id INTEGER PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    channel_message_id INTEGER NOT NULL,
    source_message_id INTEGER NOT NULL UNIQUE,
    text TEXT,
    message_date INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    added_by_id INTEGER NOT NULL,
    added_by_name TEXT NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0,
    image_file_id TEXT,
    created_at INTEGER NOT NULL,
    refreshed_at INTEGER NOT NULL DEFAULT 0
  );
  INSERT INTO quotes_new (id, key, channel_message_id, source_message_id, text, message_date,
    author_id, author_name, added_by_id, added_by_name, uses, image_file_id, created_at, refreshed_at)
  SELECT id, key, channel_message_id, source_message_id, text, message_date,
    author_id, author_name, added_by_id, added_by_name, uses, image_file_id, created_at, refreshed_at
  FROM quotes;
  DROP TABLE quotes;
  ALTER TABLE quotes_new RENAME TO quotes;

  CREATE TABLE oocs_new (
    id INTEGER PRIMARY KEY,
    source_message_id INTEGER NOT NULL UNIQUE,
    author_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    forwarded_by_id INTEGER NOT NULL,
    forwarded_by_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  INSERT INTO oocs_new (id, source_message_id, author_id, author_name, forwarded_by_id, forwarded_by_name, created_at)
  SELECT id, source_message_id, author_id, author_name, forwarded_by_id, forwarded_by_name, created_at
  FROM oocs;
  DROP TABLE oocs;
  ALTER TABLE oocs_new RENAME TO oocs;
  `,
];

export function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  migrations.slice(current).forEach((sql, index) => {
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${current + index + 1}`);
    })();
  });
}

export function openDb(filename: string) {
  if (filename !== ":memory:") {
    mkdirSync(dirname(filename), { recursive: true });
  }
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export const db = openDb(SQLITE_DB_PATH);
