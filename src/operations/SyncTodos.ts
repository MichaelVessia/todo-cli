import * as os from "node:os"
import * as path from "node:path"
import { Console, Effect } from "effect"
import type { Todo } from "../domain/todo/Todo.js"
import type { TodoRepositoryError } from "../domain/todo/TodoErrors.js"
import { TodoId } from "../domain/todo/TodoId.js"
import type { TodoRepository } from "../domain/todo/TodoRepository.js"
import { type ConfigManager, configManager } from "../infra/config/ConfigManager.js"
import type { DataProviderConfig } from "../infra/config/DataProviderConfig.js"
import { make as makeJsonTodoRepository } from "../infra/persistence/JsonTodoRepository.js"
import { make as makeMarkdownTodoRepository } from "../infra/persistence/MarkdownTodoRepository.js"
import { make as makeMemoryTodoRepository } from "../infra/persistence/MemoryTodoRepository.js"

const TODO_DIR = path.join(os.homedir(), ".todo-cli")
const DEFAULT_JSON_FILE_PATH = path.join(TODO_DIR, "todos.json")
const DEFAULT_MARKDOWN_FILE_PATH = path.join(TODO_DIR, "todos.md")

const createRepositoryFromConfig = (config: DataProviderConfig): TodoRepository => {
  switch (config.type) {
    case "json":
      return makeJsonTodoRepository(config.filePath || DEFAULT_JSON_FILE_PATH)
    case "markdown":
      return makeMarkdownTodoRepository(config.filePath || DEFAULT_MARKDOWN_FILE_PATH)
    case "memory":
      return makeMemoryTodoRepository()
  }
}

const mergeTodosWithLastWriteWins = (sourceTodos: readonly Todo[], targetTodos: readonly Todo[]): readonly Todo[] => {
  const mergedTodos = new Map<string, Todo>()

  // Add all target todos first
  for (const todo of targetTodos) {
    mergedTodos.set(TodoId.toString(todo.id), todo)
  }

  // Add source todos, overwriting if they have a more recent updatedAt
  for (const sourceTodo of sourceTodos) {
    const todoId = TodoId.toString(sourceTodo.id)
    const existingTodo = mergedTodos.get(todoId)

    if (!existingTodo || sourceTodo.updatedAt > existingTodo.updatedAt) {
      mergedTodos.set(todoId, sourceTodo)
    }
  }

  return Array.from(mergedTodos.values())
}

export const syncTodos = (
  sourceConfig: DataProviderConfig,
  targetConfig: DataProviderConfig,
  manager: ConfigManager = configManager
): Effect.Effect<void, TodoRepositoryError, never> =>
  Effect.gen(function* () {
    // Create repositories
    const sourceRepo = createRepositoryFromConfig(sourceConfig)
    const targetRepo = createRepositoryFromConfig(targetConfig)

    // Get todos from both repositories
    const sourceTodos = yield* sourceRepo.findAll()
    const targetTodos = yield* targetRepo.findAll()

    // Merge todos using last-write-wins logic
    const mergedTodos = mergeTodosWithLastWriteWins(sourceTodos, targetTodos)

    // Count changes
    const sourceCount = sourceTodos.length
    const targetCount = targetTodos.length
    const mergedCount = mergedTodos.length

    // If source is memory, we can't write back to it, so only update target
    if (sourceConfig.type !== "memory") {
      // Write merged todos back to source
      // First, clear existing todos by reading and deleting them
      const existingSourceTodos = yield* sourceRepo.findAll()
      for (const todo of existingSourceTodos) {
        yield* sourceRepo.deleteById(todo.id)
      }

      // Add merged todos to source
      for (const todo of mergedTodos) {
        yield* sourceRepo.save(todo)
      }
    }

    // Write merged todos back to target
    // First, clear existing todos by reading and deleting them
    const existingTargetTodos = yield* targetRepo.findAll()
    for (const todo of existingTargetTodos) {
      yield* targetRepo.deleteById(todo.id)
    }

    // Add merged todos to target
    for (const todo of mergedTodos) {
      yield* targetRepo.save(todo)
    }

    // Update current configuration to target
    yield* manager.setDataProviderConfig(targetConfig)

    // Report sync results
    const sourceTypeName =
      sourceConfig.type === "json" ? "JSON" : sourceConfig.type === "markdown" ? "Markdown" : "Memory"
    const targetTypeName =
      targetConfig.type === "json" ? "JSON" : targetConfig.type === "markdown" ? "Markdown" : "Memory"

    yield* Console.log(
      `Sync completed: ${sourceTypeName} (${sourceCount} todos) ↔ ${targetTypeName} (${targetCount} todos)`
    )
    yield* Console.log(`Result: ${mergedCount} todos total after merge`)
    yield* Console.log(`Database switched to ${targetTypeName}`)
  })

export const syncCurrentWithDatabase = (
  targetConfig: DataProviderConfig,
  manager: ConfigManager = configManager
): Effect.Effect<void, TodoRepositoryError, never> =>
  Effect.gen(function* () {
    // Get current configuration
    const currentConfig = yield* manager.getDataProviderConfig()

    // Check if trying to sync with the same database type
    if (
      currentConfig.type === targetConfig.type &&
      ("filePath" in currentConfig ? currentConfig.filePath : undefined) ===
        ("filePath" in targetConfig ? targetConfig.filePath : undefined)
    ) {
      yield* Console.log("Cannot sync: source and target are the same database")
      return
    }

    yield* syncTodos(currentConfig, targetConfig, manager)
  })
