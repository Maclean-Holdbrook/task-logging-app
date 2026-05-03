const HOSTED_API_BASE_URL = 'https://task-logging-app-backend-tfm4.vercel.app/api'

function normalizeApiBaseUrl(value) {
  if (!value) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return HOSTED_API_BASE_URL
    }

    return 'http://localhost:4000/api'
  }

  const trimmedValue = value.trim().replace(/\/$/, '')

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  if (trimmedValue.startsWith('//')) {
    return `https:${trimmedValue}`
  }

  return `https://${trimmedValue}`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const payload = await response.json()
      message = payload.message || payload.error || message
    } catch {
      // Keep the status-derived message when the response body is not JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export { API_BASE_URL, request }
