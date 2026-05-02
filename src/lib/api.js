function normalizeApiBaseUrl(value) {
  if (!value) {
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
