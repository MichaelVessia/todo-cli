import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { BunContext } from "@effect/platform-bun"
import { Effect } from "effect"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { makeTodo } from "../../src/domain/todo/Todo.js"
import { ConfigManager } from "../../src/infra/config/ConfigManager.js"
import type { DataProviderConfig } from "../../src/infra/config/DataProviderConfig.js"
import { make as makeJsonTodoRepository } from "../../src/infra/persistence/JsonTodoRepository.js"
import { make as makeMarkdownTodoRepository } from "../../src/infra/persistence/MarkdownTodoRepository.js"
import { make as makeMemoryTodoRepository } from "../../src/infra/persistence/MemoryTodoRepository.js"
import { syncCurrentWithDatabase, syncTodos } from "../../src/operations/SyncTodos.js"

const TEST_DIR = path.join(os.tmpdir(), "test-todo-cli-sync")
const TEST_CONFIG_FILE = path.join(TEST_DIR, "config.json")
const TEST_JSON_FILE = path.join(TEST_DIR, "todos.json")
const TEST_MARKDOWN_FILE = path.join(TEST_DIR, "todos.md")
const TEST_JSON_FILE_2 = path.join(TEST_DIR, "todos2.json")
const TEST_MARKDOWN_FILE_2 = path.join(TEST_DIR, "todos2.md")

describe("SyncTodos", () => {
  let testConfigManager: ConfigManager

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true })
    }
    fs.mkdirSync(TEST_DIR, { recursive: true })

    // Create test config manager
    testConfigManager = new ConfigManager(TEST_CONFIG_FILE)
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true })
    }
  })

  test("should sync JSON databases with last-write-wins", async () => {
    // Setup source repository with some todos
    const sourceRepo = makeJsonTodoRepository(TEST_JSON_FILE)
    const sourceConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    
    const todo1 = makeTodo({ title: "Todo 1", priority: "high" })
    const todo2 = makeTodo({ title: "Todo 2", priority: "medium" })
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* sourceRepo.save(todo1)
        yield* sourceRepo.save(todo2)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Setup target repository with overlapping todos
    const targetRepo = makeJsonTodoRepository(TEST_JSON_FILE_2)
    const targetConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE_2 }
    
    const todo3 = makeTodo({ title: "Todo 3", priority: "low" })
    // Create a version of todo1 with a later timestamp
    const todo1Updated = {
      ...todo1,
      title: "Todo 1 Updated",
      updatedAt: new Date(todo1.updatedAt.getTime() + 1000) // 1 second later
    }
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* targetRepo.save(todo1Updated)
        yield* targetRepo.save(todo3)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Sync the databases
    await Effect.runPromise(
      syncTodos(sourceConfig, targetConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the sync results
    const finalSourceTodos = await Effect.runPromise(
      sourceRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )
    
    const finalTargetTodos = await Effect.runPromise(
      targetRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )

    // Both repositories should have the same todos
    expect(finalSourceTodos.length).toBe(3)
    expect(finalTargetTodos.length).toBe(3)

    // Check that todo1 was updated with the later version
    const syncedTodo1 = finalTargetTodos.find(t => t.id === todo1.id)
    expect(syncedTodo1?.title).toBe("Todo 1 Updated")
    expect(syncedTodo1?.updatedAt).toEqual(todo1Updated.updatedAt)

    // Check that todo2 and todo3 are present
    expect(finalTargetTodos.some(t => t.id === todo2.id)).toBe(true)
    expect(finalTargetTodos.some(t => t.id === todo3.id)).toBe(true)
  })

  test("should sync JSON to Markdown databases", async () => {
    // Setup source JSON repository
    const sourceRepo = makeJsonTodoRepository(TEST_JSON_FILE)
    const sourceConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    
    const todo1 = makeTodo({ title: "JSON Todo 1", priority: "high" })
    const todo2 = makeTodo({ title: "JSON Todo 2", priority: "medium" })
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* sourceRepo.save(todo1)
        yield* sourceRepo.save(todo2)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Setup target Markdown repository
    const targetRepo = makeMarkdownTodoRepository(TEST_MARKDOWN_FILE)
    const targetConfig: DataProviderConfig = { type: "markdown", filePath: TEST_MARKDOWN_FILE }
    
    const todo3 = makeTodo({ title: "Markdown Todo 3", priority: "low" })
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* targetRepo.save(todo3)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Sync the databases
    await Effect.runPromise(
      syncTodos(sourceConfig, targetConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the sync results
    const finalSourceTodos = await Effect.runPromise(
      sourceRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )
    
    const finalTargetTodos = await Effect.runPromise(
      targetRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )

    // Both repositories should have all todos
    expect(finalSourceTodos.length).toBe(3)
    expect(finalTargetTodos.length).toBe(3)

    // Check that all todos are present
    const allTodoIds = [todo1.id, todo2.id, todo3.id]
    for (const todoId of allTodoIds) {
      expect(finalSourceTodos.some(t => t.id === todoId)).toBe(true)
      expect(finalTargetTodos.some(t => t.id === todoId)).toBe(true)
    }
  })

  test("should handle syncing with memory database", async () => {
    // Setup source JSON repository
    const sourceRepo = makeJsonTodoRepository(TEST_JSON_FILE)
    const sourceConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    
    const todo1 = makeTodo({ title: "JSON Todo 1", priority: "high" })
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* sourceRepo.save(todo1)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Setup target memory repository
    const targetConfig: DataProviderConfig = { type: "memory" }
    
    const todo2 = makeTodo({ title: "Memory Todo 2", priority: "medium" })
    
    // Note: Since memory repositories are created fresh each time, we need to pre-populate
    // the "existing" state using the internal sync logic

    // Sync the databases
    await Effect.runPromise(
      syncTodos(sourceConfig, targetConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the sync results
    const finalSourceTodos = await Effect.runPromise(
      sourceRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )
    
    // Create a new target repo with the same config to verify results
    const finalTargetRepo = makeMemoryTodoRepository()
    
    // The sync should have copied the source todo to the target (JSON file)
    // But since memory repo is ephemeral, we can only verify source
    expect(finalSourceTodos.length).toBe(1)
    expect(finalSourceTodos[0].id).toBe(todo1.id)
  })

  test("should handle syncing when memory is the source", async () => {
    // Setup target JSON repository first
    const targetRepo = makeJsonTodoRepository(TEST_JSON_FILE)
    const targetConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    
    const todo2 = makeTodo({ title: "JSON Todo 2", priority: "medium" })
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* targetRepo.save(todo2)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // For memory source, we need to understand this won't work as expected 
    // because the memory repo created in syncTodos will be empty
    // This is actually the correct behavior - memory repos are ephemeral
    const sourceConfig: DataProviderConfig = { type: "memory" }

    // Sync the databases
    await Effect.runPromise(
      syncTodos(sourceConfig, targetConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the sync results
    const finalTargetTodos = await Effect.runPromise(
      targetRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )

    // Target should have the original todo since memory source is empty
    expect(finalTargetTodos.length).toBe(1)
    expect(finalTargetTodos[0].id).toBe(todo2.id)
  })

  test("should handle last-write-wins correctly", async () => {
    // Setup source repository
    const sourceRepo = makeJsonTodoRepository(TEST_JSON_FILE)
    const sourceConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    
    const baseTodo = makeTodo({ title: "Base Todo", priority: "medium" })
    const olderTodo = {
      ...baseTodo,
      title: "Older Version",
      updatedAt: new Date(baseTodo.updatedAt.getTime() - 5000) // 5 seconds earlier
    }
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* sourceRepo.save(olderTodo)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Setup target repository
    const targetRepo = makeJsonTodoRepository(TEST_JSON_FILE_2)
    const targetConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE_2 }
    
    const newerTodo = {
      ...baseTodo,
      title: "Newer Version",
      updatedAt: new Date(baseTodo.updatedAt.getTime() + 5000) // 5 seconds later
    }
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* targetRepo.save(newerTodo)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Sync the databases
    await Effect.runPromise(
      syncTodos(sourceConfig, targetConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the sync results
    const finalSourceTodos = await Effect.runPromise(
      sourceRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )
    
    const finalTargetTodos = await Effect.runPromise(
      targetRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )

    // Both should have the newer version
    expect(finalSourceTodos.length).toBe(1)
    expect(finalTargetTodos.length).toBe(1)
    
    expect(finalSourceTodos[0].title).toBe("Newer Version")
    expect(finalTargetTodos[0].title).toBe("Newer Version")
    expect(finalSourceTodos[0].updatedAt).toEqual(newerTodo.updatedAt)
    expect(finalTargetTodos[0].updatedAt).toEqual(newerTodo.updatedAt)
  })

  test("should handle syncCurrentWithDatabase", async () => {
    // Set current config to JSON
    const currentConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    await Effect.runPromise(
      testConfigManager.setDataProviderConfig(currentConfig).pipe(Effect.provide(BunContext.layer))
    )

    // Setup current repository
    const currentRepo = makeJsonTodoRepository(TEST_JSON_FILE)
    const todo1 = makeTodo({ title: "Current Todo", priority: "high" })
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* currentRepo.save(todo1)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Setup target repository
    const targetRepo = makeMarkdownTodoRepository(TEST_MARKDOWN_FILE)
    const targetConfig: DataProviderConfig = { type: "markdown", filePath: TEST_MARKDOWN_FILE }
    
    const todo2 = makeTodo({ title: "Target Todo", priority: "medium" })
    
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* targetRepo.save(todo2)
      }).pipe(Effect.provide(BunContext.layer))
    )

    // Sync current with target
    await Effect.runPromise(
      syncCurrentWithDatabase(targetConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify current config was updated
    const finalConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )
    expect(finalConfig).toEqual(targetConfig)

    // Verify sync results
    const finalCurrentTodos = await Effect.runPromise(
      currentRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )
    
    const finalTargetTodos = await Effect.runPromise(
      targetRepo.findAll().pipe(Effect.provide(BunContext.layer))
    )

    // Both should have all todos
    expect(finalCurrentTodos.length).toBe(2)
    expect(finalTargetTodos.length).toBe(2)
  })

  test("should prevent syncing with same database", async () => {
    // Set current config to JSON
    const currentConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    await Effect.runPromise(
      testConfigManager.setDataProviderConfig(currentConfig).pipe(Effect.provide(BunContext.layer))
    )

    // Try to sync with the same database
    const targetConfig: DataProviderConfig = { type: "json", filePath: TEST_JSON_FILE }
    
    // This should complete without error but not actually sync
    await Effect.runPromise(
      syncCurrentWithDatabase(targetConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Config should remain unchanged
    const finalConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )
    expect(finalConfig).toEqual(currentConfig)
  })
})