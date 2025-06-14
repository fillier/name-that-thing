import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameState, Category, GameImage, PixelationLevel } from '@/types'

export const useGameStore = defineStore('game', () => {
  // State
  const currentCategory = ref<Category | null>(null)
  const currentImages = ref<GameImage[]>([])
  const currentImageIndex = ref(0)
  const currentPixelationLevel = ref<PixelationLevel>(1)
  const gameMode = ref<GameState['gameMode']>('setup')
  const isFullscreen = ref(false)
  const gameSettings = ref({
    showProgress: true,
    autoAdvance: false,
    shuffleImages: false
  })

  // Getters
  const currentImage = computed(() => {
    return currentImages.value[currentImageIndex.value] || null
  })

  const currentImageBlob = computed(() => {
    if (!currentImage.value) return null
    
    const level = `level${currentPixelationLevel.value}` as keyof GameImage['pixelationLevels']
    return currentImage.value.pixelationLevels[level]
  })

  const gameProgress = computed(() => {
    if (currentImages.value.length === 0) {
      return { current: 0, total: 0, percentage: 0 }
    }
    
    return {
      current: currentImageIndex.value + 1,
      total: currentImages.value.length,
      percentage: Math.round(((currentImageIndex.value + 1) / currentImages.value.length) * 100)
    }
  })

  const canGoNext = computed(() => {
    return currentImageIndex.value < currentImages.value.length - 1
  })

  const canGoPrevious = computed(() => {
    return currentImageIndex.value > 0
  })

  const canRevealMore = computed(() => {
    return currentPixelationLevel.value < 4
  })

  const isGameReady = computed(() => {
    return currentCategory.value !== null && currentImages.value.length > 0
  })

  // Actions
  const startGame = async (category: Category, images: GameImage[]) => {
    try {
      currentCategory.value = category
      currentImages.value = gameSettings.value.shuffleImages 
        ? [...images].sort(() => Math.random() - 0.5)
        : images
      currentImageIndex.value = 0
      currentPixelationLevel.value = 1
      gameMode.value = 'playing'
    } catch (err) {
      console.error('Failed to start game:', err)
      throw err
    }
  }

  const nextImage = () => {
    if (canGoNext.value) {
      currentImageIndex.value++
      currentPixelationLevel.value = 1 // Reset to most pixelated
    }
  }

  const previousImage = () => {
    if (canGoPrevious.value) {
      currentImageIndex.value--
      currentPixelationLevel.value = 1 // Reset to most pixelated
    }
  }

  const revealMore = () => {
    if (canRevealMore.value) {
      currentPixelationLevel.value = (currentPixelationLevel.value + 1) as PixelationLevel
    }
  }

  const resetImage = () => {
    currentPixelationLevel.value = 1
  }

  const goToImage = (index: number) => {
    if (index >= 0 && index < currentImages.value.length) {
      currentImageIndex.value = index
      currentPixelationLevel.value = 1
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen.value) {
        await document.documentElement.requestFullscreen()
        isFullscreen.value = true
      } else {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    } catch (err) {
      console.error('Failed to toggle fullscreen:', err)
    }
  }

  const pauseGame = () => {
    gameMode.value = 'paused'
  }

  const resumeGame = () => {
    gameMode.value = 'playing'
  }

  const endGame = () => {
    gameMode.value = 'setup'
    currentCategory.value = null
    currentImages.value = []
    currentImageIndex.value = 0
    currentPixelationLevel.value = 1
    isFullscreen.value = false
  }

  const updateGameSettings = (settings: Partial<typeof gameSettings.value>) => {
    gameSettings.value = { ...gameSettings.value, ...settings }
  }

  // Handle fullscreen change events
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  // Initialize fullscreen event listener
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
  }

  return {
    // State
    currentCategory,
    currentImages,
    currentImageIndex,
    currentPixelationLevel,
    gameMode,
    isFullscreen,
    gameSettings,
    
    // Getters
    currentImage,
    currentImageBlob,
    gameProgress,
    canGoNext,
    canGoPrevious,
    canRevealMore,
    isGameReady,
    
    // Actions
    startGame,
    nextImage,
    previousImage,
    revealMore,
    resetImage,
    goToImage,
    toggleFullscreen,
    pauseGame,
    resumeGame,
    endGame,
    updateGameSettings
  }
})
