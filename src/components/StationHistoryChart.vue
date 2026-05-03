<template>
  <article class="card chart-card">
    <div class="card-header">
      <div>
        <p class="eyebrow">История</p>
        <h3>История измерений метеостанции</h3>
      </div>
      <span class="badge badge--soft">{{ sortedHistory.length }} точек</span>
    </div>

    <EmptyState
      v-if="!sortedHistory.length"
      title="История измерений метеостанции"
      message="За выбранный период измерения от метеостанции не поступали."
    />
    <div v-else class="chart-frame">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import EmptyState from './EmptyState.vue'
import { formatDateTime, formatShortDateTime, sortByDateTimeAsc } from '../utils/dates'
import { formatMetric, metricToNumber } from '../utils/formatMeasurements'

ChartJS.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
)

const props = defineProps({
  history: { type: Array, default: () => [] },
})

const sortedHistory = computed(() => sortByDateTimeAsc(props.history))

function valuesFor(metricName) {
  return sortedHistory.value.map((row) => {
    if (!row?.payload || !(metricName in row.payload)) return null
    return metricToNumber(formatMetric(metricName, row.payload[metricName]))
  })
}

const chartData = computed(() => ({
  labels: sortedHistory.value.map((row) => formatShortDateTime(row.date_time)),
  datasets: [
    {
      metricName: 'wind_speed',
      label: 'Скорость ветра',
      data: valuesFor('wind_speed'),
      borderColor: '#2f8f46',
      backgroundColor: 'rgba(47, 143, 70, 0.12)',
      tension: 0.35,
      spanGaps: true,
    },
    {
      metricName: 'rain',
      label: 'Осадки',
      data: valuesFor('rain'),
      borderColor: '#2f80ed',
      backgroundColor: 'rgba(47, 128, 237, 0.12)',
      tension: 0.35,
      spanGaps: true,
    },
    {
      metricName: 'wind_direction',
      label: 'Направление ветра',
      data: valuesFor('wind_direction'),
      borderColor: '#d97706',
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      tension: 0.35,
      spanGaps: true,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        title(items) {
          const index = items?.[0]?.dataIndex
          return formatDateTime(sortedHistory.value[index]?.date_time)
        },
        label(context) {
          const metricName = context.dataset.metricName
          const row = sortedHistory.value[context.dataIndex]
          const metric = formatMetric(metricName, row?.payload?.[metricName])
          return `${metric.label}: ${metric.value} ${metric.unit} · значение от устройства: ${metric.raw ?? '—'}`
        },
      },
    },
  },
  scales: {
    x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
    y: { beginAtZero: false },
  },
}
</script>
