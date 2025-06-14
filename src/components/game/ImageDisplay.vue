<template>
  <div class="image-display-container" :class="{ fullscreen }">
    <div v-if="!image" class="no-image">
      <div class="no-image-content">
        <div class="no-image-icon">🖼️</div>
        <p>No image selected</p>
        <p class="text-secondary">Select a category with images to start playing</p>
      </div>
    </div>
    
    <div v-else class="image-wrapper">
      <div class="image-container" :style="imageContainerStyle">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="image.originalName"
          class="game-image"
          @load="onImageLoad"
          @error="onImageError"
        />
        <div v-else-if="loading" class="image-loading">
          <div class="spinner large"></div>
          <p>Loading image...</p>
        </div>
        <div v-else-if="error" class="image-error">
          <div class="error-icon">⚠️</div>
          <p>Failed to load image</p>
          <p class="text-secondary">{{ error }}</p>
        </div>
      </div>
      
      <!-- Image Info Overlay -->
      <div v-if="showInfo && !fullscreen" class="image-info">
        <div class="info-item">
          <span class="info-label">File:</span>
          <span class="info-value">{{ image.originalName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Dimensions:</span>
          <span class="info-value">{{ image.dimensions.width }}×{{ image.dimensions.height }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Level:</span>
          <span class="info-value">{{ pixelationLevel }}/4</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { GameImage, PixelationLevel } from '@/types'
import { ImageProcessingService } from '@/services/imageProcessing'

interface Props {
  image?: GameImage | null
  pixelationLevel: PixelationLevel
  fullscreen?: boolean
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  image: null,
  fullscreen: false,
  showInfo: false
})

const imageUrl = ref<string>('')
const loading = ref(false)
const error = ref<string>('')
const imageLoaded = ref(false)

// Computed styles
const imageContainerStyle = computed(() => {
  if (!props.fullscreen) return {}
  
  return {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

// Helper functions
const cleanupImageUrl = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
}

const loadImage = async (image: GameImage, level: PixelationLevel) => {
  loading.value = true
  error.value = ''
  imageLoaded.value = false
  
  console.log(`ImageDisplay: Loading image ${image.originalName} at level ${level}`)
  
  // Clean up previous URL
  cleanupImageUrl()

  try {
    const levelKey = `level${level}` as keyof GameImage['pixelationLevels']
    const blob = image.pixelationLevels[levelKey]
    
    console.log(`ImageDisplay: Blob for level ${level}:`, {
      exists: !!blob,
      isNull: blob === null,
      size: blob?.size || 0,
      type: blob?.type || 'unknown'
    })
    
    if (!blob || blob.size === 0) {
      throw new Error(`No valid blob found for level ${level}. Blob exists: ${!!blob}, Size: ${blob?.size || 0}`)
    }

    imageUrl.value = URL.createObjectURL(blob)
    console.log(`ImageDisplay: Created object URL for level ${level}:`, imageUrl.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load image'
    console.error('ImageDisplay: Failed to load image:', err)
    console.error('ImageDisplay: Available pixelation levels:', Object.keys(image.pixelationLevels))
    console.error('ImageDisplay: Blob sizes:', Object.entries(image.pixelationLevels).map(([key, blob]) => `${key}: ${blob?.size || 0}`))
    
    // Try to fall back to a different level if available, prioritizing higher quality levels
    const levelPriority = ['level4', 'level3', 'level2', 'level1'] // Prefer less pixelated levels as fallback
    const availableLevels = levelPriority.filter(levelKey => {
      const blob = image.pixelationLevels[levelKey as keyof GameImage['pixelationLevels']]
      return blob && blob.size > 0
    })
    
    if (availableLevels.length > 0) {
      console.warn(`ImageDisplay: Trying fallback to available level:`, availableLevels[0])
      const fallbackKey = availableLevels[0] as keyof GameImage['pixelationLevels']
      const fallbackBlob = image.pixelationLevels[fallbackKey]
      if (fallbackBlob) {
        imageUrl.value = URL.createObjectURL(fallbackBlob)
        error.value = `Level ${level} unavailable, showing ${fallbackKey.replace('level', 'Level ')} as fallback`
      }
    } else {
      // No valid levels found - this is a serious data integrity issue
      error.value = `No valid pixelation levels found for ${image.originalName}. Image data may be corrupted. Please try re-uploading this image.`
      console.error('ImageDisplay: No valid pixelation levels available:', image.pixelationLevels)
    }
  } finally {
    loading.value = false
  }
}

const onImageLoad = () => {
  imageLoaded.value = true
  loading.value = false
  error.value = ''
}

const onImageError = () => {
  loading.value = false
  error.value = 'Failed to display image'
  imageLoaded.value = false
}

// Watch for image and pixelation level changes
watch(
  [() => props.image, () => props.pixelationLevel],
  async ([newImage, newLevel], [oldImage, oldLevel]) => {
    if (!newImage) {
      cleanupImageUrl()
      return
    }

    // Only reload if image or level changed
    if (newImage !== oldImage || newLevel !== oldLevel) {
      await loadImage(newImage, newLevel)
    }
  },
  { immediate: true }
)

// Cleanup on unmount
onUnmounted(() => {
  cleanupImageUrl()
})
</script>

<style scoped lang="scss">
.image-display-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  
  &.fullscreen {
    background: #000;
    border-radius: 0;
  }
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.no-image-content {
  text-align: center;
  color: var(--text-secondary);
  
  .no-image-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0.5rem 0;
    
    &:first-of-type {
      font-size: 1.2rem;
      color: var(--text-primary);
      font-weight: var(--font-medium);
    }
  }
}

.image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.game-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
  
  .fullscreen & {
    border-radius: 0;
    box-shadow: none;
  }
}

.image-loading, .image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  
  .fullscreen & {
    color: rgba(255, 255, 255, 0.7);
  }
}

.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(37, 99, 235, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 1s linear infinite;
  
  &.large {
    width: 3rem;
    height: 3rem;
    border-width: 4px;
  }
  
  .fullscreen & {
    border-color: rgba(255, 255, 255, 0.3);
    border-top-color: white;
  }
}

.error-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.image-info {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  backdrop-filter: blur(10px);
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .info-label {
    color: rgba(255, 255, 255, 0.7);
    font-weight: var(--font-medium);
  }
  
  .info-value {
    color: white;
    font-family: 'Monaco', 'Menlo', monospace;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
