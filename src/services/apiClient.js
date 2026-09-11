const API_BASE_URL = typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL 
  ? window.__ENV__.VITE_API_BASE_URL 
  : (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000')

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  try {
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: response.statusText }))
      return { data: null, error: errorBody.detail || `HTTP ${response.status}`, status: response.status, isFallback: true }
    }
    const data = await response.json()
    return { data, error: null, status: response.status, isFallback: false }
  } catch (err) {
    return { data: null, error: err.message, status: 0, isFallback: true }
  }
}
