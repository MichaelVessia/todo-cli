#!/usr/bin/env node

import { BunContext, BunRuntime } from "@effect/platform-bun"
import { Effect } from "effect"
import { run } from "./Cli.js"

run(process.argv).pipe(
  Effect.provide(BunContext.layer),
  BunRuntime.runMain({ disableErrorReporting: true })
)
