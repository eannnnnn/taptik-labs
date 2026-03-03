#!/usr/bin/env bun

import "reflect-metadata";
import process from "node:process";
import { CommandFactory } from "nest-commander";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  process.argv[1] = "agent-memories";
  try {
    await CommandFactory.run(AppModule, {
      cliName: "agent-memories",
      logger: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

void bootstrap();
