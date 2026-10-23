import type Database from "better-sqlite3";
import { readFileSync, statSync } from "fs";
import { createServer } from "http";
import { join } from "path";
import { APP_FOLDER, SQLITE_DB_PATH } from "../config/environment";

export type BotInfo = {
  username?: string;
  id?: number;
  startedAt: number;
  commands: { command: string; description: string }[];
};

const PAGE_SIZE = 25;
const STATIC = join(APP_FOLDER, "static");

type TableDef = { cols: string[]; search: string[]; order: string; dates: string[] };
const TABLES: Record<string, TableDef> = {
  quotes: {
    cols: ["key", "author_name", "added_by_name", "uses", "message_date", "text"],
    search: ["key", "author_name", "added_by_name", "text"],
    order: "key",
    dates: ["message_date"],
  },
  oocs: {
    cols: ["id", "author_name", "forwarded_by_name", "created_at"],
    search: ["author_name", "forwarded_by_name"],
    order: "created_at DESC",
    dates: ["created_at"],
  },
  users: {
    cols: ["telegram_id", "username", "first_name", "last_name", "updated_at"],
    search: ["username", "first_name", "last_name"],
    order: "updated_at DESC",
    dates: ["updated_at"],
  },
};

const esc = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmtDate = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 16).replace("T", " ");
const fmtUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

const page = (title: string, active: string, body: string) => `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/static/dash80/tokens.css">
<link rel="stylesheet" href="/static/dash80/base.css">
<link rel="stylesheet" href="/static/dash80/components.css">
<link rel="stylesheet" href="/static/dash80/effects.css">
<link rel="stylesheet" href="/static/app.css">
</head>
<body class="crt">
<main>
<nav class="bar">
${["overview", ...Object.keys(TABLES)]
  .map((n) => `<a class="btn${n === active ? " on" : ""}" href="${n === "overview" ? "/" : `/${n}`}">${n}</a>`)
  .join("\n")}
</nav>
${body}
</main>
</body>
</html>`;

export function startDashboard(opts: { db: Database.Database; port: number; info: BotInfo }) {
  const { db, info } = opts;
  const one = <T>(sql: string, ...params: unknown[]) => db.prepare(sql).get(...params) as T;
  const all = <T>(sql: string, ...params: unknown[]) => db.prepare(sql).all(...params) as T[];

  const overview = () => {
    const totals = one<{ quotes: number; uses: number }>(
      "SELECT COUNT(*) AS quotes, COALESCE(SUM(uses), 0) AS uses FROM quotes",
    );
    const oocs = one<{ c: number }>("SELECT COUNT(*) AS c FROM oocs").c;
    const users = one<{ c: number }>("SELECT COUNT(*) AS c FROM users").c;
    const top = (nameCol: string, idCol: string) =>
      all<{ name: string; total: number }>(
        `SELECT ${nameCol} AS name, COUNT(*) AS total FROM quotes GROUP BY ${idCol} ORDER BY total DESC LIMIT 5`,
      );
    const used = all<{ key: string; uses: number }>(
      "SELECT key, uses FROM quotes WHERE uses > 0 ORDER BY uses DESC LIMIT 5",
    );
    const list = (rows: { name?: string; key?: string; total?: number; uses?: number }[]) =>
      rows.length
        ? `<ul class="list">${rows
            .map((r) => `<li>${esc(r.name ?? `/${r.key}`)} <span class="readout">${r.total ?? r.uses}</span></li>`)
            .join("")}</ul>`
        : `<p class="muted">sem dados</p>`;
    const gauge = (label: string, value: unknown) =>
      `<span class="gauge"><span class="label">${esc(label)}</span><span class="readout">${esc(value)}</span></span>`;
    let dbSize = "?";
    try {
      dbSize = `${(statSync(SQLITE_DB_PATH).size / 1024).toFixed(0)} KB`;
    } catch {}
    const uptime = fmtUptime(Date.now() / 1000 - info.startedAt);
    return page(
      "ooc dashboard",
      "overview",
      `<div class="panel"><h2>Bot <span class="led g on">online</span></h2>
<div class="row">${gauge("Username", info.username ? `@${info.username}` : "?")}${gauge("Uptime", uptime)}${gauge("Node", process.version)}${gauge("DB", dbSize)}${gauge("Schema", db.pragma("user_version", { simple: true }))}</div></div>
<div class="panel"><h2>Dados</h2>
<div class="row">${gauge("Quotes", totals.quotes)}${gauge("Usos", totals.uses)}${gauge("Oocs", oocs)}${gauge("Users", users)}</div></div>
<div class="grid">
<div class="panel"><h2>Mais citados</h2>${list(top("author_name", "author_id"))}</div>
<div class="panel"><h2>Mais adicionaram</h2>${list(top("added_by_name", "added_by_id"))}</div>
<div class="panel"><h2>Mais usadas</h2>${list(used)}</div>
</div>
<div class="panel"><h2>Comandos</h2><table class="table"><tbody>${info.commands
        .map((c) => `<tr><td>/${esc(c.command)}</td><td>${esc(c.description)}</td></tr>`)
        .join("")}</tbody></table></div>`,
    );
  };

  const browse = (name: string, params: URLSearchParams) => {
    const def = TABLES[name];
    const q = (params.get("q") ?? "").trim();
    const current = Math.max(1, Number(params.get("page")) || 1);
    const where = q ? `WHERE ${def.search.map((c) => `${c} LIKE @q`).join(" OR ")}` : "";
    const bind = q ? { q: `%${q}%` } : {};
    const total = (db.prepare(`SELECT COUNT(*) AS c FROM ${name} ${where}`).get(bind) as { c: number }).c;
    const rows = db
      .prepare(`SELECT ${def.cols.join(", ")} FROM ${name} ${where} ORDER BY ${def.order} LIMIT ${PAGE_SIZE} OFFSET ${(current - 1) * PAGE_SIZE}`)
      .all(bind) as Record<string, unknown>[];
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const href = (p: number) => `/${name}?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`;
    const cell = (col: string, v: unknown) => {
      if (v === null || v === undefined) return `<span class="muted">-</span>`;
      if (def.dates.includes(col)) return `<span class="nw">${esc(fmtDate(v as number))}</span>`;
      const text = String(v);
      const shown = text.length > 120 ? `${text.slice(0, 120)}…` : text;
      return name === "quotes" && col === "key"
        ? `<a href="/quotes/${encodeURIComponent(text)}">${esc(shown)}</a>`
        : esc(shown);
    };
    return page(
      name,
      name,
      `<div class="panel"><h2>${esc(name)} <span class="badge">${total}</span></h2>
<form class="bar" method="get" action="/${name}">
<input class="field" name="q" value="${esc(q)}" placeholder="buscar" aria-label="buscar">
<button class="btn primary">Buscar</button>${q ? `<a class="btn ghost" href="/${name}">Limpar</a>` : ""}
</form>
<div class="scroll"><table class="table"><thead><tr>${def.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${def.cols.map((c) => `<td>${cell(c, r[c])}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${def.cols.length}" class="muted">nada encontrado</td></tr>`}</tbody></table></div>
<div class="bar">${current > 1 ? `<a class="btn" href="${href(current - 1)}">Anterior</a>` : ""}<span class="muted">página ${current} de ${pages}</span>${current < pages ? `<a class="btn" href="${href(current + 1)}">Próxima</a>` : ""}</div></div>`,
    );
  };

  const quote = (key: string) => {
    const row = one<Record<string, unknown> | undefined>("SELECT * FROM quotes WHERE key = ?", key);
    if (!row) return undefined;
    const dates = ["message_date", "created_at", "refreshed_at"];
    return page(
      `quote ${key}`,
      "quotes",
      `<div class="panel"><h2>/${esc(key)}</h2>
<table class="table"><tbody>${Object.entries(row)
        .map(([k, v]) => `<tr><td class="label">${esc(k)}</td><td>${k === "text" ? `<pre>${esc(v)}</pre>` : esc(dates.includes(k) ? fmtDate(v as number) : v)}</td></tr>`)
        .join("")}</tbody></table>
<div class="bar"><a class="btn" href="/quotes">Voltar</a></div></div>`,
    );
  };

  const send = (res: import("http").ServerResponse, status: number, type: string, body: string | Buffer) => {
    res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
    res.end(body);
  };

  const server = createServer((req, res) => {
    try {
      if (req.method !== "GET") return send(res, 405, "text/plain", "read-only");
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = decodeURIComponent(url.pathname);
      if (path.startsWith("/static/") && !path.includes("..")) {
        try {
          return send(res, 200, "text/css; charset=utf-8", readFileSync(join(STATIC, path.slice(8))));
        } catch {
          return send(res, 404, "text/plain", "not found");
        }
      }
      let html: string | undefined;
      if (path === "/") html = overview();
      else if (TABLES[path.slice(1)]) html = browse(path.slice(1), url.searchParams);
      else if (path.startsWith("/quotes/")) html = quote(path.slice(8));
      if (!html) return send(res, 404, "text/plain", "not found");
      send(res, 200, "text/html; charset=utf-8", html);
    } catch (error) {
      console.error("dashboard error", error);
      send(res, 500, "text/plain", "error");
    }
  });
  server.listen(opts.port, () => console.log(`Dashboard on :${opts.port}`));
  return server;
}
