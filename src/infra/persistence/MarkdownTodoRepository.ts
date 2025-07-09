import { FileSystem } from "@effect/platform"
import { BunFileSystem } from "@effect/platform-bun"
import { Effect } from "effect"
import { Todo } from "../../domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError, TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import { TodoId } from "../../domain/todo/TodoId.js"
import type { TodoRepository } from "../../domain/todo/TodoRepository.js"

export class MarkdownTodoRepository implements TodoRepository {
  constructor(private readonly filePath: string) {}

  private readonly parseMarkdownTodos = (content: string): Todo[] => {
    const todos: Todo[] = []
    const lines = content.split("\n")

    let currentTodo: any = null
    let currentSection: "pending" | "in_progress" | "completed" | null = null

    for (const line of lines) {
      // Check for section headers
      if (line.match(/^## (Pending|In Progress|Completed)$/)) {
        const sectionMap = {
          Pending: "pending" as const,
          "In Progress": "in_progress" as const,
          Completed: "completed" as const
        }
        currentSection = sectionMap[line.replace("## ", "") as keyof typeof sectionMap]
        continue
      }

      // Check for todo items
      const todoMatch = line.match(/^- \[([ x])\] (.+)$/)
      if (todoMatch && currentSection) {
        const [, _checked, title] = todoMatch

        // If we were building a previous todo, save it
        if (currentTodo) {
          todos.push(new Todo(currentTodo))
        }

        // Start new todo
        currentTodo = {
          title: title.trim(),
          status: currentSection,
          priority: "medium" as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        continue
      }

      // Check for metadata comments
      if (currentTodo && line.trim().startsWith("<!--")) {
        const metadataMatch = line.match(
          /<!-- id: (.+), priority: (.+), created: (.+), updated: (.+)(?:, due: (.+))? -->/
        )
        if (metadataMatch) {
          const [, id, priority, created, updated, due] = metadataMatch
          currentTodo.id = TodoId.make(id)
          currentTodo.priority = priority
          currentTodo.createdAt = new Date(created)
          currentTodo.updatedAt = new Date(updated)
          if (due) {
            currentTodo.dueDate = new Date(due)
          }
        }
        continue
      }

      // Check for description
      if (currentTodo && line.trim().startsWith("  ") && !line.trim().startsWith("<!--")) {
        const description = line.trim()
        if (description && !description.startsWith("<!--")) {
          currentTodo.description = description
        }
      }
    }

    // Save the last todo
    if (currentTodo) {
      todos.push(new Todo(currentTodo))
    }

    return todos
  }

  private readonly generateMarkdownContent = (todos: readonly Todo[]): string => {
    const sections = {
      pending: [] as Todo[],
      in_progress: [] as Todo[],
      completed: [] as Todo[]
    }

    // Group todos by status
    todos.forEach((todo) => {
      sections[todo.status].push(todo)
    })

    const formatTodo = (todo: Todo): string => {
      const checkbox = todo.status === "completed" ? "[x]" : "[ ]"
      const priorityEmoji = todo.priority === "high" ? "🔴 " : todo.priority === "medium" ? "🟡 " : "🟢 "

      let result = `- ${checkbox} ${priorityEmoji}${todo.title}\n`

      // Add metadata as HTML comment
      const dueDate = todo.dueDate ? `, due: ${todo.dueDate.toISOString()}` : ""
      result += `  <!-- id: ${TodoId.toString(todo.id)}, priority: ${todo.priority}, created: ${todo.createdAt.toISOString()}, updated: ${todo.updatedAt.toISOString()}${dueDate} -->\n`

      // Add description if present
      if (todo.description) {
        result += `  ${todo.description}\n`
      }

      return result
    }

    let content = "# Todo List\n\n"

    // Add each section
    if (sections.pending.length > 0) {
      content += "## Pending\n\n"
      sections.pending.forEach((todo) => {
        content += `${formatTodo(todo)}\n`
      })
    }

    if (sections.in_progress.length > 0) {
      content += "## In Progress\n\n"
      sections.in_progress.forEach((todo) => {
        content += `${formatTodo(todo)}\n`
      })
    }

    if (sections.completed.length > 0) {
      content += "## Completed\n\n"
      sections.completed.forEach((todo) => {
        content += `${formatTodo(todo)}\n`
      })
    }

    return content
  }

  private readonly readTodos = (): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const fs = yield* FileSystem.FileSystem

        const fileExists = yield* fs
          .exists(this.filePath)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        if (!fileExists) {
          return []
        }

        const content = yield* fs
          .readFileString(this.filePath)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        if (!content.trim()) {
          return []
        }

        try {
          return this.parseMarkdownTodos(content)
        } catch (error) {
          return yield* Effect.fail(
            new TodoRepositoryError({
              cause: error
            })
          )
        }
      }.bind(this)
    ).pipe(Effect.provide(BunFileSystem.layer))

  private readonly writeTodos = (todos: readonly Todo[]): Effect.Effect<void, TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const fs = yield* FileSystem.FileSystem

        try {
          const markdownContent = this.generateMarkdownContent(todos)
          yield* fs
            .writeFileString(this.filePath, markdownContent)
            .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        } catch (error) {
          return yield* Effect.fail(
            new TodoRepositoryError({
              cause: error
            })
          )
        }
      }.bind(this)
    ).pipe(Effect.provide(BunFileSystem.layer))

  readonly findById = (id: TodoId): Effect.Effect<Todo, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const todos = yield* this.readTodos()
        const todo = todos.find((t: Todo) => TodoId.equals(t.id)(id))

        if (!todo) {
          return yield* Effect.fail(new TodoNotFoundError({ id }))
        }

        return todo
      }.bind(this)
    )

  readonly findAll = (): Effect.Effect<readonly Todo[], TodoRepositoryError, never> => this.readTodos()

  readonly save = (todo: Todo): Effect.Effect<Todo, TodoAlreadyExistsError | TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const todos = yield* this.readTodos()
        const existingIndex = todos.findIndex((t: Todo) => TodoId.equals(t.id)(todo.id))

        if (existingIndex >= 0) {
          return yield* Effect.fail(new TodoAlreadyExistsError({ id: todo.id }))
        }

        const updatedTodos = [...todos, todo]
        yield* this.writeTodos(updatedTodos)
        return todo
      }.bind(this)
    )

  readonly update = (todo: Todo): Effect.Effect<Todo, TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const todos = yield* this.readTodos()
        const updatedTodos = [...todos].map((existingTodo) => (existingTodo.id === todo.id ? todo : existingTodo))
        yield* this.writeTodos(updatedTodos)
        return todo
      }.bind(this)
    )

  readonly deleteById = (id: TodoId): Effect.Effect<void, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const todos = yield* this.readTodos()
        const todoIndex = todos.findIndex((t: Todo) => TodoId.equals(t.id)(id))

        if (todoIndex === -1) {
          return yield* Effect.fail(new TodoNotFoundError({ id }))
        }

        const updatedTodos = todos.filter((_: Todo, index: number) => index !== todoIndex)
        yield* this.writeTodos(updatedTodos)
      }.bind(this)
    )

  readonly findByStatus = (status: Todo["status"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const todos = yield* this.readTodos()
        return todos.filter((todo: Todo) => todo.status === status)
      }.bind(this)
    )

  readonly findByPriority = (priority: Todo["priority"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const todos = yield* this.readTodos()
        return todos.filter((todo: Todo) => todo.priority === priority)
      }.bind(this)
    )

  readonly count = (): Effect.Effect<number, TodoRepositoryError, never> =>
    Effect.gen(
      function* (this: MarkdownTodoRepository) {
        const todos = yield* this.readTodos()
        return todos.length
      }.bind(this)
    )
}

export const make = (filePath: string): TodoRepository => new MarkdownTodoRepository(filePath)
