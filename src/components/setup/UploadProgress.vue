<template>
  <div v-if="show" class="upload-progress-overlay">
    <div class="upload-progress-modal">
      <div class="progress-header">
        <h3>{{ title }}</h3>
        <button 
          v-if="!isUploading" 
          @click="$emit('close')"
          class="btn-close"
        >
          ×
        </button>
      </div>
      
      <div class="progress-body">
        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="progress-info">
            <span>{{ progress.current }} of {{ progress.total }} images</span>
            <span>{{ progress.percentage }}%</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${progress.percentage}%` }"
            ></div>
          </div>
          <div v-if="progress.currentFileName" class="current-file">
            Processing: {{ progress.currentFileName }}
          </div>
        </div>

        <!-- Success Count -->
        <div v-if="successCount > 0" class="result-section success">
          <div class="result-icon">✅</div>
          <div class="result-text">
            <strong>{{ successCount }}</strong> image{{ successCount === 1 ? '' : 's' }} processed successfully
          </div>
        </div>

        <!-- Errors -->
        <div v-if="errors.length > 0" class="result-section error">
          <div class="result-icon">❌</div>
          <div class="result-text">
            <strong>{{ errors.length }}</strong> error{{ errors.length === 1 ? '' : 's' }}
          </div>
          <div class="error-list">
            <div 
              v-for="error in errors.slice(0, 5)" 
              :key="error.fileName"
              class="error-item"
            >
              <strong>{{ error.fileName }}:</strong> {{ error.error }}
            </div>
            <div v-if="errors.length > 5" class="error-more">
              + {{ errors.length - 5 }} more errors
            </div>
          </div>
        </div>

        <!-- Loading Spinner -->
        <div v-if="isUploading" class="loading-section">
          <div class="spinner"></div>
          <p>Processing images...</p>
        </div>
      </div>

      <div v-if="!isUploading" class="progress-footer">
        <button @click="$emit('close')" class="btn btn-primary">
          {{ errors.length > 0 ? 'Close' : 'Done' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadProgress } from '@/composables/useImageUpload'

interface Props {
  show: boolean
  isUploading: boolean
  progress: UploadProgress
  errors: Array<{ fileName: string; error: string }>
  successCount: number
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Uploading Images'
})

defineEmits<{
  close: []
}>()
</script>

<style scoped lang="scss">
.upload-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.upload-progress-modal {
  background: var(--surface);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  
  h3 {
    margin: 0;
    color: var(--text-primary);
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius);
    
    &:hover {
      background: var(--bg-primary);
      color: var(--text-primary);
    }
  }
}

.progress-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.progress-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
  border-radius: var(--radius);
}

.current-file {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 0.5rem;
}

.result-section {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: var(--radius);
  
  &.success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
}

.result-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.result-text {
  flex: 1;
  color: var(--text-primary);
}

.error-list {
  margin-top: 0.75rem;
  font-size: var(--font-size-sm);
}

.error-item {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.05);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  
  strong {
    color: var(--error);
  }
}

.error-more {
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 0.5rem;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--bg-secondary);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  p {
    margin: 0;
    color: var(--text-secondary);
  }
}

.progress-footer {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
