import { Console, Effect } from "effect"
import { type PRIORITY_ARRAY, PRIORITY_VALUES } from "../domain/todo/PriorityConstants.js"
import { type AddTodoCommand, addTodo } from "../operations/AddTodo.js"
import { getTodos } from "../operations/ListTodos.js"
import { removeTodos } from "../operations/RemoveTodo.js"
import type { UpdateTodoCommand } from "../operations/UpdateTodo.js"
import { updateTodo } from "../operations/UpdateTodo.js"

export interface AddTodoArgs {
  title: string
  description?: string
  priority?: (typeof PRIORITY_ARRAY)[number]
  dueDate?: string
}

export interface UpdateTodoArgs {
  id: string
  title?: string
  description?: string
  priority?: (typeof PRIORITY_ARRAY)[number]
  dueDate?: string
}

export interface RemoveTodoArgs {
  ids: string[]
}

export interface CompleteTodoArgs {
  ids: string[]
}

export const addTodoWithArgs = (args: AddTodoArgs) =>
  Effect.gen(function* () {
    let dueDate: Date | undefined
    if (args.dueDate && args.dueDate.trim() !== "") {
      dueDate = new Date(args.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        yield* Console.log(`Invalid due date format: ${args.dueDate}. Please use YYYY-MM-DD format.`)
        return
      }
    }

    const command: AddTodoCommand = {
      title: args.title,
      description: args.description || "",
      priority: args.priority || PRIORITY_VALUES.MEDIUM,
      ...(dueDate ? { dueDate } : {})
    }

    const result = yield* addTodo(command)
    yield* Console.log(`Todo added: ${result.title}`)
    return result
  })

export const listTodosWithArgs = () =>
  Effect.gen(function* () {
    const todos = yield* getTodos()
    if (todos.length === 0) {
      yield* Console.log("No todos found!")
      return []
    }
    yield* Effect.forEach(todos, (todo) => {
      const priorityEmoji = todo.priority === "high" ? "🔴 " : todo.priority === "medium" ? "🟡 " : "🟢 "
      return Console.log(`${priorityEmoji}${todo.title}, ${todo.status}`)
    })
    return todos
  })

export const updateTodoWithArgs = (args: UpdateTodoArgs) =>
  Effect.gen(function* () {
    const changes: UpdateTodoCommand["changes"] = {}

    if (args.title !== undefined) changes.title = args.title
    if (args.description !== undefined) changes.description = args.description
    if (args.priority !== undefined) changes.priority = args.priority
    if (args.dueDate !== undefined) {
      const dueDate = new Date(args.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        yield* Console.log(`Invalid due date format: ${args.dueDate}. Please use YYYY-MM-DD format.`)
        return
      }
      changes.dueDate = dueDate
    }

    const updatedTodo = yield* updateTodo({
      id: args.id,
      changes
    })

    yield* Console.log(`Todo updated successfully: ${updatedTodo.title}`)
    return updatedTodo
  })

export const removeTodosWithArgs = (args: RemoveTodoArgs) =>
  Effect.gen(function* () {
    if (args.ids.length === 0) {
      yield* Console.log("No todo IDs provided.")
      return
    }

    const todos = yield* getTodos()
    const selectedTodos = todos.filter((todo) => args.ids.includes(todo.id))

    if (selectedTodos.length === 0) {
      yield* Console.log("No matching todos found.")
      return
    }

    yield* Console.log(`\nRemoving ${selectedTodos.length} todos:`)
    yield* Effect.forEach(selectedTodos, (todo) => Console.log(`- ${todo.title}`))

    yield* removeTodos({
      ids: args.ids
    })

    yield* Console.log(`${selectedTodos.length} todos removed successfully.`)
  })

export const completeTodosWithArgs = (args: CompleteTodoArgs) =>
  Effect.gen(function* () {
    if (args.ids.length === 0) {
      yield* Console.log("No todo IDs provided.")
      return
    }

    const todos = yield* getTodos()
    const selectedTodos = todos.filter((todo) => args.ids.includes(todo.id))

    if (selectedTodos.length === 0) {
      yield* Console.log("No matching todos found.")
      return
    }

    yield* Effect.forEach(selectedTodos, (todo) =>
      updateTodo({
        id: todo.id,
        changes: { status: "completed" }
      })
    )

    yield* Console.log(`${selectedTodos.length} todos completed successfully.`)
  })
