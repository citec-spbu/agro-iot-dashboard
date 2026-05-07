import axios from 'axios'
import { getActiveAuthorization, getGatewayBaseUrl, normalizeApiError } from './http'

function fieldsBaseUrl() {
  const gatewayBaseUrl = getGatewayBaseUrl()
  return `${gatewayBaseUrl}/api/fields-service`
}

function authHeaders() {
  const authorization = getActiveAuthorization()
  return authorization ? { Authorization: authorization, Accept: 'application/json' } : { Accept: 'application/json' }
}

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function fieldIdOf(field) {
  return field?.id ?? field?.field_id ?? field?.fieldId ?? null
}

function fieldNameOf(field) {
  return field?.name ?? field?.fieldName ?? field?.title ?? ''
}

function seasonNameOf(season) {
  return season?.name ?? season?.seasonName ?? season?.title ?? ''
}

function normalizeFieldDirectory(seasonsResponse) {
  const seasons = safeArray(seasonsResponse)
  const byKey = new Map()

  for (const season of seasons) {
    for (const field of safeArray(season?.fields)) {
      const field_id = fieldIdOf(field)
      if (!field_id) continue

      const key = `${season?.id || ''}:${field_id}`
      if (byKey.has(key)) continue

      byKey.set(key, {
        field_id,
        field_name: fieldNameOf(field),
        season_id: season?.id ?? null,
        season_name: seasonNameOf(season),
        contours_count: safeArray(field?.contours).length,
      })
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const seasonCompare = String(a.season_name || '').localeCompare(String(b.season_name || ''), 'ru')
    if (seasonCompare !== 0) return seasonCompare
    return String(a.field_name || a.field_id).localeCompare(String(b.field_name || b.field_id), 'ru')
  })
}

export async function listFieldDirectory() {
  try {
    const { data } = await axios.get(`${fieldsBaseUrl()}/seasons/full`, {
      headers: authHeaders(),
      timeout: 20000,
    })
    return normalizeFieldDirectory(data)
  } catch (error) {
    throw normalizeApiError(error)
  }
}