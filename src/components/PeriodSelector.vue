<template>
  <article class="period-selector card">
    <div>
      <p class="eyebrow">Период истории</p>
      <h3>{{ title }}</h3>
    </div>

    <div class="period-selector__presets" role="group" aria-label="Выбор периода">
      <button
        v-for="option in presets"
        :key="option.value"
        class="chip"
        :class="{ 'chip--active': selectedPreset === option.value }"
        type="button"
        @click="selectPreset(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="selectedPreset === 'custom'" class="period-selector__custom">
      <label class="form-label">
        С
        <input v-model="customFrom" class="input" type="datetime-local" />
      </label>
      <label class="form-label">
        По
        <input v-model="customTo" class="input" type="datetime-local" />
      </label>
      <button class="btn btn--primary" type="button" @click="applyCustom">Применить</button>
    </div>

    <div v-if="validationMessage" class="banner banner--warning">
      <strong>Проверьте выбранные даты.</strong>
      <span>{{ validationMessage }}</span>
    </div>
    <div v-else-if="periodWarning" class="banner banner--warning">
      <strong>Выбран большой период.</strong>
      <span>{{ periodWarning }}</span>
    </div>
  </article>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getPeriodLengthDays, getPresetPeriod, toApiDateTime, toInputDateTime } from '../utils/dates'

const props = defineProps({
  title: { type: String, default: 'История' },
})

const emit = defineEmits(['change'])

const presets = [
  { value: '24h', label: 'Последние 24 часа' },
  { value: '7d', label: 'Последние 7 дней' },
  { value: '30d', label: 'Последние 30 дней' },
  { value: 'custom', label: 'Произвольный период' },
]

const selectedPreset = ref('24h')
const initial = getPresetPeriod('24h')
const customFrom = ref(toInputDateTime(initial.dateFrom))
const customTo = ref(toInputDateTime(initial.dateTo))
const validationMessage = ref('')
const periodWarning = ref('')

function emitPeriod(preset, dateFrom, dateTo) {
  validationMessage.value = ''
  periodWarning.value = ''

  const from = new Date(dateFrom)
  const to = new Date(dateTo)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    validationMessage.value = 'Дата начала или дата окончания указана некорректно.'
    return
  }
  if (from > to) {
    validationMessage.value = 'Дата начала не может быть позже даты окончания.'
    return
  }

  const days = getPeriodLengthDays(from, to)
  if (days > 90) {
    periodWarning.value = 'Выбран период больше 90 дней. Графики могут загружаться медленнее.'
  }

  emit('change', {
    preset,
    dateFrom: toApiDateTime(from),
    dateTo: toApiDateTime(to),
    days,
  })
}

function selectPreset(value) {
  selectedPreset.value = value
  if (value === 'custom') return
  const period = getPresetPeriod(value)
  customFrom.value = toInputDateTime(period.dateFrom)
  customTo.value = toInputDateTime(period.dateTo)
  emitPeriod(value, period.dateFrom, period.dateTo)
}

function applyCustom() {
  emitPeriod('custom', customFrom.value, customTo.value)
}

onMounted(() => selectPreset('24h'))
</script>
