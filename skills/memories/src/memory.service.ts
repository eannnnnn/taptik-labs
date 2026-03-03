import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { lessons } from "./schema.js";

const GLOBAL_PROJECT = "__global__";
const VECTOR_DIMENSION = 384;
let sqliteConfigured = false;

type OptionValue = string | boolean | undefined;
type OptionMap = Record<string, OptionValue>;

interface LessonRow {
  id: number;
  title: string;
  summary: string;
  keywords: string;
  project_path: string;
  file_path: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface LessonIndex {
  id: number;
  title: string;
  summary: string;
  keywords: string[];
  scope: "global" | "project";
  project_path: string;
  file_path: string;
  updated_at: string;
}

interface LessonDetail extends LessonIndex {
  content: string;
  created_at: string;
}

function fail(message: string): never {
  throw new Error(message);
}

function expandHome(p: string): string {
  if (!p) return p;
  const homeDir = process.env.HOME || os.homedir();
  if (p === "~") return homeDir || p;
  if (p.startsWith("~/")) {
    if (!homeDir) return p;
    return path.join(homeDir, p.slice(2));
  }
  return p;
}

function resolvePath(p: string): string {
  return path.resolve(expandHome(String(p)));
}

function ensureParent(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function nowIso(): string {
  return new Date().toISOString();
}

function configureSqlite(): void {
  if (sqliteConfigured) return;
  const customSqlitePath =
    process.env.TAPTIK_SQLITE_DYLIB ||
    [
      "/opt/homebrew/opt/sqlite3/lib/libsqlite3.dylib",
      "/usr/local/opt/sqlite3/lib/libsqlite3.dylib",
    ].find((p) => fs.existsSync(p));
  if (customSqlitePath) {
    Database.setCustomSQLite(customSqlitePath);
  }
  sqliteConfigured = true;
}

function openDb(dbPath: string): Database {
  configureSqlite();
  const db = new Database(dbPath);
  db.run("PRAGMA journal_mode = WAL;");
  try {
    sqliteVec.load(db);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(
      `failed to load sqlite-vec extension: ${message}. On macOS set TAPTIK_SQLITE_DYLIB to a SQLite dylib that allows extensions (ex: Homebrew sqlite).`,
    );
  }
  return db;
}

function openOrm(db: Database) {
  return drizzle({ client: db, schema: { lessons } });
}

function tableExists(db: Database, tableName: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(tableName) as { name: string } | undefined;
  return Boolean(row);
}

function tableColumns(db: Database, tableName: string): string[] {
  return (db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>).map((c) => c.name);
}

function initSchema(db: Database): void {
  db.run("PRAGMA foreign_keys = OFF;");

  if (!tableExists(db, "lessons")) {
    db.run(`
      CREATE TABLE lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL COLLATE NOCASE,
        summary TEXT NOT NULL DEFAULT '',
        keywords TEXT NOT NULL DEFAULT '',
        project_path TEXT NOT NULL DEFAULT '${GLOBAL_PROJECT}',
        file_path TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(title, project_path)
      );

      CREATE INDEX idx_lessons_project_updated ON lessons(project_path, updated_at DESC);
      CREATE INDEX idx_lessons_updated_at ON lessons(updated_at DESC);

      CREATE VIRTUAL TABLE IF NOT EXISTS lesson_vectors USING vec0(
        embedding float[${VECTOR_DIMENSION}]
      );
    `);
    return;
  }

  const cols = new Set(tableColumns(db, "lessons"));
  const hasAll =
    cols.has("id") &&
    cols.has("title") &&
    cols.has("summary") &&
    cols.has("keywords") &&
    cols.has("project_path") &&
    cols.has("file_path") &&
    cols.has("content") &&
    cols.has("created_at") &&
    cols.has("updated_at");

  if (hasAll) {
    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_lessons_title_project ON lessons(title, project_path);
      CREATE INDEX IF NOT EXISTS idx_lessons_project_updated ON lessons(project_path, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_lessons_updated_at ON lessons(updated_at DESC);
      CREATE VIRTUAL TABLE IF NOT EXISTS lesson_vectors USING vec0(
        embedding float[${VECTOR_DIMENSION}]
      );
    `);
    return;
  }

  const titleExpr = cols.has("title") ? "title" : "''";
  const summaryExpr = cols.has("summary") ? "summary" : "''";
  const keywordsExpr = cols.has("keywords") ? "keywords" : cols.has("tags") ? "tags" : "''";
  const projectExpr = cols.has("project_path") ? "project_path" : `'${GLOBAL_PROJECT}'`;
  const filePathExpr = cols.has("file_path") ? "file_path" : "''";
  const contentExpr = cols.has("content") ? "content" : "''";
  const createdExpr = cols.has("created_at") ? "created_at" : `'${nowIso()}'`;
  const updatedExpr = cols.has("updated_at") ? "updated_at" : `'${nowIso()}'`;

  db.run(`
    CREATE TABLE lessons_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL COLLATE NOCASE,
      summary TEXT NOT NULL DEFAULT '',
      keywords TEXT NOT NULL DEFAULT '',
      project_path TEXT NOT NULL DEFAULT '${GLOBAL_PROJECT}',
      file_path TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(title, project_path)
    );

    INSERT INTO lessons_new (id, title, summary, keywords, project_path, file_path, content, created_at, updated_at)
    SELECT id, ${titleExpr}, ${summaryExpr}, ${keywordsExpr}, ${projectExpr}, ${filePathExpr}, ${contentExpr}, ${createdExpr}, ${updatedExpr}
    FROM lessons;

    DROP TABLE lessons;
    ALTER TABLE lessons_new RENAME TO lessons;

    CREATE UNIQUE INDEX IF NOT EXISTS uq_lessons_title_project ON lessons(title, project_path);
    CREATE INDEX IF NOT EXISTS idx_lessons_project_updated ON lessons(project_path, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_lessons_updated_at ON lessons(updated_at DESC);
    CREATE VIRTUAL TABLE IF NOT EXISTS lesson_vectors USING vec0(
      embedding float[${VECTOR_DIMENSION}]
    );
  `);
}

function normalizeProjectRoot(projectRoot: string): string {
  return resolvePath(projectRoot || process.cwd());
}

function resolveScope(options: OptionMap, defaultScope = "project"): "project" | "global" {
  const raw = options.scope && options.scope !== true ? String(options.scope).trim().toLowerCase() : defaultScope;
  if (raw !== "project" && raw !== "global") {
    fail(`invalid scope: ${raw} (expected: project|global)`);
  }
  return raw;
}

function resolveProjectPath(options: OptionMap, scope: "project" | "global"): string {
  if (scope === "global") return GLOBAL_PROJECT;
  if (options["project-root"] && options["project-root"] !== true) {
    return normalizeProjectRoot(String(options["project-root"]));
  }
  return normalizeProjectRoot(process.cwd());
}

function resolveLessonsDir(projectPath: string): string {
  if (projectPath === GLOBAL_PROJECT) {
    return resolvePath("~/.taptik/lesson");
  }
  return path.join(projectPath, ".taptik", "lesson");
}

function tagsToCsv(raw: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of String(raw || "").split(",")) {
    const token = part.trim();
    if (!token) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }
  return out.join(",");
}

function csvToTags(raw: string): string[] {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeBaseTitle(title: string): string {
  const base = String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "lesson";
}

function lessonFilename(title: string, projectPath: string): string {
  const base = sanitizeBaseTitle(title);
  const hash = createHash("sha1")
    .update(`${projectPath}::${String(title || "")}`)
    .digest("hex")
    .slice(0, 10);
  return `${base}-${hash}.md`;
}

function formatLessonMarkdown(title: string, summary: string, content: string): string {
  const raw = String(content || "").trim();
  if (raw) {
    return raw.endsWith("\n") ? raw : `${raw}\n`;
  }
  const s = String(summary || "").trim();
  const md = [`# ${title}`, "", s].filter(Boolean).join("\n");
  return `${md}\n`;
}

function fileAbsFromRow(dbPath: string, row: LessonRow): string | null {
  if (!row.file_path) return null;
  if (path.isAbsolute(row.file_path)) return row.file_path;
  return path.resolve(path.dirname(dbPath), row.file_path);
}

function readRowContent(dbPath: string, row: Pick<LessonRow, "file_path" | "content">): string {
  const fileAbs = fileAbsFromRow(dbPath, row as LessonRow);
  if (fileAbs && fs.existsSync(fileAbs)) {
    return fs.readFileSync(fileAbs, "utf8");
  }
  return String(row.content || "");
}

function rowScope(row: LessonRow): "global" | "project" {
  return row.project_path === GLOBAL_PROJECT ? "global" : "project";
}

function rowToIndex(row: LessonRow): LessonIndex {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    keywords: csvToTags(row.keywords),
    scope: rowScope(row),
    project_path: row.project_path,
    file_path: row.file_path,
    updated_at: row.updated_at,
  };
}

function rowToDetail(dbPath: string, row: LessonRow): LessonDetail {
  const payload: LessonDetail = {
    ...rowToIndex(row),
    content: readRowContent(dbPath, row),
    created_at: row.created_at,
  };
  return payload;
}

function requireOption(options: OptionMap, key: string): string {
  const value = options[key];
  if (value === undefined || value === true || String(value).trim() === "") {
    fail(`missing required option: --${key}`);
  }
  return String(value);
}

function optionalOption(options: OptionMap, key: string, defaultValue = ""): string {
  const value = options[key];
  if (value === undefined || value === true) return defaultValue;
  return String(value);
}

function intOption(options: OptionMap, key: string, defaultValue: number): number {
  const value = options[key];
  if (value === undefined || value === true) return defaultValue;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    fail(`invalid integer for --${key}: ${value}`);
  }
  return parsed;
}

function defaultDbPath(options: OptionMap): string {
  if (options.db && options.db !== true) return resolvePath(String(options.db));
  return resolvePath("~/.taptik/memory.sqlite");
}

function findByTitle(orm: ReturnType<typeof openOrm>, title: string, projectPath: string): LessonRow | null {
  const row = orm
    .select()
    .from(lessons)
    .where(and(sql`lower(${lessons.title}) = lower(${title})`, eq(lessons.project_path, projectPath)))
    .get();
  return (row as LessonRow | undefined) || null;
}

function upsertLesson(
  orm: ReturnType<typeof openOrm>,
  payload: {
    title: string;
    summary: string;
    keywords: string;
    project_path: string;
    file_path: string;
    content: string;
  },
): LessonRow {
  const now = nowIso();
  orm
    .insert(lessons)
    .values({
      title: payload.title,
      summary: payload.summary,
      keywords: payload.keywords,
      project_path: payload.project_path,
      file_path: payload.file_path,
      content: payload.content,
      created_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: [lessons.title, lessons.project_path],
      set: {
        summary: payload.summary,
        keywords: payload.keywords,
        file_path: payload.file_path,
        content: payload.content,
        updated_at: now,
      },
    })
    .run();

  const row = findByTitle(orm, payload.title, payload.project_path);
  if (!row) {
    fail("failed to load lesson after upsert");
  }
  return row;
}

function writeLessonFile(
  dbPath: string,
  lessonsDir: string,
  title: string,
  projectPath: string,
  summary: string,
  content: string,
  existingFilePath: string,
): string {
  const targetAbs = (() => {
    if (existingFilePath) {
      const abs = path.isAbsolute(existingFilePath) ? existingFilePath : path.resolve(path.dirname(dbPath), existingFilePath);
      return abs;
    }
    fs.mkdirSync(lessonsDir, { recursive: true });
    return path.join(lessonsDir, lessonFilename(title, projectPath));
  })();

  ensureParent(targetAbs);
  fs.writeFileSync(targetAbs, formatLessonMarkdown(title, summary, content), "utf8");
  return targetAbs;
}

function buildKeywordCondition(keyword: string): SQL | undefined {
  const q = String(keyword || "").trim().toLowerCase();
  if (!q) return undefined;
  const like = `%${q}%`;
  return sql`(lower(${lessons.title}) LIKE ${like} OR lower(${lessons.summary}) LIKE ${like} OR lower(${lessons.keywords}) LIKE ${like})`;
}

function parseEmbeddingInput(raw: string): number[] {
  const text = String(raw || "").trim();
  if (!text) {
    fail("missing embedding input");
  }

  const values = (() => {
    if (text.startsWith("[")) {
      try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          fail("embedding JSON must be an array");
        }
        return parsed.map((part) => Number(part)).filter((value) => Number.isFinite(value));
      } catch {
        fail("invalid embedding JSON");
      }
    }

    return text
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value));
  })();

  if (values.length !== VECTOR_DIMENSION) {
    fail(`invalid embedding dimension: expected ${VECTOR_DIMENSION}, got ${values.length}`);
  }
  return values;
}

function embeddingToJson(values: number[]): string {
  return `[${values.join(",")}]`;
}

function upsertVector(db: Database, lessonId: number, embedding: number[]): void {
  db.prepare(
    `
      INSERT OR REPLACE INTO lesson_vectors(rowid, embedding)
      VALUES (?, ?)
    `,
  ).run(lessonId, embeddingToJson(embedding));
}

function vectorSearchRows(
  db: Database,
  embedding: number[],
  limit: number,
  projectPath: string | null,
  projectOnly: boolean,
): LessonRow[] {
  const vector = embeddingToJson(embedding);

  if (projectPath) {
    if (projectOnly) {
      return db
        .prepare(
          `
            SELECT l.id, l.title, l.summary, l.keywords, l.project_path, l.file_path, l.content, l.created_at, l.updated_at
            FROM lesson_vectors v
            JOIN lessons l ON l.id = v.rowid
            WHERE l.project_path = ?
              AND v.embedding MATCH ?
              AND k = ${limit}
            ORDER BY v.distance ASC
            LIMIT ${limit}
          `,
        )
        .all(projectPath, vector) as LessonRow[];
    }

    return db
      .prepare(
        `
          SELECT l.id, l.title, l.summary, l.keywords, l.project_path, l.file_path, l.content, l.created_at, l.updated_at
          FROM lesson_vectors v
          JOIN lessons l ON l.id = v.rowid
          WHERE (l.project_path = ? OR l.project_path = ?)
            AND v.embedding MATCH ?
            AND k = ${limit}
          ORDER BY CASE WHEN l.project_path = ? THEN 0 ELSE 1 END, v.distance ASC
          LIMIT ${limit}
        `,
      )
      .all(projectPath, GLOBAL_PROJECT, vector, projectPath) as LessonRow[];
  }

  return db
    .prepare(
      `
        SELECT l.id, l.title, l.summary, l.keywords, l.project_path, l.file_path, l.content, l.created_at, l.updated_at
        FROM lesson_vectors v
        JOIN lessons l ON l.id = v.rowid
        WHERE v.embedding MATCH ?
          AND k = ${limit}
        ORDER BY v.distance ASC
        LIMIT ${limit}
      `,
    )
    .all(vector) as LessonRow[];
}

@Injectable()
export class MemoryService {
  cmdInit(options: OptionMap): { ok: true; db: string; mode: string } {
    const dbPath = defaultDbPath(options);
    ensureParent(dbPath);
    const db = openDb(dbPath);
    try {
      initSchema(db);
    } finally {
      db.close();
    }
    return { ok: true, db: dbPath, mode: "global-db" };
  }

  cmdUpsert(options: OptionMap): { ok: true; db: string; lesson: LessonDetail } {
    const dbPath = defaultDbPath(options);
    const scope = resolveScope(options, "project");
    const projectPath = resolveProjectPath(options, scope);
    const lessonsDir = resolveLessonsDir(projectPath);

    const title = requireOption(options, "title").trim();
    const hasSummary = options.summary !== undefined && options.summary !== true;
    const hasContent = options.content !== undefined && options.content !== true;
    const hasKeywords = options.keywords !== undefined && options.keywords !== true;
    const hasEmbedding = options.embedding !== undefined && options.embedding !== true;

    ensureParent(dbPath);
    fs.mkdirSync(lessonsDir, { recursive: true });

    const db = openDb(dbPath);
    try {
      initSchema(db);
      const orm = openOrm(db);

      const existing = findByTitle(orm, title, projectPath);
      const summary = hasSummary ? String(options.summary) : String(existing?.summary || "");
      const content = hasContent ? String(options.content) : readRowContent(dbPath, existing || { file_path: "", content: "" });
      const keywords = hasKeywords ? tagsToCsv(String(options.keywords)) : String(existing?.keywords || "");

      const filePath = writeLessonFile(dbPath, lessonsDir, title, projectPath, summary, content, existing?.file_path || "");

      const row = upsertLesson(orm, {
        title,
        summary,
        keywords,
        project_path: projectPath,
        file_path: filePath,
        content: "",
      });

      if (hasEmbedding) {
        upsertVector(db, row.id, parseEmbeddingInput(String(options.embedding)));
      }

      return { ok: true, db: dbPath, lesson: rowToDetail(dbPath, row) };
    } finally {
      db.close();
    }
  }

  cmdSearch(options: OptionMap): { ok: true; db: string; items: LessonIndex[] } {
    const dbPath = defaultDbPath(options);
    const limit = intOption(options, "limit", 50);
    const keyword = optionalOption(options, "keyword", "");
    const hasEmbedding = options.embedding !== undefined && options.embedding !== true;
    const projectOnly = Boolean(options["project-only"]);
    const hasProjectRoot = options["project-root"] && options["project-root"] !== true;
    const projectPath = hasProjectRoot
      ? normalizeProjectRoot(String(options["project-root"]))
      : projectOnly
        ? normalizeProjectRoot(process.cwd())
        : null;

    if (!fs.existsSync(dbPath)) {
      return { ok: true, db: dbPath, items: [] };
    }

    const db = openDb(dbPath);
    try {
      initSchema(db);
      const orm = openOrm(db);
      let rows: LessonRow[] = [];

      if (hasEmbedding) {
        rows = vectorSearchRows(db, parseEmbeddingInput(String(options.embedding)), limit, projectPath, projectOnly);
      } else {
        const kw = buildKeywordCondition(keyword);

        if (projectPath) {
          const scopeCond = projectOnly
            ? eq(lessons.project_path, projectPath)
            : or(eq(lessons.project_path, projectPath), eq(lessons.project_path, GLOBAL_PROJECT));
          const whereCond = kw ? and(scopeCond, kw) : scopeCond;

          if (projectOnly) {
            rows = orm
              .select()
              .from(lessons)
              .where(whereCond)
              .orderBy(desc(lessons.updated_at))
              .limit(limit)
              .all() as LessonRow[];
          } else {
            rows = orm
              .select()
              .from(lessons)
              .where(whereCond)
              .orderBy(sql`CASE WHEN ${lessons.project_path} = ${projectPath} THEN 0 ELSE 1 END`, desc(lessons.updated_at))
              .limit(limit)
              .all() as LessonRow[];
          }
        } else {
          rows = (kw
            ? orm.select().from(lessons).where(kw).orderBy(desc(lessons.updated_at)).limit(limit).all()
            : orm.select().from(lessons).orderBy(desc(lessons.updated_at)).limit(limit).all()) as LessonRow[];
        }
      }

      return { ok: true, db: dbPath, items: rows.map((row) => rowToIndex(row)) };
    } finally {
      db.close();
    }
  }

  cmdGet(options: OptionMap): { ok: true; db: string; lesson: LessonDetail } | { ok: false; db: string; error: string } {
    const dbPath = defaultDbPath(options);
    if (!fs.existsSync(dbPath)) {
      return { ok: false, db: dbPath, error: "db_not_found" };
    }

    const hasId = options.id !== undefined && options.id !== true;
    const hasTitle = options.title !== undefined && options.title !== true;
    if ((hasId && hasTitle) || (!hasId && !hasTitle)) {
      fail("use exactly one of --id or --title");
    }

    const projectOnly = Boolean(options["project-only"]);
    const hasProjectRoot = options["project-root"] && options["project-root"] !== true;
    const projectPath = hasProjectRoot
      ? normalizeProjectRoot(String(options["project-root"]))
      : projectOnly
        ? normalizeProjectRoot(process.cwd())
        : null;

    const db = openDb(dbPath);
    try {
      initSchema(db);
      const orm = openOrm(db);

      let row: LessonRow | null = null;
      if (hasId) {
        const id = intOption(options, "id", -1);
        row = (orm.select().from(lessons).where(eq(lessons.id, id)).get() as LessonRow | undefined) || null;
        if (row && projectPath && row.project_path !== projectPath) {
          row = null;
        }
      } else {
        const title = requireOption(options, "title");
        if (projectPath) {
          row =
            (orm
              .select()
              .from(lessons)
              .where(and(sql`lower(${lessons.title}) = lower(${title})`, eq(lessons.project_path, projectPath)))
              .orderBy(desc(lessons.updated_at))
              .limit(1)
              .get() as LessonRow | undefined) || null;

          if (!row && !projectOnly) {
            row =
              (orm
                .select()
                .from(lessons)
                .where(and(sql`lower(${lessons.title}) = lower(${title})`, eq(lessons.project_path, GLOBAL_PROJECT)))
                .orderBy(desc(lessons.updated_at))
                .limit(1)
                .get() as LessonRow | undefined) || null;
          }
        } else {
          row =
            (orm
              .select()
              .from(lessons)
              .where(sql`lower(${lessons.title}) = lower(${title})`)
              .orderBy(desc(lessons.updated_at))
              .limit(1)
              .get() as LessonRow | undefined) || null;
        }
      }

      if (!row) {
        return { ok: false, db: dbPath, error: "lesson_not_found" };
      }

      return { ok: true, db: dbPath, lesson: rowToDetail(dbPath, row) };
    } finally {
      db.close();
    }
  }

}

export type { OptionMap };
