<template>
  <div class="app-shell">
    <main class="page-container">
      <section class="module-header card">
        <div>
          <p class="eyebrow">Агрометеорологический модуль</p>
          <h1>{{ routeTitle }}</h1>
          <p class="module-header__subtitle">
            Мониторинг метеостанций и почвенных датчиков Smart.Agromelio.
          </p>
        </div>

        <div class="module-header__right">
          <div class="topbar__status">
            <span class="connection-dot" :class="hasAuthToken ? 'connection-dot--ok' : 'connection-dot--warn'" />
            <span>{{ hasAuthToken ? 'Сессия активна' : 'Ожидание авторизации' }}</span>
          </div>

          <nav class="module-tabs" aria-label="Навигация IoT-модуля">
            <RouterLink to="/dashboard" class="module-tab">Станции</RouterLink>
            <RouterLink to="/register" class="module-tab">Добавить станцию</RouterLink>
          </nav>
        </div>
      </section>

      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { hasToken, TOKEN_CHANGED_EVENT } from '../api/http'

const route = useRoute()
const hasAuthToken = ref(hasToken())
const routeTitle = computed(() => route.meta.title || 'Панель датчиков')

function refreshTokenStatus() {
  hasAuthToken.value = hasToken()
}

watchEffect(() => {
  route.fullPath
  refreshTokenStatus()
})

onMounted(() => {
  window.addEventListener(TOKEN_CHANGED_EVENT, refreshTokenStatus)
})

onUnmounted(() => {
  window.removeEventListener(TOKEN_CHANGED_EVENT, refreshTokenStatus)
})
</script>