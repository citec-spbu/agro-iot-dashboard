<template>
  <article class="card sensor-card">
    <div class="station-card__header">
      <div>
        <p class="eyebrow">Почвенный датчик</p>
        <h3>Датчик №{{ sensor?.sensor_id ?? '—' }}</h3>
      </div>

      <span class="badge badge--soft">{{ formatDateTime(sensor?.last_data_at) }}</span>
    </div>

    <div v-if="sensor?.error" class="banner banner--warning">
      <strong>Часть данных датчика не загрузилась.</strong>
      <span>{{ sensor.error }}</span>
    </div>

    <dl class="meta-list">
      <div>
        <dt>ID датчика</dt>
        <dd>{{ sensor?.sensor_id ?? '—' }}</dd>
      </div>

      <div>
        <dt>Последняя запись</dt>
        <dd>{{ formatDateTime(sensor?.last_data_at) }}</dd>
      </div>

      <div>
        <dt>Точек истории</dt>
        <dd>{{ historyCount }}</dd>
      </div>
    </dl>

    <div class="metric-grid metric-grid--compact">
      <MetricCard v-for="metric in sensorMetrics" :key="metric.label" :metric="metric" />
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import MetricCard from './MetricCard.vue'
import { formatDateTime } from '../utils/dates'
import { formatMetric } from '../utils/formatMeasurements'
import { safeArray } from '../utils/summary'

const props = defineProps({
  sensor: { type: Object, required: true },
})

const historyCount = computed(() => safeArray(props.sensor?.history).length)

const sensorMetrics = computed(() => {
  const payload = props.sensor?.last_data || props.sensor?.last?.payload || {}
  return ['temperature', 'soil_moisture'].map((name) => formatMetric(name, payload?.[name]))
})
</script>
