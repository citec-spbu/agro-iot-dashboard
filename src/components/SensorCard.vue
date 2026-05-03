<template>
  <article class="card sensor-card">
    <div class="card-header">
      <div>
        <p class="eyebrow">Почвенный датчик</p>
        <h3>Датчик №{{ sensor?.sensor_id }}</h3>
      </div>
      <span class="badge badge--soft">{{ formatDateTime(sensor?.last_data_at || sensor?.last?.date_time) }}</span>
    </div>

    <ErrorState v-if="sensor?.error" title="Не удалось загрузить данные датчика" :message="sensor.error" />

    <template v-else>
      <EmptyState
        v-if="!hasLastData"
        title="Данных от датчика пока нет"
        message="Данные появятся после получения первого сообщения от почвенного датчика."
      />
      <div v-else class="metric-grid metric-grid--compact">
        <MetricCard v-for="metric in metrics" :key="metric.label" :metric="metric" />
      </div>

      <SummaryCard :summary="summary" title="Сводка по датчику" />

      <SensorHistoryChart :history="sensor?.history || []" />
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import MetricCard from './MetricCard.vue'
import SummaryCard from './SummaryCard.vue'
import SensorHistoryChart from './SensorHistoryChart.vue'
import { formatDateTime } from '../utils/dates'
import { formatMetric } from '../utils/formatMeasurements'
import { hasPayload } from '../utils/summary'

const props = defineProps({
  sensor: { type: Object, required: true },
})

const lastPayload = computed(() => props.sensor?.last_data || props.sensor?.last?.payload || {})
const hasLastData = computed(() => hasPayload(lastPayload.value))
const summary = computed(() => props.sensor?.summary || null)
const metrics = computed(() => [
  formatMetric('temperature', lastPayload.value.temperature),
  formatMetric('soil_moisture', lastPayload.value.soil_moisture),
])
</script>
