<template>
  <article class="card summary-card">
    <div class="card-header">
      <div>
        <p class="eyebrow">Сводка</p>
        <h3>{{ title }}</h3>
      </div>
      <span class="badge badge--soft">{{ summary?.count ?? 0 }} записей</span>
    </div>

    <EmptyState
      v-if="!hasParams"
      title="Сводка пока недоступна"
      message="За выбранный период недостаточно числовых данных для расчёта сводки."
    />

    <div v-else class="summary-table">
      <div class="summary-table__head">
        <span>Показатель</span>
        <span>Среднее</span>
        <span>Минимум.</span>
        <span>Максимум.</span>
      </div>
      <div v-for="row in rows" :key="row.name" class="summary-table__row">
        <strong>{{ row.label }}</strong>
        <span>{{ row.avg.value }} {{ row.avg.unit }}</span>
        <span>{{ row.min.value }} {{ row.min.unit }}</span>
        <span>{{ row.max.value }} {{ row.max.unit }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from './EmptyState.vue'
import { formatMetric } from '../utils/formatMeasurements'

const props = defineProps({
  title: { type: String, default: 'Сводка' },
  summary: { type: Object, default: null },
})

const params = computed(() => props.summary?.params || {})
const hasParams = computed(() => Object.keys(params.value).length > 0)

const rows = computed(() => Object.entries(params.value).map(([name, value]) => ({
  name,
  label: formatMetric(name, value?.avg).label,
  avg: formatMetric(name, value?.avg),
  min: formatMetric(name, value?.min),
  max: formatMetric(name, value?.max),
})))
</script>
