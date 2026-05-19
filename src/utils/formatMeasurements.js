const METRIC_LABELS = {
  temperature: 'Температура станции',
  soil_moisture: 'Влажность станции',
  wind_speed: 'Скорость ветра',
  wind_direction: 'Направление ветра',
  rain: 'Осадки',
  temperaturea: 'Температура на поверхности',
  soil_moisturea: 'Влажность на поверхности',
  temperaturez: 'Температура под землёй',
  soil_moisturez: 'Влажность под землёй',
}

const METRIC_UNITS = {
  temperature: '°F',
  soil_moisture: '%',
  wind_speed: 'км/ч',
  wind_direction: '°',
  rain: 'мм',
  temperaturea: '',
  soil_moisturea: '%',
  temperaturez: '',
  soil_moisturez: '%',
}

const METRIC_DIGITS = {
  temperature: 1,
  soil_moisture: 1,
  wind_speed: 1,
  wind_direction: 1,
  rain: 1,
  temperaturea: 1,
  soil_moisturea: 1,
  temperaturez: 1,
  soil_moisturez: 1,
}

export const STATION_METRICS = ['temperature', 'soil_moisture', 'wind_speed', 'wind_direction', 'rain']
export const SENSOR_METRICS = ['temperaturea', 'soil_moisturea', 'temperaturez', 'soil_moisturez']
export const LEGACY_SENSOR_METRICS = ['temperature', 'soil_moisture']

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function asNumber(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function decimal(value, digits = 1) {
  return Number(value).toFixed(digits)
}

function metricResult({ label, value, unit, raw, isConverted, hint = '' }) {
  return {
    label,
    value: value === null || value === undefined || value === '' ? '—' : String(value),
    unit: unit || '',
    raw,
    isConverted: Boolean(isConverted),
    hint,
  }
}

function formatDirect(metricName, raw) {
  const value = asNumber(raw)
  const unit = METRIC_UNITS[metricName] || ''
  const label = METRIC_LABELS[metricName] || metricName
  const digits = METRIC_DIGITS[metricName] ?? 1

  if (!isFiniteNumber(value)) {
    return metricResult({ label, value: '—', unit, raw, isConverted: false })
  }

  return metricResult({
    label,
    value: decimal(value, digits),
    unit,
    raw,
    isConverted: false,
  })
}

export function formatMetric(metricName, raw) {
  return formatDirect(metricName, raw)
}

export function metricToNumber(metric) {
  const value = Number(metric?.value)
  return Number.isFinite(value) ? value : null
}

export function getMetricLabel(metricName) {
  return METRIC_LABELS[metricName] || metricName
}

export function getMetricUnit(metricName) {
  return METRIC_UNITS[metricName] || ''
}

export function availableMetrics(payload, preferredMetrics) {
  const source = payload && typeof payload === 'object' ? payload : {}
  return preferredMetrics.filter((name) => Object.prototype.hasOwnProperty.call(source, name))
}

export function sensorMetricNames(payload) {
  const names = availableMetrics(payload, SENSOR_METRICS)
  if (names.length) return names
  return availableMetrics(payload, LEGACY_SENSOR_METRICS)
}