<template>
  <article class="card sensor-card">
    <div class="station-card__header">
      <div>
        <p class="eyebrow">Почвенный датчик</p>
        <h3>Датчик №{{ sensor?.sensor_id ?? '—' }}</h3>
      </div>
      <span class="badge badge--soft">{{ history.length }} точек истории</span>
    </div>

    <dl class="meta-list">
      <div>
        <dt>Последняя запись</dt>
        <dd>{{ formatDateTime(sensor?.last_data_at) }}</dd>
      </div>
      <div>
        <dt>ID датчика</dt>
        <dd><strong>{{ sensor?.sensor_id ?? '—' }}</strong></dd>
      </div>
    </dl>

    <div v-if="sensor?.error" class="banner banner--warning">
      <strong>Часть данных датчика не загрузилась.</strong>
      <span>{{ sensor.error }}</span>
    </div>

    <div class="metric-grid metric-grid--compact">
      <MetricCard v-for="metric in sensorMetrics" :key="metric.label" :metric="metric" />
    </div>

    <SummaryCard :summary="sensor?.summary" title="Сводка по датчику" />
    <SensorHistoryChart :history="history" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import MetricCard from './MetricCard.vue'
import SensorHistoryChart from './SensorHistoryChart.vue'
import SummaryCard from './SummaryCard.vue'
import { formatDateTime } from '../utils/dates'
import { formatMetric, sensorMetricNames, SENSOR_METRICS } from '../utils/formatMeasurements'
import { safeArray } from '../utils/summary'

const props = defineProps({
  sensor: { type: Object, required: true },
})

const history = computed(() => safeArray(props.sensor?.history))

const sensorMetrics = computed(() => {
  const payload = props.sensor?.last_data || {}
  const names = sensorMetricNames(payload)
  return (names.length ? names : SENSOR_METRICS).map((name) => formatMetric(name, payload?.[name]))
})
</script>