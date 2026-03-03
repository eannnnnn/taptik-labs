import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT = path.resolve(__dirname, "..", "src", "main.ts");
const BUN = "bun";

function makeSandbox(t: { after: (fn: () => void) => void }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "memory-db-test-"));
  const home = path.join(root, "home");
  const project = path.join(root, "project");
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(project, { recursive: true });
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { home, project };
}

function runMemory(home: string, args: string[], options: { cwd?: string } = {}) {
  const result = spawnSync(BUN, [SCRIPT, ...args], {
    cwd: options.cwd || home,
    env: { ...process.env, HOME: home },
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `memory_db command failed (${result.status})\ncommand: bun ${SCRIPT} ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }

  const stdout = String(result.stdout || "").trim();
  if (!stdout) {
    return null;
  }
  return JSON.parse(stdout) as any;
}

function vectorOf(value: number, dim = 384): string {
  return Array.from({ length: dim }, () => value).join(",");
}

function initMemory(home: string, options: { cwd?: string } = {}) {
  return runMemory(home, ["init"], options);
}

function upsertMemory(home: string, payload: Record<string, string | boolean>, options: { cwd?: string } = {}) {
  const args = ["upsert"];
  for (const [key, value] of Object.entries(payload)) {
    const flag = `--${key}`;
    if (typeof value === "boolean") {
      if (value) args.push(flag);
      continue;
    }
    args.push(flag, String(value));
  }
  return runMemory(home, args, options);
}

test("init resolves default db path to ~/.taptik/memory.sqlite", (t) => {
  const { home } = makeSandbox(t);
  const out = initMemory(home);
  const expectedDb = path.join(home, ".taptik", "memory.sqlite");

  assert.equal(out.ok, true);
  assert.equal(out.db, expectedDb);
  assert.ok(fs.existsSync(expectedDb));
});

test("upsert writes global and project lessons into their canonical directories", (t) => {
  const { home, project } = makeSandbox(t);
  initMemory(home);

  const globalOut = upsertMemory(home, {
    scope: "global",
    title: "global-lesson",
    summary: "global summary",
    content: "global content",
  });
  const expectedGlobalDir = path.join(home, ".taptik", "lesson");
  assert.equal(globalOut.lesson.scope, "global");
  assert.equal(path.dirname(globalOut.lesson.file_path), expectedGlobalDir);
  assert.ok(fs.existsSync(globalOut.lesson.file_path));

  const projectOut = upsertMemory(home, {
    scope: "project",
    "project-root": project,
    title: "project-lesson",
    summary: "project summary",
    content: "project content",
  });
  const expectedProjectDir = path.join(project, ".taptik", "lesson");
  assert.equal(projectOut.lesson.scope, "project");
  assert.equal(path.dirname(projectOut.lesson.file_path), expectedProjectDir);
  assert.ok(fs.existsSync(projectOut.lesson.file_path));
});

test("search orders project results before global results", (t) => {
  const { home, project } = makeSandbox(t);
  initMemory(home);

  upsertMemory(home, {
    scope: "global",
    title: "alpha-global",
    summary: "global alpha",
    content: "global alpha body",
    keywords: "alpha,global",
  });
  upsertMemory(home, {
    scope: "project",
    "project-root": project,
    title: "alpha-project",
    summary: "project alpha",
    content: "project alpha body",
    keywords: "alpha,project",
  });

  const out = runMemory(home, ["search", "--project-root", project, "--keyword", "alpha", "--limit", "20"]);

  assert.equal(out.ok, true);
  assert.ok(out.items.length >= 2);

  const scopes = out.items.map((item: { scope: string }) => item.scope);
  const firstGlobal = scopes.indexOf("global");
  const lastProject = scopes.lastIndexOf("project");

  assert.notEqual(firstGlobal, -1);
  assert.notEqual(lastProject, -1);
  assert.equal(scopes[0], "project");
  assert.ok(lastProject < firstGlobal);
});

test("get uses project-first lookup and falls back to global", (t) => {
  const { home, project } = makeSandbox(t);
  initMemory(home);

  const title = "fallback-title";

  upsertMemory(home, {
    scope: "global",
    title,
    summary: "global version",
    content: "global content",
  });

  const projectMiss = runMemory(home, ["get", "--title", title, "--project-root", project, "--project-only"]);
  assert.equal(projectMiss.ok, false);
  assert.equal(projectMiss.error, "lesson_not_found");

  const fallbackHit = runMemory(home, ["get", "--title", title, "--project-root", project]);
  assert.equal(fallbackHit.ok, true);
  assert.equal(fallbackHit.lesson.scope, "global");
  assert.equal(fallbackHit.lesson.summary, "global version");

  upsertMemory(home, {
    scope: "project",
    "project-root": project,
    title,
    summary: "project version",
    content: "project content",
  });

  const projectHit = runMemory(home, ["get", "--title", title, "--project-root", project]);
  assert.equal(projectHit.ok, true);
  assert.equal(projectHit.lesson.scope, "project");
  assert.equal(projectHit.lesson.summary, "project version");
});

test("project-only without project-root uses cwd project scope", (t) => {
  const { home, project } = makeSandbox(t);
  initMemory(home);

  upsertMemory(home, {
    scope: "global",
    title: "global-only",
    summary: "global only",
    content: "global only content",
    keywords: "scope-check",
  });
  upsertMemory(
    home,
    {
      scope: "project",
      title: "project-only",
      summary: "project only",
      content: "project only content",
      keywords: "scope-check",
    },
    { cwd: project },
  );

  const searchOut = runMemory(home, ["search", "--project-only", "--keyword", "scope-check", "--limit", "20"], { cwd: project });
  assert.equal(searchOut.ok, true);
  assert.ok(searchOut.items.length >= 1);
  assert.ok(searchOut.items.every((item: { scope: string }) => item.scope === "project"));

  const getMiss = runMemory(home, ["get", "--title", "global-only", "--project-only"], {
    cwd: project,
  });
  assert.equal(getMiss.ok, false);
  assert.equal(getMiss.error, "lesson_not_found");

  const getHit = runMemory(home, ["get", "--title", "project-only", "--project-only"], {
    cwd: project,
  });
  assert.equal(getHit.ok, true);
  assert.equal(getHit.lesson.scope, "project");
});

test("search supports vector embedding query", (t) => {
  const { home, project } = makeSandbox(t);
  initMemory(home);

  upsertMemory(home, {
    scope: "project",
    "project-root": project,
    title: "vec-near",
    summary: "near",
    content: "near content",
    embedding: vectorOf(0.1),
  });

  upsertMemory(home, {
    scope: "project",
    "project-root": project,
    title: "vec-far",
    summary: "far",
    content: "far content",
    embedding: vectorOf(5),
  });

  const out = runMemory(home, ["search", "--project-root", project, "--embedding", vectorOf(0.1), "--limit", "5"]);

  assert.equal(out.ok, true);
  assert.ok(out.items.length >= 1);
  assert.equal(out.items[0].title, "vec-near");
});

test("help advertises agent-memories command", () => {
  const result = spawnSync(BUN, [SCRIPT, "--help"], {
    env: { ...process.env },
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  assert.equal(result.status, 0);
  assert.match(String(result.stdout || ""), /usage:\s+agent-memories\s+\[options\]\s+\[command\]/i);
});
