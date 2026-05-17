import { createRouter, createWebHistory } from 'vue-router'

import DashboardPage from '../pages/DashboardPage.vue'
import StationPage from '../pages/StationPage.vue'
import RegisterStationPage from '../pages/RegisterStationPage.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { title: 'Обзор датчиков' } },
  { path: '/stations/:fieldId', name: 'station', component: StationPage, props: true, meta: { title: 'Станция' } },
  { path: '/register', name: 'register', component: RegisterStationPage, meta: { title: 'Добавить станцию' } },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'Панель датчиков'} · Smart.Agromelio`
})

export default router
