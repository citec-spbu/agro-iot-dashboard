import { setExternalAuth } from './http'

export const IOT_READY_MESSAGE = 'AGRO_IOT_READY'
export const IOT_AUTH_MESSAGE = 'AGRO_IOT_AUTH'

function normalizeOrigin(value) {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

function envAllowedOrigins() {
  return String(import.meta.env.VITE_ALLOWED_PARENT_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter(Boolean)
}

function getExpectedParentOrigin() {
  if (typeof document !== 'undefined' && document.referrer) {
    const referrerOrigin = normalizeOrigin(document.referrer)
    if (referrerOrigin) return referrerOrigin
  }
  return ''
}

function getAllowedParentOrigins() {
  const origins = new Set(envAllowedOrigins())
  const expectedParentOrigin = getExpectedParentOrigin()
  if (expectedParentOrigin) origins.add(expectedParentOrigin)

  if (typeof window !== 'undefined' && window.location?.origin) {
    origins.add(window.location.origin)
  }

  origins.add('http://localhost:9000')
  origins.add('http://127.0.0.1:9000')
  origins.add('http://localhost:8080')
  origins.add('http://127.0.0.1:8080')

  return origins
}

function isAllowedParentOrigin(origin) {
  if (!origin) return false
  return getAllowedParentOrigins().has(origin)
}

function parentTargetOrigin() {
  const expectedParentOrigin = getExpectedParentOrigin()
  if (expectedParentOrigin) return expectedParentOrigin
  return envAllowedOrigins()[0] || ''
}

export function sendReadyToParent() {
  if (typeof window === 'undefined' || window.parent === window) {
    return
  }

  const targetOrigin = parentTargetOrigin()
  if (!targetOrigin) return

  window.parent.postMessage(
    {
      type: IOT_READY_MESSAGE,
    },
    targetOrigin,
  )
}

export function installHostBridge() {
  if (typeof window === 'undefined') {
    return
  }

  function onMessage(event) {
    if (!event.data || event.data.type !== IOT_AUTH_MESSAGE) {
      return
    }

    if (!isAllowedParentOrigin(event.origin)) {
      return
    }

    setExternalAuth(event.data.payload || {})
  }

  window.addEventListener('message', onMessage)
  sendReadyToParent()
  window.setTimeout(sendReadyToParent, 250)
  window.setTimeout(sendReadyToParent, 1000)
}
