import { useEffect, useState } from 'react'
import './App.css'
import {
  createTask,
  deleteTask,
  listTasks,
} from './lib/tasks.js'

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  category: 'General',
  dueDate: '',
}

const emptyFilters = {
  enteredDate: '',
  priority: '',
  category: '',
  status: '',
}

const defaultPriorityOptions = ['low', 'medium', 'high', 'urgent']
const defaultStatusOptions = [
  'pending',
  'in_progress',
  'completed',
  'archived',
  'blocked',
]
const defaultCategoryOptions = [
  'General',
  'Operations',
  'Planning',
  'Database',
  'Design',
  'Development',
  'Testing',
  'MCP',
  'Marketing',
  'Finance',
  'Support',
  'Research',
]

function formatEnteredDate(value) {
  if (!value) {
    return 'Unknown'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeDateValue(value) {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

function normalizeTextValue(value) {
  return value.trim().toLowerCase()
}

function mergeOptions(defaultOptions, taskValues, currentValue) {
  return Array.from(
    new Set([...defaultOptions, ...taskValues.filter(Boolean), currentValue].filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right))
}

function isKnownOption(value, options) {
  return options.includes(value)
}

function SelectField({ name, value, onChange, options, allLabel, customLabel }) {
  return (
    <div className="select-field">
      <select name={name} value={value} onChange={onChange}>
        {allLabel ? <option value="__all__">{allLabel}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="__custom__">{customLabel}</option>
      </select>
      <span className="select-arrow" aria-hidden="true">
        v
      </span>
    </div>
  )
}

function App() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState(emptyFilters)
  const [activeSection, setActiveSection] = useState('new')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [backendMode, setBackendMode] = useState('connecting')

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
      } catch (loadError) {
        if (ignore) {
          return
        }

        setTasks([])
        setBackendMode('fallback')
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

  const filteredTasks = tasks.filter((task) => {
    const matchesDate =
      !filters.enteredDate
        ? true
        : normalizeDateValue(task.createdAt) === filters.enteredDate
    const matchesPriority =
      !filters.priority
        ? true
        : normalizeTextValue(task.priority) === normalizeTextValue(filters.priority)
    const matchesCategory =
      !filters.category
        ? true
        : normalizeTextValue(task.category) === normalizeTextValue(filters.category)
    const matchesStatus =
      !filters.status
        ? true
        : normalizeTextValue(task.status) === normalizeTextValue(filters.status)

    return matchesDate && matchesPriority && matchesCategory && matchesStatus
  })

  const categoryOptions = mergeOptions(
    defaultCategoryOptions,
    tasks.map((task) => task.category),
    form.category,
  )
  const priorityOptions = mergeOptions(
    defaultPriorityOptions,
    tasks.map((task) => task.priority),
    form.priority,
  )
  const statusOptions = mergeOptions(
    defaultStatusOptions,
    tasks.map((task) => task.status),
    form.status,
  )

  function handleResetForm() {
    setForm(emptyForm)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function handleFormSelectChange(event, options) {
    const { name, value } = event.target

    if (value === '__custom__') {
      setForm((currentForm) => ({
        ...currentForm,
        [name]: isKnownOption(currentForm[name], options) ? '' : currentForm[name],
      }))
      return
    }

    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const created = await createTask(form)
      setTasks((currentTasks) => [created, ...currentTasks])

      handleResetForm()
      setActiveSection('tasks')
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
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setSaving(false)
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
  }

  function handleFilterSelectChange(event, options) {
    const { name, value } = event.target

    if (value === '__all__') {
      setFilters((currentFilters) => ({ ...currentFilters, [name]: '' }))
      return
    }

    if (value === '__custom__') {
      setFilters((currentFilters) => ({
        ...currentFilters,
        [name]: isKnownOption(currentFilters[name], options)
          ? ''
          : currentFilters[name],
      }))
      return
    }

    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
  }

  return (
    <div className="app-shell">
      <main className="mobile-shell">
        <section className="landing-panel">
          <div className="section-switcher" role="tablist" aria-label="Task sections">
            <button
              type="button"
              className={`section-tab ${activeSection === 'new' ? 'active' : ''}`}
              onClick={() => setActiveSection('new')}
            >
              New
            </button>
            <button
              type="button"
              className={`section-tab ${activeSection === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveSection('tasks')}
            >
              Tasks
            </button>
          </div>

          <div className="status-strip">
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
          </div>

          {error ? <div className="banner error">{error}</div> : null}
          {loading ? <div className="banner">Loading tasks...</div> : null}

          {activeSection === 'new' ? (
            <section className="panel" aria-label="New task form">
              <div className="panel-header compact">
                <div>
                  <p className="panel-kicker">New</p>
                  <h1>Log new task</h1>
                </div>
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
                    <SelectField
                      name="status"
                      value={
                        isKnownOption(form.status, statusOptions)
                          ? form.status
                          : '__custom__'
                      }
                      onChange={(event) => handleFormSelectChange(event, statusOptions)}
                      options={statusOptions}
                      customLabel="Custom status"
                    />
                  </label>
                  {!isKnownOption(form.status, statusOptions) ? (
                    <label className="custom-input-row">
                      <span>Custom status</span>
                      <input
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        placeholder="waiting_review"
                      />
                    </label>
                  ) : null}

                  <label>
                    <span>Priority</span>
                    <SelectField
                      name="priority"
                      value={
                        isKnownOption(form.priority, priorityOptions)
                          ? form.priority
                          : '__custom__'
                      }
                      onChange={(event) => handleFormSelectChange(event, priorityOptions)}
                      options={priorityOptions}
                      customLabel="Custom priority"
                    />
                  </label>
                  {!isKnownOption(form.priority, priorityOptions) ? (
                    <label className="custom-input-row">
                      <span>Custom priority</span>
                      <input
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        placeholder="critical"
                      />
                    </label>
                  ) : null}

                  <label>
                    <span>Category</span>
                    <SelectField
                      name="category"
                      value={
                        isKnownOption(form.category, categoryOptions)
                          ? form.category
                          : '__custom__'
                      }
                      onChange={(event) => handleFormSelectChange(event, categoryOptions)}
                      options={categoryOptions}
                      customLabel="Custom category"
                    />
                  </label>
                  {!isKnownOption(form.category, categoryOptions) ? (
                    <label className="custom-input-row">
                      <span>Custom category</span>
                      <input
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        placeholder="Partnerships"
                      />
                    </label>
                  ) : null}

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
                    {saving ? 'Saving...' : 'Create task'}
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
          ) : (
            <section className="panel" aria-label="Task list">
              <div className="panel-header compact">
                <div>
                  <p className="panel-kicker">Tasks</p>
                  <h1>All tasks</h1>
                </div>
              </div>

              <div className="task-toolbar">
                <div className="filter-grid">
                  <label>
                    <span>Date entered</span>
                    <input
                      type="date"
                      name="enteredDate"
                      value={filters.enteredDate}
                      onChange={handleFilterChange}
                    />
                  </label>

                  <label>
                    <span>Priority</span>
                    <SelectField
                      name="priority"
                      value={
                        !filters.priority
                          ? '__all__'
                          : isKnownOption(filters.priority, priorityOptions)
                            ? filters.priority
                            : '__custom__'
                      }
                      onChange={(event) => handleFilterSelectChange(event, priorityOptions)}
                      options={priorityOptions}
                      allLabel="All priorities"
                      customLabel="Custom priority"
                    />
                  </label>
                  {!filters.priority || isKnownOption(filters.priority, priorityOptions) ? null : (
                    <label className="custom-input-row">
                      <span>Custom priority</span>
                      <input
                        name="priority"
                        value={filters.priority}
                        onChange={handleFilterChange}
                        placeholder="critical"
                      />
                    </label>
                  )}

                  <label>
                    <span>Category</span>
                    <SelectField
                      name="category"
                      value={
                        !filters.category
                          ? '__all__'
                          : isKnownOption(filters.category, categoryOptions)
                            ? filters.category
                            : '__custom__'
                      }
                      onChange={(event) => handleFilterSelectChange(event, categoryOptions)}
                      options={categoryOptions}
                      allLabel="All categories"
                      customLabel="Custom category"
                    />
                  </label>
                  {!filters.category || isKnownOption(filters.category, categoryOptions) ? null : (
                    <label className="custom-input-row">
                      <span>Custom category</span>
                      <input
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        placeholder="Partnerships"
                      />
                    </label>
                  )}

                  <label>
                    <span>Status</span>
                    <SelectField
                      name="status"
                      value={
                        !filters.status
                          ? '__all__'
                          : isKnownOption(filters.status, statusOptions)
                            ? filters.status
                            : '__custom__'
                      }
                      onChange={(event) => handleFilterSelectChange(event, statusOptions)}
                      options={statusOptions}
                      allLabel="All statuses"
                      customLabel="Custom status"
                    />
                  </label>
                  {!filters.status || isKnownOption(filters.status, statusOptions) ? null : (
                    <label className="custom-input-row">
                      <span>Custom status</span>
                      <input
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        placeholder="waiting_review"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="task-list">
                {filteredTasks.length === 0 ? (
                  <div className="empty-state">
                    <h3>No tasks matched this view.</h3>
                    <p>Try a different filter in the Tasks section.</p>
                  </div>
                ) : null}

                {filteredTasks.map((task) => (
                  <article key={task.id} className="task-card">
                    <div className="task-card-main">
                      <div className="task-card-heading">
                        <h3>{task.title}</h3>
                        <span className={`badge status-${task.status}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p>{task.description}</p>
                      <div className="task-card-meta">
                        <span>Entered {formatEnteredDate(task.createdAt)}</span>
                        <span>{task.priority} priority</span>
                        <span>{task.category}</span>
                        <span>Due {task.dueDate || 'not set'}</span>
                      </div>
                    </div>
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
          )}
        </section>
      </main>
    </div>
  )
}

export default App
