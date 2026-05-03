<template>
  <section class="state-card state-card--error">
    <div class="state-icon">!</div>
    <div class="state-card__body">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Что-то пошло не так' },
  message: { type: String, default: 'Не удалось загрузить данные. Попробуйте обновить страницу.' },
})
</script>
