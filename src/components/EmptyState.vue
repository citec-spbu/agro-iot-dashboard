<template>
  <section class="state-card state-card--empty">
    <div class="state-icon">∅</div>
    <div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Данных пока нет' },
  message: { type: String, default: 'Данные появятся после подключения станции или поступления первых измерений.' },
})
</script>
