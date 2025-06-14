<template>
  <div 
    class="game-play" 
    :class="{ fullscreen: isFullscreen }"
    @keydown="handleKeydown"
    tabindex="0"
    role="application"
    aria-label="Name That Thing Game"
  >
    <header v-if="!isFullscreen" class="play-header">
      <div class="header-left">
        <button @click="$router.push('/setup')" class="btn btn-secondary" aria-label="Go back to setup">
          ← Back to Setup
        </button>
        <AppLogo size="small" :text="currentCategory?.name || 'Game'" />
      </div>
      <div class="header-right">
        <button @click="toggleFullscreen" class="btn btn-primary" aria-label="Enter fullscreen mode">
          📺 Fullscreen
        </button>
      </div>
    </header>

    <main class="play-main">
      <div class="game-container">
        <!-- Game Image Display -->
        <div class="image-display">
          <ImageDisplay
            :image="currentImage"
            :pixelation-level="currentPixelationLevel"
            :fullscreen="isFullscreen"
            :show-info="false"
          />
        </div>

        <!-- Game Controls -->
        <div class="game-controls">
          <div class="controls-row">
            <!-- Image Navigation -->
            <div class="nav-controls">
              <button 
                @click="previousImage" 
                :disabled="!canGoPrevious"
                class="btn btn-secondary"
                aria-label="Go to previous image"
              >
                ← Previous
              </button>
              <button 
                @click="nextImage" 
                :disabled="!canGoNext"
                class="btn btn-secondary"
                aria-label="Go to next image"
              >
                Next →
              </button>
            </div>

            <!-- Pixelation Controls -->
            <div class="reveal-controls">
              <button 
                @click="resetImage" 
                class="btn btn-warning"
                aria-label="Reset image to most pixelated level"
              >
                🔄 Reset
              </button>
              <button 
                @click="revealMore" 
                :disabled="!canRevealMore"
                class="btn btn-primary"
                aria-label="Reveal more detail"
              >
                👁️ Reveal More
              </button>
            </div>
          </div>

          <!-- Progress Indicator -->
          <div v-if="gameSettings.showProgress" class="progress-section">
            <div class="progress-info">
              <span>Image {{ gameProgress.current }} of {{ gameProgress.total }}</span>
              <span>{{ gameProgress.percentage }}% Complete</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${gameProgress.percentage}%` }"
              ></div>
            </div>
          </div>

          <!-- Pixelation Level Indicator -->
          <div class="pixelation-indicator">
            <span>Clarity Level:</span>
            <div class="level-dots">
              <div 
                v-for="level in 4" 
                :key="level"
                class="level-dot"
                :class="{ 
                  active: level <= currentPixelationLevel,
                  current: level === currentPixelationLevel 
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Fullscreen Controls -->
    <div v-if="isFullscreen" class="fullscreen-controls">
      <button @click="toggleFullscreen" class="btn btn-secondary btn-sm">
        ❌ Exit Fullscreen
      </button>
      <button @click="pauseGame" class="btn btn-warning btn-sm">
        ⏸️ Pause
      </button>
    </div>

    <!-- Game Paused Modal -->
    <div v-if="gameMode === 'paused'" class="modal-overlay">
      <div class="modal">
        <header class="modal-header">
          <h3>Game Paused</h3>
        </header>
        <div class="modal-body">
          <p>The game is currently paused.</p>
          <div class="modal-actions">
            <button @click="resumeGame" class="btn btn-primary">
              ▶️ Resume Game
            </button>
            <button @click="endGame" class="btn btn-danger">
              🛑 End Game
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import ImageDisplay from '@/components/game/ImageDisplay.vue'
import AppLogo from '@/components/common/AppLogo.vue'

const router = useRouter()
const gameStore = useGameStore()

// Computed
const currentCategory = computed(() => gameStore.currentCategory)
const currentImage = computed(() => gameStore.currentImage)
const currentPixelationLevel = computed(() => gameStore.currentPixelationLevel)
const gameMode = computed(() => gameStore.gameMode)
const isFullscreen = computed(() => gameStore.isFullscreen)
const gameProgress = computed(() => gameStore.gameProgress)
const gameSettings = computed(() => gameStore.gameSettings)
const canGoNext = computed(() => gameStore.canGoNext)
const canGoPrevious = computed(() => gameStore.canGoPrevious)
const canRevealMore = computed(() => gameStore.canRevealMore)
const isGameReady = computed(() => gameStore.isGameReady)

// Methods
const nextImage = () => gameStore.nextImage()
const previousImage = () => gameStore.previousImage()
const revealMore = () => gameStore.revealMore()
const resetImage = () => gameStore.resetImage()
const toggleFullscreen = () => gameStore.toggleFullscreen()
const pauseGame = () => gameStore.pauseGame()
const resumeGame = () => gameStore.resumeGame()

const endGame = () => {
  gameStore.endGame()
  router.push('/setup')
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (gameMode.value !== 'playing') return

  switch (event.key) {
    case 'ArrowRight':
    case ' ':
      event.preventDefault()
      if (canRevealMore.value) {
        revealMore()
      } else if (canGoNext.value) {
        nextImage()
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      previousImage()
      break
    case 'r':
    case 'R':
      event.preventDefault()
      resetImage()
      break
    case 'f':
    case 'F':
      event.preventDefault()
      toggleFullscreen()
      break
    case 'Escape':
      if (isFullscreen.value) {
        toggleFullscreen()
      } else {
        pauseGame()
      }
      break
  }
}

// Lifecycle
onMounted(() => {
  // Redirect if no game is ready
  if (!isGameReady.value) {
    router.push('/setup')
    return
  }

  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.game-play {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  
  &.fullscreen {
    background: #000;
    
    .play-main {
      padding: 0;
    }
    
    .game-container {
      height: 100vh;
      max-width: none;
      background: #000;
    }
    
    .image-display {
      flex: 1;
    }
    
    .game-controls {
      background: rgba(0, 0, 0, 0.8);
      color: white;
    }
  }
}

.play-header {
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

.play-main {
  flex: 1;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-container {
  width: 100%;
  max-width: 1200px;
  height: 80vh;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.image-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  position: relative;
}

.game-controls {
  padding: 1.5rem;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
}

.nav-controls, .reveal-controls {
  display: flex;
  gap: 0.5rem;
}

.progress-section {
  margin-bottom: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.progress-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
}

.pixelation-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  
  span {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
}

.level-dots {
  display: flex;
  gap: 0.5rem;
}

.level-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  transition: all 0.2s ease;
  
  &.active {
    background: var(--primary);
    border-color: var(--primary);
  }
  
  &.current {
    transform: scale(1.2);
    box-shadow: 0 0 0 2px var(--primary-light);
  }
}

.fullscreen-controls {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--surface);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  
  h3 {
    margin: 0;
    color: var(--text-primary);
  }
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
  
  p {
    margin: 0 0 1.5rem 0;
    color: var(--text-secondary);
  }
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
