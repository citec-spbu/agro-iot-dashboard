import { http } from './http'
import { toApiDateTime } from '../utils/dates'

const DASHBOARD_FALLBACK_ERROR_FIELD = '__dashboard_fallback_error'

function encode(value) {
  return encodeURIComponent(String(value))
}

function periodParams(dateFrom, dateTo) {
  return {
    date_from: typeof dateFrom === 'string' ? dateFrom : toApiDateTime(dateFrom),
    date_to: typeof dateTo === 'string' ? dateTo : toApiDateTime(dateTo),
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function isRecentIsoDate(value, maxAgeMs = 3600 * 1000) {
  if (!value) return false
  const time = new Date(value).getTime()
  return Number.isFinite(time) && Date.now() - time <= maxAgeMs
}

function dashboardFallbackWarning(error) {
  const status = error?.status ? `HTTP ${error.status}` : 'network error'
  return `Основной обзор временно недоступен, поэтому данные загружены по отдельным станциям. Часть информации может отображаться с задержкой.`
}

export async function getDashboard() {
  try {
    const { data } = await http.get('/dashboard')
    return data
  } catch (error) {
    return buildDashboardFromStations(error)
  }
}

async function buildDashboardFromStations(dashboardError) {
  const stations = await listStations()
  const items = await Promise.all(safeArray(stations).map(buildStationOverview))
  return {
    stations: items,
    [DASHBOARD_FALLBACK_ERROR_FIELD]: dashboardFallbackWarning(dashboardError),
  }
}

async function buildStationOverview(station) {
  const fieldId = station?.field_id
  if (!fieldId) {
    return {
      station,
      online: isRecentIsoDate(station?.last_seen_at),
      last_data: null,
      last_data_at: null,
      sensors: [],
    }
  }

  const [lastResult, sensorIdsResult] = await Promise.allSettled([
    getStationLast(fieldId),
    listSensors(fieldId),
  ])

  const sensors = sensorIdsResult.status === 'fulfilled'
    ? await Promise.all(safeArray(sensorIdsResult.value).map((sensorId) => buildSensorOverview(fieldId, sensorId)))
    : []

  const last = lastResult.status === 'fulfilled' ? lastResult.value : null

  return {
    station,
    online: isRecentIsoDate(station?.last_seen_at),
    last_data: last?.payload || null,
    last_data_at: last?.date_time || null,
    sensors,
  }
}

async function buildSensorOverview(fieldId, sensorId) {
  const lastResult = await Promise.allSettled([getSensorLast(fieldId, sensorId)])
  const last = lastResult[0]?.status === 'fulfilled' ? lastResult[0].value : null
  return {
    sensor_id: Number(sensorId),
    last_data: last?.payload || null,
    last_data_at: last?.date_time || null,
  }
}

export function getDashboardFallbackWarning(dashboard) {
  return dashboard?.[DASHBOARD_FALLBACK_ERROR_FIELD] || ''
}

export async function listStations() {
  const { data } = await http.get('/stations')
  return data
}

export async function registerStation(payload) {
  const { data } = await http.post('/stations', payload)
  return data
}

export async function getStation(fieldId) {
  const { data } = await http.get(`/stations/${encode(fieldId)}`)
  return data
}

export async function updateStation(fieldId, payload) {
  const { data } = await http.put(`/stations/${encode(fieldId)}`, payload)
  return data
}

export async function deleteStation(fieldId) {
  await http.delete(`/stations/${encode(fieldId)}`)
}

export async function getStationsOnField(fieldId) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/stations`)
  return data
}

export async function getStationLast(fieldId) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/data/last`)
  return data
}

export async function getStationHistory(fieldId, dateFrom, dateTo) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/data/history`, {
    params: periodParams(dateFrom, dateTo),
  })
  return data
}

export async function getStationSummary(fieldId, dateFrom, dateTo) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/data/summary`, {
    params: periodParams(dateFrom, dateTo),
  })
  return data
}

export async function listSensors(fieldId) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/sensors`)
  return data
}

export async function getSensorLast(fieldId, sensorId) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/sensors/${encode(sensorId)}/data/last`)
  return data
}

export async function getSensorHistory(fieldId, sensorId, dateFrom, dateTo) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/sensors/${encode(sensorId)}/data/history`, {
    params: periodParams(dateFrom, dateTo),
  })
  return data
}

export async function getSensorSummary(fieldId, sensorId, dateFrom, dateTo) {
  const { data } = await http.get(`/fields/${encode(fieldId)}/sensors/${encode(sensorId)}/data/summary`, {
    params: periodParams(dateFrom, dateTo),
  })
  return data
}
