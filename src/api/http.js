import axios from 'axios'

const defaultBaseURL =
  import.meta.env.VITE_IOT_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '/api/iot'
const envToken = import.meta.env.VITE_DEV_JWT || import.meta.env.VITE_DEV_AUTH_TOKEN || ''

let externalAuthorization = ''
let externalApiBase = ''

export const TOKEN_CHANGED_EVENT = 'agro-iot-token-changed'

function stripTrailingSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function normalizeToken(value) {
  return String(value || '').replace(/^Bearer\s+/i, '').trim()
}

function normalizeAuthorization(value) {
  const token = normalizeToken(value)
  return token ? `Bearer ${token}` : ''
}

function dispatchTokenChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TOKEN_CHANGED_EVENT, { detail: { hasToken: hasToken() } }))
}

function buildIotBaseUrl(apiBase) {
  const normalized = stripTrailingSlash(apiBase)
  if (!normalized) return defaultBaseURL
  if (normalized.endsWith('/api/iot')) return normalized
  if (normalized.endsWith('/api')) return `${normalized}/iot`
  return `${normalized}/api/iot`
}

function buildGatewayBaseUrl(apiBase) {
  const normalized = stripTrailingSlash(apiBase)
  if (!normalized) return ''
  if (normalized.endsWith('/api/iot')) return normalized.slice(0, -'/api/iot'.length)
  if (normalized.endsWith('/api')) return normalized.slice(0, -'/api'.length)
  return normalized
}

export function setExternalAuth(payload = {}) {
  externalAuthorization = normalizeAuthorization(payload.authorization)
  externalApiBase = stripTrailingSlash(payload.apiBase)

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('host-dark', Boolean(payload.dark))
  }

  dispatchTokenChanged()
}

export function clearExternalAuth() {
  externalAuthorization = ''
  externalApiBase = ''
  dispatchTokenChanged()
}

export function getExternalAuthorization() {
  return externalAuthorization
}

export function getActiveAuthorization() {
  return externalAuthorization || normalizeAuthorization(envToken)
}

export function hasToken() {
  return Boolean(getActiveAuthorization())
}

export const http = axios.create({
  baseURL: defaultBaseURL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const runtimeBaseURL = buildIotBaseUrl(externalApiBase)
  config.baseURL = runtimeBaseURL

  const authorization = getActiveAuthorization()
  if (authorization) {
    config.headers.Authorization = authorization
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
)

export function normalizeApiError(error) {
  const status = error?.response?.status || null
  const data = error?.response?.data || null
  const detail = data?.detail ?? data?.message ?? data ?? error?.message

  const normalized = new Error(buildMessage(status, detail, error))
  normalized.status = status
  normalized.detail = detail
  normalized.data = data
  normalized.original = error
  normalized.isNetworkError = !error?.response

  return normalized
}

function buildMessage(status, detail, error) {
  if (!status) {
    if (error?.code === 'ECONNABORTED') {
      return 'Сервис датчиков не ответил вовремя. Попробуйте снова или обратитесь к администратору.'
    }

    return 'Сервис датчиков недоступен. Проверьте подключение к интернету или обратитесь к администратору, если проблема сохраняется.'
  }

  if (status === 401) {
    return 'Авторизация не получена. Откройте IoT-модуль через основной Smart.Agromelio или войдите заново.'
  }

  if (status === 403) {
    return 'У вас нет доступа к этим данным. Проверьте, что вы вошли в нужную организацию.'
  }

  if (status === 404) {
    return extractDetail(detail) || 'Данные не найдены. Возможно, станция ещё не зарегистрирована или по ней пока нет измерений.'
  }

  if (status === 409) {
    return duplicateMessage(detail)
  }

  if (status === 422) {
    return formatValidationError(detail)
  }

  if (status >= 500) {
    return extractDetail(detail) || 'Ошибка сервиса датчиков. Пожалуйста, попробуйте позже или обратитесь к администратору.'
  }

  return extractDetail(detail) || `Не удалось выполнить запрос. Код ошибки: ${status}`
}

function duplicateMessage(detail) {
  const text = extractDetail(detail).toLowerCase()

  if (text.includes('hardware')) {
    return 'Станция с таким серийным номером уже зарегистрирована.'
  }

  if (text.includes('field')) {
    return 'Для этого поля уже зарегистрирована метеостанция.'
  }

  return extractDetail(detail) || 'Такая станция уже зарегистрирована.'
}

function formatValidationError(detail) {
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const loc = Array.isArray(item.loc) ? item.loc.join('.') : ''
        return `${loc ? `${loc}: ` : ''}${item.msg || 'ошибка валидации'}`
      })
      .join('; ')
  }

  return extractDetail(detail) || 'Проверьте правильность заполнения формы.'
}

function extractDetail(detail) {
  if (!detail) return ''
  if (typeof detail === 'string') return detail
  if (typeof detail === 'object' && typeof detail.detail === 'string') return detail.detail

  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

export function getErrorMessage(error) {
  const status = error?.status ? `Код ошибки: ${error.status}. ` : ''
  return `${status}${error?.message || 'Неизвестная ошибка'}`
}

export function getApiBaseUrl() {
  return buildIotBaseUrl(externalApiBase)
}

export function getGatewayBaseUrl() {
  return buildGatewayBaseUrl(externalApiBase || defaultBaseURL)
}
