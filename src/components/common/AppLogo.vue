<template>
  <div class="app-logo" :class="{ 'logo-large': size === 'large', 'logo-small': size === 'small' }">
    <div class="logo-icon">
      <img 
        src="/src/assets/ntt-logo.png" 
        alt="Name That Thing Logo"
        class="logo-image"
      />
    </div>
    <span v-if="showText" class="logo-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  text?: string
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
  showText: true,
  text: 'Name That Thing'
})
</script>

<style scoped lang="scss">
.app-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &.logo-small {
    gap: 0.5rem;
    
    .logo-icon {
      width: 36px;
      height: 36px;
    }
    
    .logo-text {
      font-size: 1rem;
      font-weight: 600;
    }
  }
  
  &.logo-large {
    gap: 1rem;
    
    .logo-icon {
      width: 72px;
      height: 72px;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
    }
  }
}

.logo-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  
  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  user-select: none;
  
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  // Fallback for browsers that don't support background-clip
  @supports not (-webkit-background-clip: text) {
    background: none;
    color: var(--primary);
  }
}
</style>
