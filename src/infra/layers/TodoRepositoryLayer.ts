import * as os from "node:os"
import * as path from "node:path"
import { FileSystem } from "@effect/platform"
import { BunFileSystem } from "@effect/platform-bun"
import { Config, Effect, Layer } from "effect"
import { TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import { SqliteLive } from "../persistence/SqliteTodoRepository.js"

const TODO_DIR = path.join(os.homedir(), ".todo-cli")
const DEFAULT_DB_PATH = path.join(TODO_DIR, "todos.db")

const ensureDirectoryExists = (dbPath: string): Effect.Effect<void, TodoRepositoryError, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dir = path.dirname(dbPath)

    const dirExists = yield* fs.exists(dir).pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

    if (!dirExists) {
      yield* fs
        .makeDirectory(dir, { recursive: true })
        .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
    }
  })

const loadDatabasePath = Config.withDefault(Config.string("TODO_DB_PATH"), DEFAULT_DB_PATH)

export const TodoRepositoryLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const dbPath = yield* loadDatabasePath
    yield* ensureDirectoryExists(dbPath).pipe(Effect.provide(BunFileSystem.layer))
    return SqliteLive(dbPath)
  })
)
