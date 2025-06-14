<template>
  <div id="app">
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>

<style>
#app {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
