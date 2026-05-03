<template>
  <article class="metric-card" :title="preparedMetric.hint || hint || ''">
    <div class="metric-card__top">
      <span class="metric-card__icon" v-if="icon">{{ icon }}</span>
      <span class="metric-card__label">{{ preparedMetric.label || label }}</span>
    </div>
    <div class="metric-card__value-row">
      <strong>{{ preparedMetric.value ?? value ?? '—' }}</strong>
      <span v-if="preparedMetric.unit || unit">{{ preparedMetric.unit || unit }}</span>
    </div>
    <p class="metric-card__raw" v-if="showRaw && preparedMetric.raw !== undefined && preparedMetric.raw !== null">
      значение от устройства: <code>{{ preparedMetric.raw }}</code>
      <span v-if="preparedMetric.isConverted"> · обработано</span>
      <span v-else> · без обработки</span>
    </p>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  metric: { type: Object, default: () => ({}) },
  label: { type: String, default: '' },
  value: { type: [String, Number], default: '—' },
  unit: { type: String, default: '' },
  raw: { type: [String, Number], default: null },
  icon: { type: String, default: '' },
  hint: { type: String, default: '' },
  showRaw: { type: Boolean, default: true },
})

const preparedMetric = computed(() => ({
  label: props.metric.label ?? props.label,
  value: props.metric.value ?? props.value,
  unit: props.metric.unit ?? props.unit,
  raw: props.metric.raw ?? props.raw,
  isConverted: Boolean(props.metric.isConverted),
  hint: props.metric.hint ?? props.hint,
}))
</script>
