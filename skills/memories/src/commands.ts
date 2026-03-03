import process from "node:process";
import { Inject, Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import { MemoryService, type OptionMap } from "./memory.service.js";

type CliOptions = Record<string, unknown>;

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function toServiceOptions(options: CliOptions): OptionMap {
  const out: OptionMap = {};
  const map: Array<[string, string]> = [
    ["db", "db"],
    ["title", "title"],
    ["summary", "summary"],
    ["content", "content"],
    ["keywords", "keywords"],
    ["scope", "scope"],
    ["projectRoot", "project-root"],
    ["projectOnly", "project-only"],
    ["limit", "limit"],
    ["keyword", "keyword"],
    ["embedding", "embedding"],
    ["id", "id"],
  ];

  for (const [from, to] of map) {
    const value = options[from];
    if (value === undefined) continue;
    if (typeof value === "number") {
      out[to] = String(value);
      continue;
    }
    if (typeof value === "boolean" || typeof value === "string") {
      out[to] = value;
    }
  }

  return out;
}

@Injectable()
abstract class BaseMemoryCommand extends CommandRunner {
  @Inject(MemoryService)
  protected memory!: MemoryService;

  protected output(value: unknown): void {
    printJson(value);
  }

  protected normalize(options: CliOptions): OptionMap {
    return toServiceOptions(options);
  }

  @Option({ flags: "--db <path>" })
  parseDb(value: string): string {
    return value;
  }

  @Option({ flags: "--title <text>" })
  parseTitle(value: string): string {
    return value;
  }

  @Option({ flags: "--summary <text>" })
  parseSummary(value: string): string {
    return value;
  }

  @Option({ flags: "--content <text>" })
  parseContent(value: string): string {
    return value;
  }

  @Option({ flags: "--keywords <csv>" })
  parseKeywords(value: string): string {
    return value;
  }

  @Option({ flags: "--scope <scope>" })
  parseScope(value: string): string {
    return value;
  }

  @Option({ flags: "--project-root <path>" })
  parseProjectRoot(value: string): string {
    return value;
  }

  @Option({ flags: "--project-only" })
  parseProjectOnly(): boolean {
    return true;
  }

  @Option({ flags: "--limit <n>" })
  parseLimit(value: string): number {
    return Number.parseInt(value, 10);
  }

  @Option({ flags: "--keyword <text>" })
  parseKeyword(value: string): string {
    return value;
  }

  @Option({ flags: "--embedding <csv-or-json>" })
  parseEmbedding(value: string): string {
    return value;
  }

  @Option({ flags: "--id <n>" })
  parseId(value: string): number {
    return Number.parseInt(value, 10);
  }

}

@Command({ name: "init", description: "Initialize global memory DB" })
export class InitCommand extends BaseMemoryCommand {
  async run(_params: string[], options: CliOptions): Promise<void> {
    this.output(this.memory.cmdInit(this.normalize(options)));
  }
}

@Command({ name: "upsert", description: "Save or update a lesson" })
export class UpsertCommand extends BaseMemoryCommand {
  async run(_params: string[], options: CliOptions): Promise<void> {
    this.output(this.memory.cmdUpsert(this.normalize(options)));
  }
}

@Command({ name: "search", description: "Search lesson index" })
export class SearchCommand extends BaseMemoryCommand {
  async run(_params: string[], options: CliOptions): Promise<void> {
    this.output(this.memory.cmdSearch(this.normalize(options)));
  }
}

@Command({ name: "get", description: "Get lesson detail" })
export class GetCommand extends BaseMemoryCommand {
  async run(_params: string[], options: CliOptions): Promise<void> {
    this.output(this.memory.cmdGet(this.normalize(options)));
  }
}
