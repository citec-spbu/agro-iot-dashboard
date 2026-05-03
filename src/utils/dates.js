const pad = (value) => String(value).padStart(2, '0')

export function toApiDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('')
}

export function toInputDateTime(value) {
  const apiValue = toApiDateTime(value)
  return apiValue ? apiValue.slice(0, 16) : ''
}

export function getDefaultPeriod(days = 1) {
  const dateTo = new Date()
  const dateFrom = new Date(dateTo)
  dateFrom.setDate(dateFrom.getDate() - days)
  return { dateFrom, dateTo }
}

export function getPresetPeriod(preset) {
  if (preset === '24h') return getDefaultPeriod(1)
  if (preset === '7d') return getDefaultPeriod(7)
  if (preset === '30d') return getDefaultPeriod(30)
  return getDefaultPeriod(1)
}

export function getPeriodLengthDays(dateFrom, dateTo) {
  const from = new Date(dateFrom)
  const to = new Date(dateTo)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000))
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export function formatShortDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ru-RU', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function sortByDateTimeAsc(rows = []) {
  return [...rows].sort((a, b) => new Date(a?.date_time || 0) - new Date(b?.date_time || 0))
}
