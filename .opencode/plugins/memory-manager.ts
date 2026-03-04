import type { Plugin, PluginInput } from "@opencode-ai/plugin"

interface MemoryEntry {
  title: string
  summary: string
  keywords: string[]
  projectPath: string
  updatedAt: string
}

type Shell = PluginInput["$"]

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function normalizeMemoryEntry(value: unknown): MemoryEntry | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  const title = typeof row.title === "string" ? row.title : ""
  const summary = typeof row.summary === "string" ? row.summary : ""
  const keywords = Array.isArray(row.keywords)
    ? row.keywords.filter((item): item is string => typeof item === "string")
    : typeof row.keywords === "string"
      ? row.keywords.split(",").map((item) => item.trim()).filter((item) => item.length > 0)
      : []
  const projectPath = typeof row.project_path === "string" ? row.project_path : ""
  const updatedAt = typeof row.updated_at === "string" ? row.updated_at : ""
  if (!title) return null
  return { title, summary, keywords, projectPath, updatedAt }
}

function parseMemoryEntries(raw: string): MemoryEntry[] {
  try {
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown[] }).items)
        ? (parsed as { items: unknown[] }).items
        : []
    return items
      .map(normalizeMemoryEntry)
      .filter((entry): entry is MemoryEntry => entry !== null)
  } catch {
    return []
  }
}

async function getRecentMemories(projectRoot: string, memoriesPath: string, shell: Shell): Promise<MemoryEntry[]> {
  const threshold = Date.now() - THIRTY_DAYS_MS
  try {
    const result = await shell
      .cwd(memoriesPath)`npm exec -- agent-memories search --project-root ${projectRoot} --limit 50`
      .quiet()
      .nothrow()
    if (result.exitCode !== 0) return []
    return parseMemoryEntries(result.text()).filter((entry) => {
      if (!entry.updatedAt) return false
      const timestamp = new Date(entry.updatedAt).getTime()
      return Number.isFinite(timestamp) && timestamp >= threshold
    })
  } catch {
    return []
  }
}

async function searchMemories(projectRoot: string, query: string, memoriesPath: string, shell: Shell): Promise<MemoryEntry[]> {
  try {
    const result = await shell
      .cwd(memoriesPath)`npm exec -- agent-memories search --project-root ${projectRoot} --keyword ${query} --limit 10`
      .quiet()
      .nothrow()
    if (result.exitCode !== 0) return []
    return parseMemoryEntries(result.text())
  } catch {
    return []
  }
}

async function upsertMemory(
  projectRoot: string,
  title: string,
  summary: string,
  content: string,
  keywords: string[],
  memoriesPath: string,
  shell: Shell,
): Promise<boolean> {
  const keywordString = keywords.join(",")
  try {
    const result = await shell
      .cwd(memoriesPath)`npm exec -- agent-memories upsert --title ${title} --summary ${summary} --content ${content} --keywords ${keywordString} --scope project --project-root ${projectRoot}`
      .quiet()
      .nothrow()
    return result.exitCode === 0
  } catch {
    return false
  }
}

async function fileExists(path: string, shell: Shell): Promise<boolean> {
  try {
    const result = await shell`test -f ${path}`.quiet().nothrow()
    return result.exitCode === 0
  } catch {
    return false
  }
}

async function directoryExists(path: string, shell: Shell): Promise<boolean> {
  try {
    const result = await shell`test -d ${path}`.quiet().nothrow()
    return result.exitCode === 0
  } catch {
    return false
  }
}

async function gitDirtyCount(projectRoot: string, shell: Shell): Promise<number | null> {
  try {
    const result = await shell.cwd(projectRoot)`git status --porcelain`.quiet().nothrow()
    if (result.exitCode !== 0) return null
    const lines = result.text().split("\n").filter((line) => line.trim().length > 0)
    return lines.length
  } catch {
    return null
  }
}

async function validateProjectState(projectRoot: string, shell: Shell): Promise<{ issues: string[]; dirtyCount: number | null }> {
  const issues: string[] = []
  const agentsPath = `${projectRoot}/AGENTS.md`
  const todoPath = `${projectRoot}/.taptik/tasks/todo.md`
  const taptikPath = `${projectRoot}/.taptik`

  if (!(await fileExists(agentsPath, shell))) {
    issues.push("AGENTS.md is missing")
  }
  if (!(await directoryExists(taptikPath, shell))) {
    issues.push(".taptik directory is missing")
  }
  if (!(await fileExists(todoPath, shell))) {
    issues.push(".taptik/tasks/todo.md is missing")
  }

  return {
    issues,
    dirtyCount: await gitDirtyCount(projectRoot, shell),
  }
}

function extractKeywords(messages: unknown[]): string[] {
  const keywordSet = new Set<string>()
  const importantPatterns = [
    /\b(fix|bug|error|issue)\b/gi,
    /\b(feature|add|implement|create)\b/gi,
    /\b(refactor|improve|optimize)\b/gi,
    /\b(api|plugin|memory)\b/gi,
  ]
  
  for (const msg of messages) {
    const content = typeof msg === 'string' ? msg : JSON.stringify(msg)
    for (const pattern of importantPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach((m) => keywordSet.add(m.toLowerCase()))
      }
    }
  }
  
  return Array.from(keywordSet).slice(0, 10)
}

function buildMemoryPrompt(title: string, memories: MemoryEntry[]): string {
  return `${title}\n${memories.map((entry) => `- ${entry.title}: ${entry.summary || "(no summary)"} [${entry.keywords.join(",")}]`).join("\n")}`
}

function getSessionIdFromEvent(event: { type: string; properties: Record<string, unknown> }): string | null {
  const direct = event.properties.sessionID
  if (typeof direct === "string" && direct.length > 0) return direct
  const info = event.properties.info
  if (info && typeof info === "object") {
    const id = (info as { id?: unknown }).id
    if (typeof id === "string" && id.length > 0) return id
  }
  return null
}

async function resolveMemoriesPath(projectRoot: string, directory: string, shell: Shell): Promise<string | null> {
  const candidates = [
    `${projectRoot}/memories`,
    `${directory}/memories`,
    `${projectRoot}/skills/memories`,
    `${directory}/skills/memories`,
  ]
  const seen = new Set<string>()
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    if (await directoryExists(candidate, shell)) {
      return candidate
    }
  }
  return null
}

export const MemoryManagerPlugin: Plugin = async ({ client, $, directory, worktree }) => {
  const projectRoot = worktree || directory
  const pendingSystemPrompt = new Map<string, string>()
  const importantSummary = new Map<string, string>()
  let memoriesPath: string | null = null
  let memoriesPathResolved = false
  let missingPathWarned = false

  const getMemoriesPath = async (): Promise<string | null> => {
    if (memoriesPathResolved) return memoriesPath
    memoriesPathResolved = true
    memoriesPath = await resolveMemoriesPath(projectRoot, directory, $)
    return memoriesPath
  }

  const ensureMemoriesPath = async (): Promise<string | null> => {
    const path = await getMemoriesPath()
    if (path) return path
    if (!missingPathWarned) {
      missingPathWarned = true
      await client.app.log({
        body: {
          service: "memory-manager",
          level: "warn",
          message: "memories path not found; expected ./memories or ./skills/memories",
        },
      })
    }
    return null
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        const sessionID = getSessionIdFromEvent(event)
        if (!sessionID) return
        const path = await ensureMemoriesPath()
        if (!path) return
        const memories = await getRecentMemories(projectRoot, path, $)
        if (memories.length > 0) {
          pendingSystemPrompt.set(sessionID, buildMemoryPrompt("## Recent Memories (last 30 days)", memories))
          importantSummary.set(sessionID, buildMemoryPrompt("Recent continuity", memories.slice(0, 8)))
          await client.app.log({
            body: {
              service: "memory-manager",
              level: "info",
              message: `Loaded ${memories.length} recent memories for session ${sessionID}`,
            },
          })
        }
      }

      if (event.type === "command.executed") {
        const sessionID = getSessionIdFromEvent(event)
        if (!sessionID) return
        const path = await ensureMemoriesPath()
        if (!path) return
        const name = typeof event.properties.name === "string" ? event.properties.name : ""
        const args = typeof event.properties.arguments === "string" ? event.properties.arguments : ""
        const query = `${name} ${args}`.trim().slice(0, 200)
        if (!query) return
        const found = await searchMemories(projectRoot, query, path, $)
        if (found.length > 0) {
          pendingSystemPrompt.set(sessionID, buildMemoryPrompt("## Relevant Memories for Current Command", found.slice(0, 6)))
          importantSummary.set(sessionID, buildMemoryPrompt("Command-related memory", found.slice(0, 6)))
          await client.app.log({
            body: {
              service: "memory-manager",
              level: "info",
              message: `Found ${found.length} memories for command ${name}`,
            },
          })
        }
      }

      if (event.type === "session.idle") {
        const sessionID = getSessionIdFromEvent(event)
        if (!sessionID) return
        const state = await validateProjectState(projectRoot, $)
        const issuesText = state.issues.length > 0 ? state.issues.join("; ") : "none"
        const dirtyText = state.dirtyCount === null ? "unknown" : String(state.dirtyCount)
        const idleSummary = `Idle validation for ${sessionID}. issues=${issuesText}. dirty_files=${dirtyText}.`
        const idleKeywords = extractKeywords([idleSummary, ...state.issues])
        const shouldPersist = state.issues.length > 0 || (state.dirtyCount ?? 0) > 0
        const path = shouldPersist ? await ensureMemoriesPath() : null
        const saved = shouldPersist
          ? path
            ? await upsertMemory(
              projectRoot,
              `Session ${sessionID.slice(0, 8)} Idle Validation`,
              idleSummary.slice(0, 220),
              idleSummary,
              idleKeywords,
              path,
              $,
            )
            : false
          : false
        await client.app.log({
          body: {
            service: "memory-manager",
            level: state.issues.length > 0 ? "warn" : "info",
            message: `session.idle validation issues=${state.issues.length}, dirty=${dirtyText}, memory_saved=${saved}`,
            extra: { issues: state.issues, dirtyCount: state.dirtyCount },
          },
        })
      }

      if (event.type === "session.compacted") {
        const sessionID = getSessionIdFromEvent(event)
        if (!sessionID) return
        const summary = importantSummary.get(sessionID)
        const path = await ensureMemoriesPath()
        if (!path) return
        if (summary) {
          const keywords = extractKeywords([summary])
          const saved = await upsertMemory(
            projectRoot,
            `Session ${sessionID.slice(0, 8)} Compaction Notes`,
            summary.slice(0, 220),
            summary,
            keywords,
            path,
            $,
          )
          await client.app.log({
            body: {
              service: "memory-manager",
              level: saved ? "info" : "warn",
              message: `session.compacted memory_saved=${saved} for ${sessionID}`,
            },
          })
        }
      }
    },

    "experimental.session.compacting": async (input, output) => {
      const summary = importantSummary.get(input.sessionID)
      if (summary) {
        output.context.push(`## Project Memory Snapshot\n${summary}`)
      }
    },

    "experimental.chat.system.transform": async (input, output) => {
      if (!input.sessionID) return
      const pending = pendingSystemPrompt.get(input.sessionID)
      if (!pending) return
      output.system.push(pending)
      pendingSystemPrompt.delete(input.sessionID)
    },
  }
}
