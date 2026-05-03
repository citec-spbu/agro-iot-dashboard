<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink to="/dashboard" class="brand" aria-label="Smart.Agromelio IoT">
        <span class="brand__mark">SA</span>
        <span>
          <strong>Smart.Agromelio</strong>
          <small>Модуль датчиков</small>
        </span>
      </RouterLink>

      <nav class="nav-list" aria-label="Навигация модуля датчиков">
        <RouterLink to="/dashboard" class="nav-link">
          <span>Станции</span>
        </RouterLink>
        <RouterLink to="/register" class="nav-link">
          <span>Добавить станцию</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="app-main">
      <header class="topbar">
        <div>
          <p class="eyebrow">Агрометеорологический модуль</p>
          <h1>{{ routeTitle }}</h1>
        </div>
        <div class="topbar__status">
          <span class="connection-dot" :class="hasAuthToken ? 'connection-dot--ok' : 'connection-dot--warn'" />
          <span>{{ hasAuthToken ? 'Сессия активна' : 'Ожидание авторизации' }}</span>
        </div>
      </header>

      <main class="page-container">
        <RouterView />
      </main>
    </div>
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
