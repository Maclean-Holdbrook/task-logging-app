import { useEffect, useState } from 'react'
import './App.css'
import {
  createTask,
  deleteTask,
  listTasks,
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

function FilterComboField({
  name,
  value,
  options,
  placeholder,
  isOpen,
  onInputChange,
  onToggle,
  onSelect,
}) {
  return (
    <div className="filter-combo">
      <div className="filter-input-wrap">
        <input
          name={name}
          value={value}
          onChange={onInputChange}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          className="filter-toggle"
          onClick={onToggle}
          aria-label={`Toggle ${name} options`}
          aria-expanded={isOpen}
        >
          v
        </button>
      </div>
      {isOpen ? (
        <div className="filter-menu">
          <button
            type="button"
            className="filter-option"
            onClick={() => onSelect('')}
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className="filter-option"
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function App() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState(emptyFilters)
  const [activeSection, setActiveSection] = useState('new')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      } catch (loadError) {
        if (ignore) {
          return
        }

        setTasks([])
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
    `${form.category} ${filters.category}`.trim(),
  )
  const priorityOptions = mergeOptions(
    defaultPriorityOptions,
    tasks.map((task) => task.priority),
    `${form.priority} ${filters.priority}`.trim(),
  )
  const statusOptions = mergeOptions(
    defaultStatusOptions,
    tasks.map((task) => task.status),
    `${form.status} ${filters.status}`.trim(),
  )

  function handleResetForm() {
    setForm(emptyForm)
    setEditingTaskId(null)
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
      if (editingTaskId) {
        const updated = await updateTask(editingTaskId, form)
        setTasks((currentTasks) =>
          currentTasks.map((task) => (task.id === editingTaskId ? updated : task)),
        )
      } else {
        const created = await createTask(form)
        setTasks((currentTasks) => [created, ...currentTasks])
      }

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
      if (editingTaskId === taskId) {
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
      if (editingTaskId === task.id) {
        handleResetForm()
      }
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

  function handleFilterOptionSelect(name, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
    setOpenMenu(null)
  }

  function handleFormOptionSelect(name, value) {
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setOpenMenu(null)
  }

  function handleEditTask(task) {
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      category: task.category,
      dueDate: task.dueDate || '',
    })
    setEditingTaskId(task.id)
    setActiveSection('new')
    setOpenMenu(null)
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
                    <FilterComboField
                      name="status"
                      value={form.status}
                      options={statusOptions}
                      placeholder="Type or choose status"
                      isOpen={openMenu === 'form-status'}
                      onInputChange={handleChange}
                      onToggle={() =>
                        setOpenMenu((current) =>
                          current === 'form-status' ? null : 'form-status',
                        )
                      }
                      onSelect={(value) => handleFormOptionSelect('status', value)}
                    />
                  </label>

                  <label>
                    <span>Priority</span>
                    <FilterComboField
                      name="priority"
                      value={form.priority}
                      options={priorityOptions}
                      placeholder="Type or choose priority"
                      isOpen={openMenu === 'form-priority'}
                      onInputChange={handleChange}
                      onToggle={() =>
                        setOpenMenu((current) =>
                          current === 'form-priority' ? null : 'form-priority',
                        )
                      }
                      onSelect={(value) => handleFormOptionSelect('priority', value)}
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <FilterComboField
                      name="category"
                      value={form.category}
                      options={categoryOptions}
                      placeholder="Type or choose category"
                      isOpen={openMenu === 'form-category'}
                      onInputChange={handleChange}
                      onToggle={() =>
                        setOpenMenu((current) =>
                          current === 'form-category' ? null : 'form-category',
                        )
                      }
                      onSelect={(value) => handleFormOptionSelect('category', value)}
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
                    {saving ? 'Saving...' : editingTaskId ? 'Save changes' : 'Create task'}
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
                    <FilterComboField
                      name="priority"
                      value={filters.priority}
                      options={priorityOptions}
                      placeholder="All priorities"
                      isOpen={openMenu === 'priority'}
                      onInputChange={handleFilterChange}
                      onToggle={() =>
                        setOpenMenu((current) =>
                          current === 'priority' ? null : 'priority',
                        )
                      }
                      onSelect={(value) => handleFilterOptionSelect('priority', value)}
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <FilterComboField
                      name="category"
                      value={filters.category}
                      options={categoryOptions}
                      placeholder="All categories"
                      isOpen={openMenu === 'category'}
                      onInputChange={handleFilterChange}
                      onToggle={() =>
                        setOpenMenu((current) =>
                          current === 'category' ? null : 'category',
                        )
                      }
                      onSelect={(value) => handleFilterOptionSelect('category', value)}
                    />
                  </label>

                  <label>
                    <span>Status</span>
                    <FilterComboField
                      name="status"
                      value={filters.status}
                      options={statusOptions}
                      placeholder="All statuses"
                      isOpen={openMenu === 'status'}
                      onInputChange={handleFilterChange}
                      onToggle={() =>
                        setOpenMenu((current) =>
                          current === 'status' ? null : 'status',
                        )
                      }
                      onSelect={(value) => handleFilterOptionSelect('status', value)}
                    />
                  </label>
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
                        onClick={() => handleEditTask(task)}
                        disabled={saving}
                      >
                        Edit
                      </button>
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
