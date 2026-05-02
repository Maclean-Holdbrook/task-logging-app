import { useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import {
  createTask,
  deleteTask,
  getTaskSummary,
  listTasks,
  seedTasks,
  updateTask,
} from './lib/tasks.js'

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  category: 'General',
  dueDate: '',
}

const heroImageUrl =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'

function App() {
  const [tasks, setTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [backendMode, setBackendMode] = useState('connecting')
  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    let ignore = false

    async function loadTasks() {
      setLoading(true)
      setError('')

      try {
        const response = await listTasks()

        if (ignore) {
          return
        }

        setTasks(response.tasks)
        setBackendMode(response.source === 'api' ? 'live' : 'fallback')
        setSelectedTaskId(response.tasks[0]?.id ?? null)
      } catch (loadError) {
        if (ignore) {
          return
        }

        setTasks(seedTasks)
        setBackendMode('fallback')
        setSelectedTaskId(seedTasks[0]?.id ?? null)
        setError(loadError.message)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadTasks()

    return () => {
      ignore = true
    }
  }, [])

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? null

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      statusFilter === 'all' ? true : task.status === statusFilter
    const searchText = `${task.title} ${task.description} ${task.category}`
      .toLowerCase()
      .trim()

    return (
      matchesStatus &&
      searchText.includes(deferredSearch.toLowerCase().trim())
    )
  })

  const summary = getTaskSummary(tasks)
  const isEditing = Boolean(form.id)

  function handleSelectTask(task) {
    setSelectedTaskId(task.id)
    setForm({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      category: task.category,
      dueDate: task.dueDate,
    })
  }

  function handleResetForm() {
    setForm(emptyForm)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (isEditing) {
        const updated = await updateTask(form.id, form)
        setTasks((currentTasks) =>
          currentTasks.map((task) => (task.id === updated.id ? updated : task)),
        )
        setSelectedTaskId(updated.id)
      } else {
        const created = await createTask(form)
        setTasks((currentTasks) => [created, ...currentTasks])
        setSelectedTaskId(created.id)
      }

      handleResetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(taskId) {
    setSaving(true)
    setError('')

    try {
      await deleteTask(taskId)
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      )

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null)
      }

      if (form.id === taskId) {
        handleResetForm()
      }
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickStatus(task) {
    setSaving(true)
    setError('')

    try {
      await deleteTask(task.id)
      setTasks((currentTasks) =>
        currentTasks.filter((item) => item.id !== task.id),
      )

      if (selectedTaskId === task.id) {
        setSelectedTaskId(null)
      }

      if (form.id === task.id) {
        handleResetForm()
      }
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div className="hero-copy-block">
          <p className="eyebrow">Task Logging Workspace</p>
          <h1>Know what got done, what is blocked, and what happens next.</h1>
          <p className="hero-copy">
            Taskk gives teams one clean place to log daily work, follow
            progress, and keep every update visible without long status
            meetings or scattered notes.
          </p>
          <div className="hero-actions">
            <a className="primary-button hero-link" href="#task-register">
              Start logging work
            </a>
            <a className="ghost-button hero-link" href="#overview">
              See how it works
            </a>
          </div>
          <div className="status-card-grid">
            <article className="status-card accent-blue">
              <span>Total tasks</span>
              <strong>{summary.total}</strong>
              <p>Everything currently being tracked in the workspace.</p>
            </article>
            <article className="status-card accent-amber">
              <span>In progress</span>
              <strong>{summary.inProgress}</strong>
              <p>Tasks that still need attention from the team.</p>
            </article>
            <article className="status-card accent-green">
              <span>Completed</span>
              <strong>{summary.completed}</strong>
              <p>Work that is done and ready to report.</p>
            </article>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={heroImageUrl}
            alt="Team members planning project tasks together around a laptop"
          />
          <div className="hero-visual-caption">
            <span>Built for clear updates</span>
            <strong>Less chasing. More visibility.</strong>
          </div>
        </div>
      </header>

      <section className="meta-bar" id="overview">
        <article className="meta-story">
          <p className="panel-kicker">Why clients like it</p>
          <h2>Everything important is easy to read.</h2>
          <p>
            Teams can record work, spot delays, and share progress in a format
            that makes sense at a glance.
          </p>
        </article>
        <div className="meta-story-grid">
          <article className="meta-note">
            <strong>Clear daily updates</strong>
            <p>Log what was done, what is ongoing, and what needs follow-up.</p>
          </article>
          <article className="meta-note">
            <strong>Simple progress view</strong>
            <p>See open and completed work without digging through messages.</p>
          </article>
          <article className="meta-note">
            <strong>Ready for reporting</strong>
            <p>Turn task activity into quick client or team status summaries.</p>
          </article>
        </div>
      </section>

      {error ? <div className="banner error">{error}</div> : null}
      {loading ? <div className="banner">Loading tasks...</div> : null}

      <main className="workspace-grid">
        <section className="panel" id="task-register">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Dashboard</p>
              <h2>Task register</h2>
            </div>
            <button type="button" className="ghost-button" onClick={handleResetForm}>
              New task
            </button>
          </div>

          <div className="task-toolbar">
            <div className="backend-pill client-pill">
              <span className={`backend-dot ${backendMode}`}></span>
              <strong>
                {backendMode === 'live'
                  ? 'Live project data'
                  : backendMode === 'fallback'
                    ? 'Demo preview data'
                    : 'Connecting to project data'}
              </strong>
            </div>
            <div className="meta-actions">
              <label>
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>
                <span>Search</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search title, category, or notes"
                />
              </label>
            </div>
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <h3>No tasks matched this view.</h3>
                <p>Try a different filter or add a new task entry.</p>
              </div>
            ) : null}

            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className={`task-card ${task.id === selectedTaskId ? 'selected' : ''}`}
              >
                <button
                  type="button"
                  className="task-card-main"
                  onClick={() => handleSelectTask(task)}
                >
                  <div className="task-card-heading">
                    <h3>{task.title}</h3>
                    <span className={`badge status-${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p>{task.description}</p>
                  <div className="task-card-meta">
                    <span>{task.category}</span>
                    <span>{task.priority} priority</span>
                    <span>Due {task.dueDate || 'not set'}</span>
                  </div>
                </button>
                <div className="task-card-actions">
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => handleQuickStatus(task)}
                    disabled={saving}
                  >
                    Complete and remove
                  </button>
                  <button
                    type="button"
                    className="inline-action danger"
                    onClick={() => handleDelete(task.id)}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Editor</p>
              <h2>{isEditing ? 'Update task' : 'Log a new task'}</h2>
            </div>
            {selectedTask ? (
              <span className="detail-chip">Selected: {selectedTask.title}</span>
            ) : null}
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <label>
              <span>Title</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Prepare weekly release notes"
                required
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                placeholder="Capture what was done, blockers, and follow-up."
              />
            </label>

            <div className="form-grid">
              <label>
                <span>Status</span>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label>
                <span>Priority</span>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label>
                <span>Category</span>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Operations"
                />
              </label>

              <label>
                <span>Due date</span>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create task'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleResetForm}
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default App
