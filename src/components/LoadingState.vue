<template>
  <section class="state-card state-card--loading">
    <div class="loader" />
    <div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Загрузка данных' },
  message: { type: String, default: 'Загружаем данные датчиков.' },
})
</script>
