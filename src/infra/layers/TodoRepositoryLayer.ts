import * as os from "node:os"
import * as path from "node:path"
import { FileSystem } from "@effect/platform"
import { BunFileSystem } from "@effect/platform-bun"
import { ConfigProvider, Effect, Layer } from "effect"
import { TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import { TodoRepository } from "../../domain/todo/TodoRepository.js"
import { type DataProviderConfig, loadDataProviderConfig } from "../config/DataProviderConfig.js"
import { make as makeJsonTodoRepository } from "../persistence/JsonTodoRepository.js"
import { make as makeMarkdownTodoRepository } from "../persistence/MarkdownTodoRepository.js"
import { make as makeMemoryTodoRepository } from "../persistence/MemoryTodoRepository.js"

const TODO_DIR = path.join(os.homedir(), ".todo-cli")
const DEFAULT_JSON_FILE_PATH = path.join(TODO_DIR, "todos.json")
const DEFAULT_MARKDOWN_FILE_PATH = path.join(TODO_DIR, "todos.md")

const createRepository = (
  config: DataProviderConfig
): Effect.Effect<TodoRepository, TodoRepositoryError, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    switch (config.type) {
      case "json": {
        const fs = yield* FileSystem.FileSystem
        const filePath = config.filePath || DEFAULT_JSON_FILE_PATH
        const dir = path.dirname(filePath)

        const dirExists = yield* fs
          .exists(dir)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        if (!dirExists) {
          yield* fs
            .makeDirectory(dir, { recursive: true })
            .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        }

        return makeJsonTodoRepository(filePath)
      }

      case "memory": {
        return makeMemoryTodoRepository()
      }

      case "markdown": {
        const fs = yield* FileSystem.FileSystem
        const filePath = config.filePath || DEFAULT_MARKDOWN_FILE_PATH
        const dir = path.dirname(filePath)

        const dirExists = yield* fs
          .exists(dir)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        if (!dirExists) {
          yield* fs
            .makeDirectory(dir, { recursive: true })
            .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        }

        return makeMarkdownTodoRepository(filePath)
      }
    }
  })

export const TodoRepositoryLayer = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    const config = yield* loadDataProviderConfig.pipe(Effect.withConfigProvider(ConfigProvider.fromEnv()))
    return yield* createRepository(config)
  })
).pipe(Layer.provide(BunFileSystem.layer))
