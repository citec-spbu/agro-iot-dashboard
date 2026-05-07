<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">ID поля</p>
        <h2>{{ stationTitle }}</h2>
        <p class="muted"><code>{{ fieldId }}</code></p>
      </div>
      <RouterLink to="/dashboard" class="btn btn--ghost">Назад к списку станций</RouterLink>
    </div>

    <div v-if="!tokenReady" class="banner banner--warning">
      <strong>Ожидание авторизации от основного Smart.Agromelio.</strong>
      <span>Данные станции будут загружены автоматически после получения сессии.</span>
    </div>

    <PeriodSelector title="Период для истории и агрегатов" @change="onPeriodChange" />

    <LoadingState v-if="loading" title="Загрузка станции" message="Загружаем данные станции, историю измерений и список датчиков." />
    <ErrorState v-else-if="error" title="Не удалось загрузить станцию" :message="error" />

    <template v-else-if="tokenReady">
      <article class="card station-hero">
        <div class="station-hero__main">
          <div>
            <p class="eyebrow">Метеостанция</p>
            <h3>{{ stationTitle }}</h3>
          </div>
          <span class="badge" :class="online ? 'badge--success' : 'badge--muted'">
            {{ online ? 'в сети' : 'не в сети' }}
          </span>
        </div>

        <div class="station-hero__meta">
          <div><span>ID поля</span><code>{{ station?.field_id || fieldId }}</code></div>
          <div><span>ID метеостанции</span><strong>{{ station?.hardware_id ?? '—' }}</strong></div>
          <div><span>Последняя активность</span><strong>{{ formatDateTime(station?.last_seen_at) }}</strong></div>
          <div><span>Широта</span><strong>{{ station?.latitude ?? '—' }}</strong></div>
          <div><span>Долгота</span><strong>{{ station?.longitude ?? '—' }}</strong></div>
        </div>
      </article>

      <section class="section-block">
        <div class="section-title">
          <div>
            <p class="eyebrow">Последние данные</p>
            <h3>Последние измерения метеостанции</h3>
          </div>
          <span class="muted">{{ formatDateTime(stationLast?.date_time) }}</span>
        </div>

        <EmptyState
          v-if="!stationLast"
          title="Последних данных метеостанции пока нет"
          message="Данные появятся после получения первого сообщения от метеостанции."
        />
        <div v-else class="metric-grid">
          <MetricCard v-for="metric in stationMetrics" :key="metric.label" :metric="metric" />
        </div>
      </section>

      <SummaryCard :summary="stationSummary" title="Сводка по метеостанции" />
      <StationHistoryChart :history="stationHistory" />

      <section class="section-block">
        <div class="section-title">
          <div>
            <p class="eyebrow">Почвенные датчики</p>
            <h3>Почвенные датчики станции</h3>
          </div>
          <span class="badge badge--soft">{{ sensors.length }} шт.</span>
        </div>

        <ErrorState v-if="sensorsError" title="Не удалось загрузить список датчиков" :message="sensorsError" />
        <EmptyState
          v-else-if="!sensors.length"
          title="Датчики пока не найдены"
          message="Данные появятся после получения первого сообщения от почвенного датчика."
        />
        <div v-else class="sensor-grid">
          <SensorCard v-for="sensor in sensors" :key="sensor.sensor_id" :sensor="sensor" />
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import LoadingState from '../components/LoadingState.vue'
import MetricCard from '../components/MetricCard.vue'
import PeriodSelector from '../components/PeriodSelector.vue'
import SensorCard from '../components/SensorCard.vue'
import StationHistoryChart from '../components/StationHistoryChart.vue'
import SummaryCard from '../components/SummaryCard.vue'
import {
  getSensorHistory,
  getSensorLast,
  getSensorSummary,
  getStation,
  getStationHistory,
  getStationLast,
  getStationSummary,
  listSensors,
} from '../api/iotApi'
import { getErrorMessage, hasToken, TOKEN_CHANGED_EVENT } from '../api/http'
import { formatDateTime } from '../utils/dates'
import { formatMetric, STATION_METRICS } from '../utils/formatMeasurements'
import {
  getStationName,
  isNotFoundError,
  isRecentIsoDate,
  normalizeSensorIds,
  normalizeStationResponse,
  safeArray,
} from '../utils/summary'

const route = useRoute()
const fieldId = computed(() => String(route.params.fieldId || ''))
const loading = ref(false)
const error = ref('')
const sensorsError = ref('')
const tokenReady = ref(hasToken())

const period = ref({ dateFrom: '', dateTo: '' })
const station = ref(null)
const stationLast = ref(null)
const stationHistory = ref([])
const stationSummary = ref(null)
const sensors = ref([])

const stationTitle = computed(() => getStationName(station.value))
const online = computed(() => Boolean(station.value?.online) || isRecentIsoDate(station.value?.last_seen_at))
const stationMetrics = computed(() => {
  const payload = stationLast.value?.payload || {}
  return STATION_METRICS.map((name) => formatMetric(name, payload?.[name]))
})

async function onPeriodChange(nextPeriod) {
  period.value = nextPeriod
  await loadStation()
}

async function loadStation() {
  tokenReady.value = hasToken()
  if (!tokenReady.value) {
    loading.value = false
    return
  }
  if (!period.value.dateFrom || !period.value.dateTo || !fieldId.value) return

  loading.value = true
  error.value = ''
  sensorsError.value = ''

  try {
    const [stationResult, lastResult, historyResult, summaryResult, sensorIdsResult] = await Promise.allSettled([
      getStation(fieldId.value),
      getStationLast(fieldId.value),
      getStationHistory(fieldId.value, period.value.dateFrom, period.value.dateTo),
      getStationSummary(fieldId.value, period.value.dateFrom, period.value.dateTo),
      listSensors(fieldId.value),
    ])

    if (stationResult.status === 'rejected') throw stationResult.reason
    station.value = normalizeStationResponse(stationResult.value)

    stationLast.value = lastResult.status === 'fulfilled' ? lastResult.value : null
    stationHistory.value = historyResult.status === 'fulfilled' ? safeArray(historyResult.value) : []
    stationSummary.value = summaryResult.status === 'fulfilled' ? summaryResult.value : null

    if (lastResult.status === 'rejected' && !isNotFoundError(lastResult.reason)) console.warn('Ошибка последних данных станции:', lastResult.reason)
    if (historyResult.status === 'rejected' && !isNotFoundError(historyResult.reason)) console.warn('Ошибка истории станции:', historyResult.reason)
    if (summaryResult.status === 'rejected' && !isNotFoundError(summaryResult.reason)) console.warn('Ошибка агрегатов станции:', summaryResult.reason)

    if (sensorIdsResult.status === 'fulfilled') {
      sensors.value = await loadSensors(normalizeSensorIds(sensorIdsResult.value))
    } else if (isNotFoundError(sensorIdsResult.reason)) {
      sensors.value = []
    } else {
      sensors.value = []
      sensorsError.value = getErrorMessage(sensorIdsResult.reason)
    }
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

function onTokenChanged() {
  const nextTokenReady = hasToken()
  const shouldLoad = nextTokenReady && !tokenReady.value
  tokenReady.value = nextTokenReady
  if (shouldLoad) loadStation()
}

onMounted(() => {
  window.addEventListener(TOKEN_CHANGED_EVENT, onTokenChanged)
  tokenReady.value = hasToken()
  if (tokenReady.value) loadStation()
})

onUnmounted(() => {
  window.removeEventListener(TOKEN_CHANGED_EVENT, onTokenChanged)
})

async function loadSensors(sensorIds) {
  const ids = safeArray(sensorIds)
  return Promise.all(ids.map(async (sensorId) => {
    const [last, history, summary] = await Promise.allSettled([
      getSensorLast(fieldId.value, sensorId),
      getSensorHistory(fieldId.value, sensorId, period.value.dateFrom, period.value.dateTo),
      getSensorSummary(fieldId.value, sensorId, period.value.dateFrom, period.value.dateTo),
    ])

    const hardError = [last, history, summary]
      .filter((item) => item.status === 'rejected' && !isNotFoundError(item.reason))
      .map((item) => getErrorMessage(item.reason))
      .join('; ')

    return {
      sensor_id: sensorId,
      last: last.status === 'fulfilled' ? last.value : null,
      last_data: last.status === 'fulfilled' ? last.value?.payload : null,
      last_data_at: last.status === 'fulfilled' ? last.value?.date_time : null,
      history: history.status === 'fulfilled' ? safeArray(history.value) : [],
      summary: summary.status === 'fulfilled' ? summary.value : null,
      error: hardError,
    }
  }))
}
</script>