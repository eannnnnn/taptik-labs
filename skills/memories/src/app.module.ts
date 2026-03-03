import { Module } from "@nestjs/common";
import {
  GetCommand,
  InitCommand,
  SearchCommand,
  UpsertCommand,
} from "./commands.js";
import { MemoryService } from "./memory.service.js";

@Module({
  providers: [
    MemoryService,
    InitCommand,
    UpsertCommand,
    SearchCommand,
    GetCommand,
  ],
})
export class AppModule {}
