import { FileSystem } from "@effect/platform"
import { BunFileSystem } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import * as os from "os"
import * as path from "path"
import { TodoRepository } from "../../domain/todo/TodoRepository.js"
import { make as makeJsonTodoRepository } from "../persistence/JsonTodoRepository.js"

const TODO_DIR = path.join(os.homedir(), ".todo-cli")
const TODO_FILE_PATH = path.join(TODO_DIR, "todos.json")

export const TodoRepositoryLayer = Layer.effect(
  TodoRepository,
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    const dirExists = yield* fs.exists(TODO_DIR)
    if (!dirExists) {
      yield* fs.makeDirectory(TODO_DIR, { recursive: true })
    }

    return makeJsonTodoRepository(TODO_FILE_PATH)
  })
).pipe(Layer.provide(BunFileSystem.layer))
