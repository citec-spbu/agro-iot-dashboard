<template>
  <article class="chart-card chart-card--embedded">
    <div class="card-header">
      <div>
        <p class="eyebrow">История измерений датчика</p>
        <h3>Температура и влажность почвы</h3>
      </div>

      <span class="badge badge--soft">{{ sortedHistory.length }} точек</span>
    </div>

    <EmptyState
      v-if="!sortedHistory.length"
      title="Истории измерений пока нет"
      message="За выбранный период измерения от этого датчика не поступали."
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
      metricName: 'temperature',
      label: 'Температура',
      data: valuesFor('temperature'),
      borderColor: '#d9465d',
      backgroundColor: 'rgba(217, 70, 93, 0.12)',
      tension: 0.35,
      spanGaps: true,
    },
    {
      metricName: 'soil_moisture',
      label: 'Влажность почвы',
      data: valuesFor('soil_moisture'),
      borderColor: '#2f67d8',
      backgroundColor: 'rgba(47, 103, 216, 0.12)',
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