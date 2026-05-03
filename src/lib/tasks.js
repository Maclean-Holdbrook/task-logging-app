import { request } from './api.js'

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title?.trim() || 'Untitled task',
    description: task.description?.trim() || '',
    status: task.status || 'pending',
    priority: task.priority || 'medium',
    category: task.category?.trim() || 'General',
    dueDate: task.dueDate || task.due_date || '',
    completedAt: task.completedAt || task.completed_at || '',
    outcome: task.outcome?.trim() || '',
    impact: task.impact?.trim() || '',
    project: task.project?.trim() || '',
    client: task.client?.trim() || '',
    tags: Array.isArray(task.tags) ? task.tags : [],
    createdAt: task.createdAt || task.created_at || '',
    updatedAt: task.updatedAt || task.updated_at || '',
  }
}

async function listTasks() {
  const payload = await request('/tasks')
  const tasks = Array.isArray(payload) ? payload : payload.tasks

  return {
    tasks: (tasks || []).map(normalizeTask),
    pagination: payload?.pagination || null,
    source: 'api',
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

export { createTask, deleteTask, getTaskSummary, listTasks, updateTask }
