import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/main.scss'
import { useSettingsStore } from './stores/settings'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize settings store
const settingsStore = useSettingsStore()
settingsStore.loadSettings().catch(console.error)

app.mount('#app')
