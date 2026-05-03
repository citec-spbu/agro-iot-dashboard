export function safeArray(value) {
  return Array.isArray(value) ? value : []
}

export function hasPayload(payload) {
  return payload && typeof payload === 'object' && Object.keys(payload).length > 0
}

export function getDashboardStats(dashboard) {
  const stations = safeArray(dashboard?.stations)
  const totalStations = stations.length
  const onlineStations = stations.filter((item) => Boolean(item?.online)).length
  const offlineStations = totalStations - onlineStations
  const sensorsCount = stations.reduce((acc, item) => acc + safeArray(item?.sensors).length, 0)

  return {
    totalStations,
    onlineStations,
    offlineStations,
    sensorsCount,
  }
}

export function getStationName(station) {
  return station?.name || `Станция ${station?.hardware_id || ''}`.trim() || 'Станция'
}

export function isNotFoundError(error) {
  return error?.status === 404
}

export function normalizeStationResponse(response) {
  if (!response) return null
  if (response.station) return response.station
  return response
}

export function normalizeCreatedStation(response) {
  if (!response) return { station: null, coords_match_field: null }
  return {
    station: response.station || response,
    coords_match_field: response.coords_match_field ?? response.station?.coords_match_field ?? null,
  }
}

export function normalizeSensorIds(response) {
  const source = Array.isArray(response) ? response : safeArray(response?.sensors)
  return source
    .map((item) => {
      if (typeof item === 'number' || typeof item === 'string') return item
      return item?.sensor_id ?? item?.id ?? null
    })
    .filter((value) => value !== null && value !== undefined && value !== '')
}

export function isRecentIsoDate(value, maxAgeMs = 3600 * 1000) {
  if (!value) return false
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return false
  return Date.now() - time <= maxAgeMs
}
