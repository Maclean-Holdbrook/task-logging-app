import { request } from './api.js'

const seedTasks = [
  {
    id: 'task-101',
    title: 'Map frontend API contract',
    description:
      'Define the task payload shape and the endpoints the backend will expose.',
    status: 'in_progress',
    priority: 'high',
    category: 'Planning',
    dueDate: '2026-05-03',
  },
  {
    id: 'task-102',
    title: 'Design Supabase schema',
    description:
      'Create the first-pass tasks table and row-level security rules.',
    status: 'pending',
    priority: 'medium',
    category: 'Database',
    dueDate: '2026-05-05',
  },
  {
    id: 'task-103',
    title: 'Expose MCP task tools',
    description:
      'Prepare list, create, update, and complete tools in the backend service.',
    status: 'completed',
    priority: 'high',
    category: 'MCP',
    dueDate: '2026-05-01',
  },
]

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title?.trim() || 'Untitled task',
    description: task.description?.trim() || '',
    status: task.status || 'pending',
    priority: task.priority || 'medium',
    category: task.category?.trim() || 'General',
    dueDate: task.dueDate || task.due_date || '',
  }
}

async function listTasks() {
  try {
    const payload = await request('/tasks')
    const tasks = Array.isArray(payload) ? payload : payload.tasks

    return {
      tasks: (tasks || []).map(normalizeTask),
      source: 'api',
    }
  } catch {
    return {
      tasks: seedTasks,
      source: 'fallback',
    }
  }
}

async function createTask(taskInput) {
  const payload = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskInput),
  })

  return normalizeTask(payload.task || payload)
}

async function updateTask(taskId, updates) {
  const payload = await request(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })

  return normalizeTask(payload.task || payload)
}

async function deleteTask(taskId) {
  await request(`/tasks/${taskId}`, {
    method: 'DELETE',
  })

  return taskId
}

function getTaskSummary(tasks) {
  return tasks.reduce(
    (summary, task) => {
      summary.total += 1

      if (task.status === 'in_progress') {
        summary.inProgress += 1
      }

      if (task.status === 'completed') {
        summary.completed += 1
      }

      return summary
    },
    {
      total: 0,
      inProgress: 0,
      completed: 0,
    },
  )
}

export {
  createTask,
  deleteTask,
  getTaskSummary,
  listTasks,
  seedTasks,
  updateTask,
}
