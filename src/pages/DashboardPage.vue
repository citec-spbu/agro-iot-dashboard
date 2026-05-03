<template>
  <section class="page-stack">
    <div v-if="!tokenReady" class="banner banner--warning">
      <strong>Ожидание авторизации от основного Smart.Agromelio.</strong>
      <span>Откройте модуль через пункт меню “Датчики” в основном интерфейсе или войдите заново.</span>
    </div>

    <div class="page-heading">
      <div>
        <p class="eyebrow">Панель датчиков</p>
        <h2>Метеостанции и почвенные датчики</h2>
        <p class="muted">Мониторинг метеостанций и почвенных датчиков, подключённых к полям Smart.Agromelio.</p>
      </div>
      <button class="btn btn--primary" type="button" :disabled="loading || !tokenReady" @click="loadDashboard">
        Обновить
      </button>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" title="Не удалось загрузить обзор" :message="error" />

    <template v-else-if="tokenReady">
      <div v-if="fallbackWarning" class="banner banner--warning">
        <strong>Обзор загружен частично.</strong>
        <span>{{ fallbackWarning }}</span>
      </div>

      <div class="stats-grid">
        <MetricCard label="Всего станций" :value="stats.totalStations" unit="шт." :show-raw="false" />
        <MetricCard label="В сети" :value="stats.onlineStations" unit="шт." :show-raw="false" />
        <MetricCard label="Не в сети" :value="stats.offlineStations" unit="шт." :show-raw="false" />
        <MetricCard label="Датчиков" :value="stats.sensorsCount" unit="шт." :show-raw="false" />
      </div>

      <EmptyState
        v-if="!stations.length"
        title="Станции пока не зарегистрированы"
        message="Зарегистрируйте первую метеостанцию, чтобы начать получать данные."
      >
        <RouterLink to="/register" class="btn btn--primary state-action">Зарегистрировать станцию</RouterLink>
      </EmptyState>

      <div v-else class="station-grid">
        <StationCard v-for="item in stations" :key="item?.station?.field_id || item?.station?.hardware_id" :item="item" />
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import LoadingState from '../components/LoadingState.vue'
import MetricCard from '../components/MetricCard.vue'
import StationCard from '../components/StationCard.vue'
import { getDashboard, getDashboardFallbackWarning } from '../api/iotApi'
import { getErrorMessage, hasToken, TOKEN_CHANGED_EVENT } from '../api/http'
import { getDashboardStats, safeArray } from '../utils/summary'

const loading = ref(false)
const error = ref('')
const dashboard = ref({ stations: [] })
const tokenReady = ref(hasToken())
const stations = computed(() => safeArray(dashboard.value?.stations))
const stats = computed(() => getDashboardStats(dashboard.value))
const fallbackWarning = computed(() => getDashboardFallbackWarning(dashboard.value))

async function loadDashboard() {
  tokenReady.value = hasToken()
  if (!tokenReady.value) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    dashboard.value = await getDashboard()
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
  if (shouldLoad) loadDashboard()
}

onMounted(() => {
  window.addEventListener(TOKEN_CHANGED_EVENT, onTokenChanged)
  if (hasToken()) loadDashboard()
})

onUnmounted(() => {
  window.removeEventListener(TOKEN_CHANGED_EVENT, onTokenChanged)
})
</script>
