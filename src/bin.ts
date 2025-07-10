#!/usr/bin/env bun

import { BunContext, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import { run } from "./cli/interactive.js"
import { TodoRepositoryLayer } from "./infra/layers/TodoRepositoryLayer.js"

const MainLayer = Layer.mergeAll(BunContext.layer, TodoRepositoryLayer)

const program = run(process.argv).pipe(Effect.provide(MainLayer))

BunRuntime.runMain(program as any, { disableErrorReporting: true })
