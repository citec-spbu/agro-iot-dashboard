<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Добавить станцию</p>
        <h2>Регистрация метеостанции</h2>
        <p class="muted">
          Для регистрации нужен UUID поля. Его можно выбрать из списка полей ниже
          или вставить вручную.
        </p>
      </div>
    </div>

    <div v-if="!tokenReady" class="banner banner--warning">
      <strong>Ожидание авторизации от основного Smart.Agromelio.</strong>
      <span>
        Форма доступна для заполнения, но регистрация включится после получения сессии.
      </span>
    </div>

    <article class="card field-directory-card">
      <div class="field-directory-card__header">
        <div>
          <p class="eyebrow">Поля Smart.Agromelio</p>
          <h3>ID полей для регистрации станции</h3>
          <p class="muted">
            Выберите поле из списка, чтобы автоматически подставить его UUID в форму.
          </p>
        </div>

        <button
          class="btn btn--ghost field-directory-card__refresh"
          type="button"
          :disabled="fieldsLoading || !tokenReady"
          @click="loadFields"
        >
          {{ fieldsLoading ? 'Загружаем…' : 'Обновить список' }}
        </button>
      </div>

      <div
        v-if="fieldsError"
        class="banner banner--warning field-directory-card__warning"
      >
        <strong>Список полей не загрузился.</strong>
        <span>{{ fieldsError }}</span>
      </div>

      <div v-if="fieldsLoading" class="hint">
        Загружаем поля…
      </div>

      <div v-else-if="fields.length" class="field-directory">
        <div class="field-directory__head">
          <span>Сезон</span>
          <span>Поле</span>
          <span>ID поля</span>
          <span></span>
        </div>

        <div
          v-for="field in fields"
          :key="`${field.season_id || 'season'}-${field.field_id}`"
          class="field-directory__row"
        >
          <span class="field-directory__season">
            {{ field.season_name || '—' }}
          </span>

          <strong class="field-directory__name">
            {{ field.field_name || 'Без названия' }}
          </strong>

          <code class="field-directory__id">
            {{ field.field_id }}
          </code>

          <button
            class="btn btn--primary btn--small field-directory__button"
            type="button"
            @click="selectField(field.field_id)"
          >
            Вставить
          </button>
        </div>
      </div>

      <p v-else class="muted field-directory-card__empty">
        Поля пока не найдены. Если они есть на карте, нажмите «Обновить список»
        после получения авторизации.
      </p>
    </article>

    <form class="card form-card" @submit.prevent="submit">
      <div class="form-grid">
        <label class="form-label">
          ID поля *
          <input
            v-model.trim="form.field_id"
            class="input"
            type="text"
            required
            placeholder="UUID поля"
          />
        </label>

        <label class="form-label">
          ID метеостанции *
          <input
            v-model.number="form.hardware_id"
            class="input"
            type="number"
            min="1"
            required
            placeholder="Например: 1001"
          />
        </label>

        <label class="form-label form-grid__wide">
          Название станции
          <input
            v-model.trim="form.name"
            class="input"
            type="text"
            placeholder="Например: Метеостанция 1"
          />
        </label>

        <label class="form-label form-grid__wide">
          Интервал опроса датчиков станцией, мин. *
          <input
            v-model.number="form.polling_interval_minutes"
            class="input"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Например: 0.5"
          />
        </label>

        <label class="form-label">
          Широта
          <input
            v-model.number="form.latitude"
            class="input"
            type="number"
            min="-90"
            max="90"
            step="0.000001"
            placeholder="Например: 59.9391"
          />
        </label>

        <label class="form-label">
          Долгота
          <input
            v-model.number="form.longitude"
            class="input"
            type="number"
            min="-180"
            max="180"
            step="0.000001"
            placeholder="Например: 30.3158"
          />
        </label>
      </div>

      <div v-if="validationError" class="banner banner--warning form-warning">
        <strong>Форма заполнена некорректно.</strong>
        <span>{{ validationError }}</span>
      </div>

      <div class="actions">
        <button
          class="btn btn--primary"
          type="submit"
          :disabled="submitting || !tokenReady"
        >
          {{ submitting ? 'Регистрируем…' : 'Зарегистрировать' }}
        </button>

        <button class="btn btn--ghost" type="button" @click="resetForm">
          Очистить
        </button>
      </div>
    </form>

    <ErrorState
      v-if="error"
      title="Регистрация не выполнена"
      :message="error"
    />

    <article v-if="createdStation" class="card success-card">
      <div class="banner banner--success">
        <strong>Станция зарегистрирована.</strong>
        <span>{{ coordsMessage }}</span>
      </div>

      <div class="created-station">
        <div>
          <span>ID поля</span>
          <code>{{ createdStation?.field_id }}</code>
        </div>

        <div>
          <span>ID метеостанции</span>
          <strong>{{ createdStation?.hardware_id }}</strong>
        </div>

        <div>
          <span>Название</span>
          <strong>{{ createdStation?.name || '—' }}</strong>
        </div>

        <div>
          <span>Широта</span>
          <strong>{{ createdStation?.latitude ?? '—' }}</strong>
        </div>

        <div>
          <span>Долгота</span>
          <strong>{{ createdStation?.longitude ?? '—' }}</strong>
        </div>

        <div>
          <span>Интервал опроса</span>
          <strong>{{ formatPollingInterval(createdStation?.polling_interval) }}</strong>
        </div>
      </div>

      <RouterLink
        :to="`/stations/${createdStation?.field_id}`"
        class="btn btn--primary"
      >
        Открыть станцию
      </RouterLink>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import ErrorState from '../components/ErrorState.vue'
import { listFieldDirectory } from '../api/fieldsApi'
import { registerStation } from '../api/iotApi'
import { getErrorMessage, hasToken, TOKEN_CHANGED_EVENT } from '../api/http'
import { normalizeCreatedStation } from '../utils/summary'
import {
  formatPollingInterval,
  normalizePollingIntervalMinutes,
} from '../utils/pollingInterval'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const submitting = ref(false)
const error = ref('')
const created = ref(null)
const validationError = ref('')
const tokenReady = ref(hasToken())

const fieldsLoading = ref(false)
const fieldsError = ref('')
const fields = ref([])

const form = reactive({
  field_id: '',
  hardware_id: null,
  name: '',
  latitude: null,
  longitude: null,
  polling_interval_minutes: 0.5,
})

const createdStation = computed(() => normalizeCreatedStation(created.value).station)

const coordsMessage = computed(() => {
  const coords = normalizeCreatedStation(created.value).coords_match_field

  if (coords === true) {
    return 'Координаты станции находятся внутри выбранного поля.'
  }

  if (coords === false) {
    return 'Координаты станции находятся вне контура выбранного поля.'
  }

  return 'Не удалось проверить, попадает ли станция в контур поля.'
})

function validateForm() {
  if (!UUID_RE.test(form.field_id)) {
    return 'Укажите корректный UUID поля из Smart.Agromelio.'
  }

  if (!Number.isInteger(Number(form.hardware_id)) || Number(form.hardware_id) <= 0) {
    return 'ID метеостанции должен быть положительным целым числом.'
  }

  if (normalizePollingIntervalMinutes(form.polling_interval_minutes) === null) {
    return 'Укажите положительный интервал опроса в минутах.'
  }

  if (
    form.latitude !== null &&
    form.latitude !== '' &&
    !isInRange(Number(form.latitude), -90, 90)
  ) {
    return 'Широта должна быть числом от -90 до 90.'
  }

  if (
    form.longitude !== null &&
    form.longitude !== '' &&
    !isInRange(Number(form.longitude), -180, 180)
  ) {
    return 'Долгота должна быть числом от -180 до 180.'
  }

  return ''
}

function isInRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max
}

function buildPayload() {
  return {
    field_id: form.field_id,
    hardware_id: Number(form.hardware_id),
    name: form.name || null,
    latitude:
      form.latitude === '' || form.latitude === null
        ? null
        : Number(form.latitude),
    longitude:
      form.longitude === '' || form.longitude === null
        ? null
        : Number(form.longitude),
    polling_interval: normalizePollingIntervalMinutes(
      form.polling_interval_minutes,
    ),
  }
}

async function loadFields() {
  tokenReady.value = hasToken()

  if (!tokenReady.value) return

  fieldsLoading.value = true
  fieldsError.value = ''

  try {
    fields.value = await listFieldDirectory()
  } catch (err) {
    fields.value = []
    fieldsError.value = getErrorMessage(err)
  } finally {
    fieldsLoading.value = false
  }
}

function selectField(fieldId) {
  form.field_id = String(fieldId || '')
  validationError.value = ''
}

async function submit() {
  tokenReady.value = hasToken()

  if (!tokenReady.value) {
    error.value =
      'Авторизация ещё не получена. Откройте модуль через основной Smart.Agromelio или войдите заново.'
    return
  }

  validationError.value = validateForm()

  if (validationError.value) return

  submitting.value = true
  error.value = ''
  created.value = null

  try {
    created.value = await registerStation(buildPayload())
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

function onTokenChanged() {
  const nextTokenReady = hasToken()
  const shouldLoadFields =
    nextTokenReady && !tokenReady.value && !fields.value.length

  tokenReady.value = nextTokenReady

  if (shouldLoadFields) {
    loadFields()
  }
}

onMounted(() => {
  window.addEventListener(TOKEN_CHANGED_EVENT, onTokenChanged)
  tokenReady.value = hasToken()

  if (tokenReady.value) {
    loadFields()
  }
})

onUnmounted(() => {
  window.removeEventListener(TOKEN_CHANGED_EVENT, onTokenChanged)
})

function resetForm() {
  form.field_id = ''
  form.hardware_id = null
  form.name = ''
  form.latitude = null
  form.longitude = null
  form.polling_interval_minutes = 0.5

  validationError.value = ''
  error.value = ''
  created.value = null
}
</script>