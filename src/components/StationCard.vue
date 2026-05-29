<template>
  <article class="card station-card">
    <div class="station-card__header">
      <div>
        <p class="eyebrow">ID метеостанции: {{ station?.hardware_id ?? '—' }}</p>
        <h3>{{ stationTitle }}</h3>
      </div>

      <span class="badge" :class="item?.online ? 'badge--success' : 'badge--muted'">
        {{ item?.online ? 'в сети' : 'не в сети' }}
      </span>
    </div>

    <dl class="meta-list">
      <div>
        <dt>ID поля</dt>
        <dd><code>{{ station?.field_id || '—' }}</code></dd>
      </div>

      <div>
        <dt>Последняя активность</dt>
        <dd>{{ formatDateTime(station?.last_seen_at) }}</dd>
      </div>

      <div>
        <dt>Последняя запись</dt>
        <dd>{{ formatDateTime(item?.last_data_at) }}</dd>
      </div>

      <div>
        <dt>Интервал опроса</dt>
        <dd>{{ formatPollingInterval(station?.polling_interval) }}</dd>
      </div>
    </dl>

    <div class="metric-grid metric-grid--compact">
      <MetricCard
        v-for="metric in stationMetrics"
        :key="metric.label"
        :metric="metric"
      />
    </div>

    <div class="sensor-preview">
      <div class="sensor-preview__head">
        <strong>Почвенные датчики</strong>
        <span>{{ sensors.length }}</span>
      </div>

      <div v-if="sensors.length" class="sensor-preview__list">
        <div
          v-for="sensor in sensors.slice(0, 3)"
          :key="sensor.sensor_id"
          class="sensor-preview__item"
        >
          <span>Датчик №{{ sensor.sensor_id }}</span>
          <small>{{ sensorSummary(sensor) }}</small>
        </div>

        <small v-if="sensors.length > 3" class="muted">
          +{{ sensors.length - 3 }} ещё
        </small>
      </div>

      <p v-else class="muted">
        Данные от почвенных датчиков пока не поступали.
      </p>
    </div>

    <RouterLink
      v-if="station?.field_id"
      :to="stationLink"
      class="btn btn--primary station-card__button"
    >
      Открыть станцию
    </RouterLink>

    <span v-else class="hint">
      Не удалось открыть станцию: нет данных о привязанном поле.
    </span>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import MetricCard from './MetricCard.vue'
import { formatDateTime } from '../utils/dates'
import {
  formatMetric,
  sensorMetricNames,
  STATION_METRICS,
} from '../utils/formatMeasurements'
import { getStationName, safeArray } from '../utils/summary'
import { formatPollingInterval } from '../utils/pollingInterval'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const station = computed(() => props.item?.station || {})
const sensors = computed(() => safeArray(props.item?.sensors))
const stationTitle = computed(() => getStationName(station.value))
const stationLink = computed(() => `/stations/${station.value?.field_id}`)

const stationMetrics = computed(() => {
  const payload = props.item?.last_data || {}

  return STATION_METRICS.map((name) => formatMetric(name, payload?.[name]))
})

function sensorSummary(sensor) {
  const payload = sensor?.last_data || {}
  const metricNames = sensorMetricNames(payload).slice(0, 2)

  if (!metricNames.length) return 'последних данных нет'

  return metricNames
    .map((name) => {
      const metric = formatMetric(name, payload[name])

      return `${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`
    })
    .join(', ')
}
</script>