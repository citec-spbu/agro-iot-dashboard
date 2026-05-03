const METRIC_LABELS = {
  temperature: 'Температура',
  soil_moisture: 'Влажность почвы',
  wind_speed: 'Скорость ветра',
  wind_direction: 'Направление ветра',
  rain: 'Осадки',
}

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

function toUnsigned16(raw) {
  const value = asNumber(raw)
  if (!isFiniteNumber(value)) return null
  const integer = Math.trunc(value)
  return integer < 0 ? integer + 0x10000 : integer
}

function splitHighLow(raw) {
  const unsigned = toUnsigned16(raw)
  if (!isFiniteNumber(unsigned) || unsigned < 0 || unsigned > 0xffff) return null
  return {
    high: (unsigned >> 8) & 0xff,
    low: unsigned & 0xff,
  }
}

function decodeOffsetEncodedPair(raw, divisor = 1) {
  const bytes = splitHighLow(raw)
  if (!bytes) return null

  // В аппаратном протоколе оба байта кодируются со смещением +1.
  // Если один из байтов равен 0, значение не похоже на такой пакет
  // и, скорее всего, было внесено как уже декодированное demo-значение.
  if (bytes.high < 1 || bytes.low < 1) return null

  return (((bytes.high - 1) << 8) + bytes.low - 1) / divisor
}

function decodedOrDirect(raw, divisor, digits) {
  const encoded = decodeOffsetEncodedPair(raw, divisor)
  const direct = asNumber(raw)

  if (isFiniteNumber(encoded)) {
    return {
      value: decimal(encoded, digits),
      converted: true,
      //hintSuffix: 'Значение автоматически преобразовано из формата, в котором его передала станция.',
    }
  }

  if (isFiniteNumber(direct)) {
    return {
      value: decimal(direct, digits),
      converted: false,
      //hintSuffix: 'Значение отображается без дополнительного преобразования.',
    }
  }

  return {
    value: '—',
    converted: false,
    hintSuffix: '',
  }
}

export function formatTemperature(raw) {
  const value = asNumber(raw)
  if (!isFiniteNumber(value)) {
    return metricResult({ label: METRIC_LABELS.temperature, value: '—', unit: '°F', raw, isConverted: false })
  }
  return metricResult({
    label: METRIC_LABELS.temperature,
    value: decimal((value - 900) / 10, 1),
    unit: '°F',
    raw,
    isConverted: true,
    //hint: 'Температура автоматически преобразована из значения, переданного датчиком.',
  })
}

export function formatSoilMoisture(raw) {
  const value = asNumber(raw)
  if (!isFiniteNumber(value)) {
    return metricResult({ label: METRIC_LABELS.soil_moisture, value: '—', unit: '%', raw, isConverted: false })
  }
  return metricResult({
    label: METRIC_LABELS.soil_moisture,
    value: decimal(value, 0),
    unit: '%',
    raw,
    isConverted: true,
    //hint: 'Температура автоматически преобразована из значения, переданного датчиком.',
  })
}

export function formatWindSpeed(raw) {
  const prepared = decodedOrDirect(raw, 5, 1)
  return metricResult({
    label: METRIC_LABELS.wind_speed,
    value: prepared.value,
    unit: 'км/ч',
    raw,
    isConverted: prepared.converted,
    //hint: `Значение автоматически преобразовано из формата метеостанции.`,
  })
}

export function formatWindDirection(raw) {
  const prepared = decodedOrDirect(raw, 1, 0)
  return metricResult({
    label: METRIC_LABELS.wind_direction,
    value: prepared.value,
    unit: '°',
    raw,
    isConverted: prepared.converted,
    //hint: `Значение автоматически преобразовано из формата метеостанции.`,
  })
}

export function formatRain(raw) {
  const prepared = decodedOrDirect(raw, 5, 1)
  return metricResult({
    label: METRIC_LABELS.rain,
    value: prepared.value,
    unit: 'мм',
    raw,
    isConverted: prepared.converted,
    //hint: `Значение автоматически преобразовано из формата метеостанции.`,
  })
}

export function formatMetric(metricName, raw) {
  if (metricName === 'temperature') return formatTemperature(raw)
  if (metricName === 'soil_moisture') return formatSoilMoisture(raw)
  if (metricName === 'wind_speed') return formatWindSpeed(raw)
  if (metricName === 'wind_direction') return formatWindDirection(raw)
  if (metricName === 'rain') return formatRain(raw)

  return metricResult({
    label: METRIC_LABELS[metricName] || metricName,
    value: raw ?? '—',
    unit: '',
    raw,
    isConverted: false,
  })
}

export function metricToNumber(metric) {
  const value = Number(metric?.value)
  return Number.isFinite(value) ? value : null
}

export function getMetricLabel(metricName) {
  return METRIC_LABELS[metricName] || metricName
}
