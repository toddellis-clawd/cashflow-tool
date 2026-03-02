const PREFIX = 'cashflow_'

export function getData(key, fallback = []) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function setData(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function generateId() {
  return crypto.randomUUID()
}
