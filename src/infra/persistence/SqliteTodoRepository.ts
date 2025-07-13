import { SqlClient } from "@effect/sql"
import { SqliteClient } from "@effect/sql-sqlite-bun"
import { Effect, Layer, Option } from "effect"
import { Todo } from "../../domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError, TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import type { TodoId } from "../../domain/todo/TodoId.js"
import { TodoRepository } from "../../domain/todo/TodoRepository.js"

const createTodosTable = SqlClient.SqlClient.pipe(
  Effect.flatMap(
    (sql) =>
      sql`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        due_date INTEGER
      )
    `
  ),
  Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
)

class SqliteTodoRepository implements TodoRepository {
  constructor(private readonly sql: SqlClient.SqlClient) {}

  private readonly todoFromRow = (row: any): Todo =>
    new Todo({
      id: row.id as TodoId,
      title: row.title,
      description: row.description || undefined,
      status: row.status as Todo["status"],
      priority: row.priority as Todo["priority"],
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      ...(row.due_date ? { dueDate: Number(row.due_date) } : {})
    })

  readonly findById = (id: TodoId): Effect.Effect<Todo, TodoNotFoundError | TodoRepositoryError, never> =>
    this.sql`
      SELECT * FROM todos WHERE id = ${id as string}
    `.pipe(
      Effect.flatMap((rows) => {
        if (rows.length === 0) {
          return Effect.fail(new TodoNotFoundError({ id }))
        }
        return Effect.succeed(this.todoFromRow(rows[0]))
      }),
      Effect.mapError((error) =>
        error instanceof TodoNotFoundError ? error : new TodoRepositoryError({ cause: error })
      )
    )

  readonly findAll = (): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: SqliteTodoRepository) {
        const rows = yield* this.sql`
          SELECT * FROM todos ORDER BY created_at DESC
        `.pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        return rows.map(this.todoFromRow)
      }.bind(this)
    )

  readonly save = (todo: Todo): Effect.Effect<Todo, TodoAlreadyExistsError | TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: SqliteTodoRepository) {
        // Check if todo already exists
        const existing = yield* this.sql`
          SELECT id FROM todos WHERE id = ${todo.id as string}
        `.pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        if (existing.length > 0) {
          return yield* Effect.fail(new TodoAlreadyExistsError({ id: todo.id }))
        }

        // Insert new todo
        yield* this.sql`
          INSERT INTO todos (id, title, description, status, priority, created_at, updated_at, due_date)
          VALUES (
            ${todo.id as string},
            ${todo.title},
            ${Option.getOrNull(Option.fromNullable(todo.description))},
            ${todo.status},
            ${todo.priority},
            ${todo.createdAt},
            ${todo.updatedAt},
            ${Option.getOrNull(Option.fromNullable(todo.dueDate))}
          )
        `.pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        return todo
      }.bind(this)
    )

  readonly update = (todo: Todo): Effect.Effect<Todo, TodoRepositoryError, never> =>
    this.sql`
      UPDATE todos
      SET 
        title = ${todo.title},
        description = ${Option.getOrNull(Option.fromNullable(todo.description))},
        status = ${todo.status},
        priority = ${todo.priority},
        updated_at = ${todo.updatedAt},
        due_date = ${Option.getOrNull(Option.fromNullable(todo.dueDate))}
      WHERE id = ${todo.id as string}
    `.pipe(
      Effect.map(() => todo),
      Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
    )

  readonly deleteById = (id: TodoId): Effect.Effect<void, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: SqliteTodoRepository) {
        yield* this.sql`
          DELETE FROM todos WHERE id = ${id as string}
        `.pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        // Check if any row was deleted
        const changes = yield* this.sql`SELECT changes() as count`.pipe(
          Effect.map((rows) => rows[0].count),
          Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
        )

        if (changes === 0) {
          return yield* Effect.fail(new TodoNotFoundError({ id }))
        }
      }.bind(this)
    )

  readonly findByStatus = (status: Todo["status"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: SqliteTodoRepository) {
        const rows = yield* this.sql`
          SELECT * FROM todos WHERE status = ${status} ORDER BY created_at DESC
        `.pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        return rows.map(this.todoFromRow)
      }.bind(this)
    )

  readonly findByPriority = (priority: Todo["priority"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: SqliteTodoRepository) {
        const rows = yield* this.sql`
          SELECT * FROM todos WHERE priority = ${priority} ORDER BY created_at DESC
        `.pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        return rows.map(this.todoFromRow)
      }.bind(this)
    )

  readonly count = (): Effect.Effect<number, TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: SqliteTodoRepository) {
        const rows = yield* this.sql`
          SELECT COUNT(*) as count FROM todos
        `.pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        return rows[0].count as number
      }.bind(this)
    )
}

export const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* createTodosTable
  return new SqliteTodoRepository(sql) as TodoRepository
})

export const layer = Layer.effect(TodoRepository, make)

export const SqliteLive = (databasePath: string) =>
  Layer.provide(
    layer,
    SqliteClient.layer({
      filename: databasePath
    })
  )

export const SqliteTest = Layer.provide(
  layer,
  SqliteClient.layer({
    filename: ":memory:"
  })
)
