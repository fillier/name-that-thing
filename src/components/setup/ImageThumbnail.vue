<template>
  <div class="image-thumbnail" :class="{ loading }">
    <div v-if="loading" class="thumbnail-loading">
      <div class="spinner"></div>
    </div>
    <img
      v-else-if="thumbnailUrl"
      :src="thumbnailUrl"
      :alt="image.originalName"
      class="thumbnail-image"
      @load="onLoad"
      @error="onError"
    />
    <div v-else class="thumbnail-error">
      <span>⚠️</span>
      <small>Failed to load</small>
    </div>
    
    <div class="thumbnail-overlay">
      <div class="image-name">{{ image.originalName }}</div>
      <div class="image-meta">
        {{ formatFileSize(image.processedSize) }} • {{ image.dimensions.width }}×{{ image.dimensions.height }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { GameImage } from '@/types'
import { formatFileSize } from '@/utils'

interface Props {
  image: GameImage
}

const props = defineProps<Props>()

const thumbnailUrl = ref<string>('')
const loading = ref(true)

const createThumbnail = () => {
  // Use level 3 (lightly pixelated) as thumbnail for preview
  const blob = props.image.pixelationLevels?.level3
  console.log('ImageThumbnail: Creating thumbnail for', props.image.originalName)
  console.log('ImageThumbnail: Blob exists:', !!blob, 'Size:', blob?.size || 0)
  
  if (blob && blob.size > 0) {
    thumbnailUrl.value = URL.createObjectURL(blob)
    console.log('ImageThumbnail: Created object URL:', thumbnailUrl.value)
  } else {
    console.warn('ImageThumbnail: No valid blob for image', props.image.originalName)
  }
  loading.value = false
}

const onLoad = () => {
  loading.value = false
}

const onError = () => {
  loading.value = false
  if (thumbnailUrl.value) {
    URL.revokeObjectURL(thumbnailUrl.value)
    thumbnailUrl.value = ''
  }
}

const cleanup = () => {
  if (thumbnailUrl.value) {
    URL.revokeObjectURL(thumbnailUrl.value)
    thumbnailUrl.value = ''
  }
}

onMounted(() => {
  createThumbnail()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.image-thumbnail {
  position: relative;
  aspect-ratio: 16/9;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  transition: all var(--transition-fast);
  
  &:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  &.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.thumbnail-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--bg-primary);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-secondary);
  font-size: 0.8rem;
  
  span {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }
}

.thumbnail-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 0.75rem 0.5rem 0.5rem;
  font-size: var(--font-size-xs);
  transform: translateY(100%);
  transition: transform var(--transition-fast);
  
  .image-thumbnail:hover & {
    transform: translateY(0);
  }
}

.image-name {
  font-weight: var(--font-medium);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  opacity: 0.8;
  font-size: var(--font-size-xs);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
