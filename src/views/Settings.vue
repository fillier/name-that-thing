<template>
  <div class="settings">
    <header class="settings-header">
      <div class="header-left">
        <button @click="$router.push('/setup')" class="btn btn-secondary">
          ← Back to Setup
        </button>
        <h1>Settings</h1>
      </div>
    </header>

    <main class="settings-main">
      <div class="settings-content">
        <div class="settings-section">
          <h2>Data Management</h2>
          <div class="settings-grid">
            <div class="setting-card">
              <h3>Export Data</h3>
              <p>Download all your categories and images as a backup file</p>
              <button @click="exportData" class="btn btn-primary" :disabled="loading">
                <span v-if="loading">⏳ Exporting...</span>
                <span v-else>📁 Export Data</span>
              </button>
              <small>Creates a JSON file with all your data for backup or sharing</small>
            </div>
            
            <div class="setting-card">
              <h3>Import Data</h3>
              <p>Import categories and images from a previously exported backup file</p>
              <button @click="startImport" class="btn btn-secondary" :disabled="loading">
                <span v-if="loading">⏳ Importing...</span>
                <span v-else>📂 Import Data</span>
              </button>
              <small>⚠️ This will replace all existing data with the imported data</small>
            </div>
            
            <div class="setting-card">
              <h3>Clear All Data</h3>
              <p>Remove all categories and images (cannot be undone)</p>
              <button @click="showClearConfirm = true" class="btn btn-danger" :disabled="loading">
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>Image Processing</h2>
          <div class="settings-form">
            <div class="form-group">
              <label for="maxImageSize">Maximum Image Width (pixels)</label>
              <input 
                id="maxImageSize"
                v-model.number="settings.maxImageSize"
                type="number"
                min="800"
                max="2560"
                step="80"
              >
              <small>Images larger than this width will be scaled down while maintaining aspect ratio</small>
            </div>
            
            <div class="form-group">
              <label for="minImageSize">Minimum Image Width (pixels)</label>
              <input 
                id="minImageSize"
                v-model.number="settings.minImageSize"
                type="number"
                min="400"
                max="1600"
                step="40"
              >
              <small>Images smaller than this width will be scaled up while maintaining aspect ratio</small>
            </div>
            
            <div class="form-group">
              <label for="compressionQuality">Image Compression Quality</label>
              <input 
                id="compressionQuality"
                v-model.number="settings.compressionQuality"
                type="range"
                min="0.1"
                max="1"
                step="0.1"
              >
              <div class="range-labels">
                <span>Lower file size</span>
                <span>{{ Math.round(settings.compressionQuality * 100) }}%</span>
                <span>Higher quality</span>
              </div>
              <small>Lower values create smaller files but reduce image quality</small>
            </div>
            
            <div class="form-group">
              <label>Pixelation Levels (higher = more pixelated)</label>
              <div class="pixelation-controls-horizontal">
                <div class="pixelation-input">
                  <label for="pixelationLevel1">Level 1</label>
                  <input 
                    id="pixelationLevel1"
                    v-model.number="settings.pixelationLevel1"
                    type="number"
                    min="4"
                    max="128"
                    step="4"
                  >
                </div>
                
                <div class="pixelation-input">
                  <label for="pixelationLevel2">Level 2</label>
                  <input 
                    id="pixelationLevel2"
                    v-model.number="settings.pixelationLevel2"
                    type="number"
                    min="4"
                    max="128"
                    step="4"
                  >
                </div>
                
                <div class="pixelation-input">
                  <label for="pixelationLevel3">Level 3</label>
                  <input 
                    id="pixelationLevel3"
                    v-model.number="settings.pixelationLevel3"
                    type="number"
                    min="4"
                    max="128"
                    step="4"
                  >
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button @click="resetToDefaults" class="btn btn-secondary">
                Reset to Defaults
              </button>
              <button @click="saveSettingsManually" class="btn btn-primary">
                Save Settings
              </button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>About</h2>
          <div class="about-card">
            <h3>Name That Thing</h3>
            <p>Version 1.0.0</p>
            <p>An interactive guessing game for presentations and group activities.</p>
            <div class="about-links">
              <a 
                href="https://github.com/fillier/name-that-thing/blob/main/README.md" 
                target="_blank" 
                rel="noopener noreferrer"
                class="btn btn-secondary btn-sm"
              >
                📚 Documentation
              </a>
              <a 
                href="https://github.com/fillier/name-that-thing/issues/new" 
                target="_blank" 
                rel="noopener noreferrer"
                class="btn btn-secondary btn-sm"
              >
                🐛 Report Issue
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Clear Data Confirmation Modal -->
    <div v-if="showClearConfirm" class="modal-overlay" @click="showClearConfirm = false">
      <div class="modal" @click.stop>
        <header class="modal-header">
          <h3>⚠️ Clear All Data</h3>
        </header>
        <div class="modal-body">
          <p>This will permanently delete all categories and images. This action cannot be undone.</p>
          <p><strong>Are you sure you want to continue?</strong></p>
          <div class="modal-actions">
            <button @click="showClearConfirm = false" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="clearAllData" class="btn btn-danger">
              Yes, Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- File Import Input -->
    <input 
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleImport"
      style="display: none"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { db } from '@/services/database'
import { downloadFile, readFileAsText } from '@/utils'

const categoriesStore = useCategoriesStore()
const settingsStore = useSettingsStore()
const toast = useToast()

// State
const loading = ref(false)
const showClearConfirm = ref(false)
const fileInput = ref<HTMLInputElement>()

// Use settings from store
const settings = settingsStore.settings

// Methods
const exportData = async () => {
  try {
    loading.value = true
    
    // Export data from IndexedDB
    const exportData = await db.exportData()
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const fileName = `name-that-thing-backup-${new Date().toISOString().split('T')[0]}.json`
    
    downloadFile(dataStr, fileName, 'application/json')
    
    toast.success(`Data exported successfully as ${fileName}`, { duration: 4000 })
    console.log('Data exported successfully')
  } catch (error) {
    console.error('Failed to export data:', error)
    toast.error('Failed to export data. Please try again.', { duration: 5000 })
  } finally {
    loading.value = false
  }
}

const startImport = () => {
  fileInput.value?.click()
}

const handleImport = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    loading.value = true
    
    const text = await readFileAsText(file)
    const importData = JSON.parse(text)
    
    // Validate import data structure
    if (!importData.version || !importData.categories || !importData.images) {
      throw new Error('Invalid backup file format')
    }
    
    // Show confirmation for data import (as it clears existing data)
    const shouldImport = confirm(
      `This will replace all existing data with the imported data from ${file.name}. ` +
      `Found ${importData.categories?.length || 0} categories and ${importData.images?.length || 0} images. ` +
      `Continue?`
    )
    
    if (!shouldImport) {
      // Reset file input and return
      target.value = ''
      return
    }
    
    // Import data to IndexedDB
    await db.importData(importData)
    
    // Reload categories in store
    await categoriesStore.loadCategories()
    
    // Reset file input
    target.value = ''
    
    toast.success(
      `Data imported successfully! ${importData.categories?.length || 0} categories and ${importData.images?.length || 0} images restored.`, 
      { duration: 5000 }
    )
    console.log('Data imported successfully')
  } catch (error) {
    console.error('Failed to import data:', error)
    if (error instanceof SyntaxError) {
      toast.error('Invalid file format. Please select a valid Name That Thing backup file.', { duration: 5000 })
    } else {
      toast.error('Failed to import data. Please check the file and try again.', { duration: 5000 })
    }
    // Reset file input on error
    target.value = ''
  } finally {
    loading.value = false
  }
}

const clearAllData = async () => {
  try {
    loading.value = true
    
    // Clear IndexedDB
    await db.clearAllData()
    
    // Reload empty state in store
    await categoriesStore.loadCategories()
    
    showClearConfirm.value = false
    toast.success('All data cleared successfully', { duration: 4000 })
    console.log('All data cleared')
  } catch (error) {
    console.error('Failed to clear data:', error)
    toast.error('Failed to clear data. Please try again.', { duration: 5000 })
  } finally {
    loading.value = false
  }
}

const resetToDefaults = async () => {
  try {
    await settingsStore.resetSettings()
    console.log('Settings reset to defaults')
  } catch (error) {
    console.error('Failed to reset settings:', error)
  }
}

const saveSettingsManually = async () => {
  try {
    await settingsStore.saveSettings()
    console.log('Settings saved manually')
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await settingsStore.loadSettings()
})

// Watch for settings changes and auto-save
// TODO: Add watchers for settings changes
</script>

<style scoped lang="scss">
.settings {
  min-height: 100vh;
  background: var(--bg-primary);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    h1 {
      margin: 0;
      color: var(--text-primary);
    }
  }
}

.settings-main {
  padding: 2rem;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 3rem;
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--primary);
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.setting-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }
  
  p {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  small {
    display: block;
    margin-top: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
    line-height: 1.4;
    
    &:has(+ small) {
      margin-bottom: 0.25rem;
    }
  }
  
  button {
    min-width: 140px;
    
    span {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
}

.settings-form {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
    
    &:not(.checkbox-label) {
      margin-bottom: 0.5rem;
    }
  }
  
  input[type="number"], input[type="range"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
  
  input[type="range"] {
    padding: 0;
    height: 6px;
    background: var(--bg-secondary);
    cursor: pointer;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary);
      cursor: pointer;
    }
    
    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary);
      cursor: pointer;
      border: none;
    }
  }
  
  small {
    display: block;
    margin-top: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0 !important;
  
  input[type="checkbox"] {
    width: auto;
    margin: 0;
  }
}

.range-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.pixelation-controls-horizontal {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.pixelation-input {
  display: flex;
  flex-direction: column;
  flex: 1;
  
  label {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    text-align: center;
  }
  
  input[type="number"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    text-align: center;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.pixelation-controls {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.pixelation-level {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  
  label {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  input {
    margin-top: 0.5rem;
    
    &:disabled {
      background: var(--bg-secondary);
      color: var(--text-secondary);
      cursor: not-allowed;
    }
  }
  
  small {
    margin-top: 0.25rem;
    font-style: italic;
  }
}

.about-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--primary);
  }
  
  p {
    margin: 0.5rem 0;
    color: var(--text-secondary);
  }
}

.about-links {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--surface);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
}

.modal-header {
  padding: 1rem;
  background: var(--error-light);
  border-bottom: 1px solid var(--error);
  
  h3 {
    margin: 0;
    color: var(--error);
  }
}

.modal-body {
  padding: 1.5rem;
  
  p {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    
    &:last-of-type {
      margin-bottom: 1.5rem;
    }
  }
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
