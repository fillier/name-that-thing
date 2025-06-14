// Settings store for Name That Thing
import { defineStore } from 'pinia'
import { ref, reactive, watch, computed } from 'vue'

export interface AppSettings {
  // Image Processing Settings
  maxImageSize: number
  minImageSize: number
  compressionQuality: number
  
  // Game Settings
  showProgress: boolean
  autoAdvance: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  maxImageSize: 1280,
  minImageSize: 800,
  compressionQuality: 0.9,
  showProgress: true,
  autoAdvance: false
}

const STORAGE_KEY = 'name-that-thing-settings'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = reactive<AppSettings>({ ...DEFAULT_SETTINGS })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const loadSettings = async () => {
    try {
      loading.value = true
      error.value = null

      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSettings = JSON.parse(stored) as Partial<AppSettings>
        
        // Merge with defaults to handle new settings that might not exist in stored data
        Object.assign(settings, DEFAULT_SETTINGS, parsedSettings)
        
        console.log('Settings loaded from localStorage:', settings)
      } else {
        console.log('No stored settings found, using defaults')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load settings'
      console.error('Failed to load settings:', err)
      
      // Reset to defaults if loading fails
      Object.assign(settings, DEFAULT_SETTINGS)
    } finally {
      loading.value = false
    }
  }

  const saveSettings = async () => {
    try {
      loading.value = true
      error.value = null

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      console.log('Settings saved to localStorage:', settings)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save settings'
      console.error('Failed to save settings:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSetting = async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    settings[key] = value
    await saveSettings()
  }

  const updateSettings = async (updates: Partial<AppSettings>) => {
    Object.assign(settings, updates)
    await saveSettings()
  }

  const resetSettings = async () => {
    Object.assign(settings, DEFAULT_SETTINGS)
    await saveSettings()
  }

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2)
  }

  const importSettings = async (settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson) as Partial<AppSettings>
      
      // Validate imported settings
      const validSettings: Partial<AppSettings> = {}
      
      if (typeof importedSettings.maxImageSize === 'number' && 
          importedSettings.maxImageSize >= 800 && 
          importedSettings.maxImageSize <= 2560) {
        validSettings.maxImageSize = importedSettings.maxImageSize
      }
      
      if (typeof importedSettings.minImageSize === 'number' && 
          importedSettings.minImageSize >= 400 && 
          importedSettings.minImageSize <= 1600) {
        validSettings.minImageSize = importedSettings.minImageSize
      }
      
      if (typeof importedSettings.compressionQuality === 'number' && 
          importedSettings.compressionQuality >= 0.1 && 
          importedSettings.compressionQuality <= 1) {
        validSettings.compressionQuality = importedSettings.compressionQuality
      }
      
      if (typeof importedSettings.showProgress === 'boolean') {
        validSettings.showProgress = importedSettings.showProgress
      }
      
      if (typeof importedSettings.autoAdvance === 'boolean') {
        validSettings.autoAdvance = importedSettings.autoAdvance
      }
      
      await updateSettings(validSettings)
      return validSettings
    } catch (err) {
      throw new Error('Invalid settings format')
    }
  }

  // Auto-save settings when they change (debounced)
  let saveTimeout: NodeJS.Timeout | null = null
  watch(
    () => ({ ...settings }),
    () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      saveTimeout = setTimeout(() => {
        saveSettings().catch(console.error)
      }, 500) // Debounce saves by 500ms
    },
    { deep: true }
  )

  return {
    // State
    settings: settings as AppSettings,
    loading: readonly(loading),
    error: readonly(error),
    
    // Actions
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings
  }
})

function readonly<T>(ref: import('vue').Ref<T>) {
  return computed(() => ref.value)
}

// Helper to access settings outside of setup context
export const getSettings = (): AppSettings => {
  const store = useSettingsStore()
  return {
    maxImageSize: store.settings.maxImageSize,
    minImageSize: store.settings.minImageSize,
    compressionQuality: store.settings.compressionQuality,
    showProgress: store.settings.showProgress,
    autoAdvance: store.settings.autoAdvance
  }
}
