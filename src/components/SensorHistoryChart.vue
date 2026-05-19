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
import { formatMetric, metricToNumber, sensorMetricNames, SENSOR_METRICS } from '../utils/formatMeasurements'

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

const SENSOR_CHART_COLORS = {
  temperaturea: '#e05252',
  soil_moisturea: '#2f67d8',
  temperaturez: '#d97706',
  soil_moisturez: '#20b86a',

  temperature: '#e05252',
  soil_moisture: '#2f67d8',
}

const FALLBACK_COLORS = ['#e05252', '#2f67d8', '#d97706', '#20b86a']

const metricNames = computed(() => {
  const firstPayloadWithMetrics = sortedHistory.value.find((row) => sensorMetricNames(row?.payload).length)?.payload
  const names = sensorMetricNames(firstPayloadWithMetrics)
  return names.length ? names : SENSOR_METRICS
})

function colorFor(metricName, index = 0) {
  return SENSOR_CHART_COLORS[metricName] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function hexToRgba(hex, alpha = 0.14) {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function valuesFor(metricName) {
  return sortedHistory.value.map((row) => {
    if (!row?.payload || !(metricName in row.payload)) return null
    return metricToNumber(formatMetric(metricName, row.payload[metricName]))
  })
}

function datasetFor(metricName, index) {
  const metric = formatMetric(metricName, null)
  const color = colorFor(metricName, index)

  return {
    metricName,
    label: metric.label,
    data: valuesFor(metricName),
    tension: 0.35,
    spanGaps: true,
    borderColor: color,
    backgroundColor: hexToRgba(color, 0.14),
    pointBackgroundColor: color,
    pointBorderColor: '#ffffff',
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: '#ffffff',
    borderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBorderWidth: 2,
  }
}

const chartData = computed(() => ({
  labels: sortedHistory.value.map((row) => formatShortDateTime(row.date_time)),
  datasets: metricNames.value.map(datasetFor),
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        boxHeight: 10,
        padding: 16,
      },
    },
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
          return `${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''} · payload: ${metric.raw ?? '—'}`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      },
      grid: {
        color: 'rgba(110, 123, 145, 0.18)',
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(110, 123, 145, 0.18)',
      },
    },
  },
}
</script>