<template>
  <div class="game-setup">
    <header class="setup-header">
      <h1>Name That Thing</h1>
      <div class="header-actions">
        <button @click="$router.push('/settings')" class="btn btn-secondary">
          Settings
        </button>
      </div>
    </header>

    <main class="setup-main">
      <div class="setup-content">
        <div class="categories-section">
          <div class="section-header">
            <h2>Categories</h2>
            <button @click="showCreateCategory = true" class="btn btn-primary">
              + Add Category
            </button>
          </div>
          
          <div v-if="categories.length === 0" class="empty-state">
            <p>No categories yet. Create your first category to get started!</p>
          </div>
          
          <div v-else class="categories-grid">
            <div 
              v-for="category in categoriesWithImageCount" 
              :key="category.id"
              class="category-card"
              :class="{ active: selectedCategory?.id === category.id }"
            >
              <div class="category-content" @click="selectCategory(category)">
                <h3>{{ category.name }}</h3>
                <p v-if="category.description">{{ category.description }}</p>
                <div class="category-stats">
                  <span class="image-count">{{ category.imageCount }} images</span>
                </div>
              </div>
              <div class="category-actions">
                <button 
                  @click.stop="openEditCategory(category)"
                  class="btn btn-sm btn-secondary"
                  title="Edit Category"
                >
                  ✏️ Edit
                </button>
                <button 
                  @click.stop="confirmDeleteCategory(category)"
                  class="btn btn-sm btn-danger"
                  title="Delete Category"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedCategory" class="images-section">
          <div class="section-header">
            <h2>Images - {{ selectedCategory.name }}</h2>
            <div class="header-actions">
              <button @click="startImageUpload" class="btn btn-primary">
                + Add Images
              </button>
              <button 
                @click="startGame" 
                :disabled="categoryImages.length === 0"
                class="btn btn-success"
              >
                Start Game
              </button>
            </div>
          </div>

          <div v-if="categoryImages.length === 0" class="empty-state">
            <p>No images in this category yet. Add some images to start playing!</p>
          </div>

          <div v-else class="images-grid">
            <div 
              v-for="image in categoryImages" 
              :key="image.id"
              class="image-card"
            >
              <ImageThumbnail :image="image" />
              <div class="image-actions">
                <button @click="removeImage(image.id)" class="btn btn-danger btn-sm">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Category Modal -->
    <div v-if="showCreateCategory" class="modal-overlay" @click="showCreateCategory = false">
      <div class="modal" @click.stop>
        <header class="modal-header">
          <h3>Create New Category</h3>
          <button @click="showCreateCategory = false" class="btn-close">&times;</button>
        </header>
        <form @submit.prevent="createCategory" class="modal-body">
          <div class="form-group">
            <label for="categoryName">Category Name</label>
            <input 
              id="categoryName"
              v-model="newCategory.name" 
              type="text" 
              required 
              placeholder="e.g., Movies, Animals, Landmarks"
            >
          </div>
          <div class="form-group">
            <label for="categoryDescription">Description (optional)</label>
            <textarea 
              id="categoryDescription"
              v-model="newCategory.description" 
              placeholder="Brief description of this category"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateCategory = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!newCategory.name">
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div v-if="showEditCategory" class="modal-overlay" @click="showEditCategory = false">
      <div class="modal" @click.stop>
        <header class="modal-header">
          <h3>Edit Category</h3>
          <button @click="showEditCategory = false" class="btn-close">&times;</button>
        </header>
        <form @submit.prevent="updateCategory" class="modal-body">
          <div class="form-group">
            <label for="editCategoryName">Category Name</label>
            <input 
              id="editCategoryName"
              v-model="editCategory.name" 
              type="text" 
              required 
              placeholder="e.g., Movies, Animals, Landmarks"
            >
          </div>
          <div class="form-group">
            <label for="editCategoryDescription">Description (optional)</label>
            <textarea 
              id="editCategoryDescription"
              v-model="editCategory.description" 
              placeholder="Brief description of this category"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showEditCategory = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!editCategory.name">
              Update Category
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Category Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="modal-overlay" @click="showDeleteConfirmation = false">
      <div class="modal" @click.stop>
        <header class="modal-header">
          <h3>Delete Category</h3>
          <button @click="showDeleteConfirmation = false" class="btn-close">&times;</button>
        </header>
        <div class="modal-body">
          <p>Are you sure you want to delete the category <strong>"{{ categoryToDelete?.name }}"</strong>?</p>
          <p v-if="categoryToDelete && getCategoryImageCount(categoryToDelete.id) > 0" class="warning-text">
            ⚠️ This will also delete <strong>{{ getCategoryImageCount(categoryToDelete.id) }} image(s)</strong> in this category.
          </p>
          <p class="text-muted">This action cannot be undone.</p>
          <div class="modal-actions">
            <button type="button" @click="showDeleteConfirmation = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="button" @click="deleteCategory" class="btn btn-danger">
              Delete Category
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- File Upload Input -->
    <input 
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      @change="handleFileUpload"
      style="display: none"
    >

    <!-- Upload Progress Modal -->
    <UploadProgress
      :show="showUploadProgress"
      :is-uploading="isUploading"
      :progress="uploadProgress"
      :errors="uploadErrors"
      :success-count="successfulUploads"
      title="Processing Images"
      @close="showUploadProgress = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoriesStore } from '@/stores/categories'
import { useGameStore } from '@/stores/game'
import { useSettingsStore } from '@/stores/settings'
import { useImageUpload } from '@/composables/useImageUpload'
import { useToast } from '@/composables/useToast'
import UploadProgress from '@/components/setup/UploadProgress.vue'
import ImageThumbnail from '@/components/setup/ImageThumbnail.vue'
import type { Category } from '@/types'

const router = useRouter()
const categoriesStore = useCategoriesStore()
const gameStore = useGameStore()
const settingsStore = useSettingsStore()
const toast = useToast()
const { 
  isUploading, 
  uploadProgress, 
  uploadErrors, 
  uploadImages,
  validateFiles,
  clearErrors 
} = useImageUpload()

// State
const selectedCategory = ref<Category | null>(null)
const showCreateCategory = ref(false)
const showEditCategory = ref(false)
const showUploadProgress = ref(false)
const successfulUploads = ref(0)
const fileInput = ref<HTMLInputElement>()

const showDeleteConfirmation = ref(false)
const newCategory = ref({
  name: '',
  description: ''
})
const editCategory = ref({
  id: '',
  name: '',
  description: ''
})
const categoryToDelete = ref<Category | null>(null)

// Computed
const categories = computed(() => categoriesStore.categories)
const categoriesWithImageCount = computed(() => categoriesStore.categoriesWithImageCount)
const categoryImages = computed(() => {
  return selectedCategory.value 
    ? categoriesStore.getImagesByCategory(selectedCategory.value.id)
    : []
})

const getCategoryImageCount = (categoryId: string) => {
  return categoriesStore.getImagesByCategory(categoryId).length
}

// Methods
const selectCategory = (category: Category) => {
  selectedCategory.value = category
}

const createCategory = async () => {
  try {
    const category = await categoriesStore.addCategory({
      name: newCategory.value.name,
      description: newCategory.value.description || undefined
    })
    
    selectedCategory.value = category
    showCreateCategory.value = false
    newCategory.value = { name: '', description: '' }
    toast.success(`Category "${category.name}" created successfully!`)
  } catch (error) {
    console.error('Failed to create category:', error)
    toast.error('Failed to create category. Please try again.')
  }
}

const openEditCategory = (category: Category) => {
  editCategory.value = {
    id: category.id,
    name: category.name,
    description: category.description || ''
  }
  showEditCategory.value = true
}

const updateCategory = async () => {
  try {
    await categoriesStore.updateCategory(editCategory.value.id, {
      name: editCategory.value.name,
      description: editCategory.value.description || undefined
    })
    
    showEditCategory.value = false
    editCategory.value = { id: '', name: '', description: '' }
    toast.success('Category updated successfully!')
  } catch (error) {
    console.error('Failed to update category:', error)
    toast.error('Failed to update category. Please try again.')
  }
}

const confirmDeleteCategory = (category: Category) => {
  categoryToDelete.value = category
  showDeleteConfirmation.value = true
}

const deleteCategory = async () => {
  if (!categoryToDelete.value) return
  
  try {
    const categoryName = categoryToDelete.value.name
    const imageCount = getCategoryImageCount(categoryToDelete.value.id)
    
    await categoriesStore.deleteCategory(categoryToDelete.value.id)
    
    // Clear selected category if it was the one being deleted
    if (selectedCategory.value?.id === categoryToDelete.value.id) {
      selectedCategory.value = null
    }
    
    showDeleteConfirmation.value = false
    categoryToDelete.value = null
    
    if (imageCount > 0) {
      toast.success(`Category "${categoryName}" and ${imageCount} image(s) deleted successfully!`)
    } else {
      toast.success(`Category "${categoryName}" deleted successfully!`)
    }
  } catch (error) {
    console.error('Failed to delete category:', error)
    toast.error('Failed to delete category. Please try again.')
  }
}

const startImageUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || !selectedCategory.value) return

  // Validate files first
  const { valid, invalid } = validateFiles(files)
  
  if (invalid.length > 0) {
    // Show validation errors
    invalid.forEach(({ file, reason }) => {
      toast.warning(`${file.name}: ${reason}`)
    })
  }

  if (valid.length === 0) {
    target.value = ''
    return
  }

  try {
    // Show upload progress modal
    showUploadProgress.value = true
    clearErrors()
    successfulUploads.value = 0

    // Upload and process images
    const result = await uploadImages(valid, selectedCategory.value.id, {
      maxWidth: settingsStore.settings.maxImageSize,
      minWidth: settingsStore.settings.minImageSize,
      quality: settingsStore.settings.compressionQuality,
      onImageProcessed: async (image) => {
        // Add processed image to store
        console.log('Processing image:', image.originalName, 'for category:', selectedCategory.value!.id)
        await categoriesStore.addImageToCategory(selectedCategory.value!.id, image)
        console.log('Image added to store. Total images now:', categoriesStore.images.length)
        successfulUploads.value += 1
      },
      onError: (fileName, error) => {
        console.error(`Failed to process ${fileName}:`, error)
        toast.error(`Failed to process ${fileName}`)
      }
    })

    const successCount = result.successful.length
    const failedCount = result.failed.length
    
    if (successCount > 0 && failedCount === 0) {
      toast.success(`Successfully added ${successCount} image${successCount === 1 ? '' : 's'}!`)
    } else if (successCount > 0 && failedCount > 0) {
      toast.warning(`Added ${successCount} images, ${failedCount} failed`)
    } else {
      toast.error('All images failed to process')
    }

    // Force reload categories and images to ensure UI updates
    if (successCount > 0) {
      console.log('Reloading categories after successful uploads...')
      await categoriesStore.loadCategories()
    }

    console.log(`Upload complete: ${successCount} successful, ${failedCount} failed`)
  } catch (error) {
    console.error('Upload failed:', error)
    toast.error('Upload failed. Please try again.')
  }
  
  // Reset file input
  target.value = ''
}

const removeImage = async (imageId: string) => {
  try {
    await categoriesStore.removeImageFromCategory(imageId)
    toast.success('Image removed successfully')
  } catch (error) {
    console.error('Failed to remove image:', error)
    toast.error('Failed to remove image. Please try again.')
  }
}

const startGame = async () => {
  if (!selectedCategory.value || categoryImages.value.length === 0) return

  try {
    await gameStore.startGame(selectedCategory.value, categoryImages.value)
    toast.success('Game started! Good luck!')
    router.push('/play')
  } catch (error) {
    console.error('Failed to start game:', error)
    toast.error('Failed to start game. Please try again.')
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Load settings first
    await settingsStore.loadSettings()
    
    // Then load categories
    await categoriesStore.loadCategories()
    console.log('Categories loaded:', categoriesStore.categories.length)
    console.log('Images loaded:', categoriesStore.images.length)
    console.log('Settings loaded:', settingsStore.settings)
  } catch (error) {
    console.error('Failed to load data:', error)
    toast.error('Failed to load data')
  }
})
</script>

<style scoped lang="scss">
.game-setup {
  min-height: 100vh;
  background: var(--bg-primary);
}

.setup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  
  h1 {
    color: var(--primary);
    margin: 0;
  }
}

.setup-main {
  padding: 2rem;
}

.setup-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h2 {
    margin: 0;
    color: var(--text-primary);
  }
}

.categories-grid {
  display: grid;
  gap: 1rem;
}

.category-card {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  
  &:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
  }
  
  &.active {
    border-color: var(--primary);
    background: var(--primary-light);
  }
}

.category-content {
  padding: 1rem;
  cursor: pointer;
  flex: 1;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }
  
  p {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
}

.category-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  
  .btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    
    &.btn-sm {
      padding: 0.375rem 0.75rem;
    }
  }
}

.category-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .image-count {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.image-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.image-actions {
  padding: 0.75rem;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  
  p {
    margin: 0;
  }
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
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
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
    
    &:hover {
      color: var(--text-primary);
    }
  }
}

.modal-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
  }
  
  input, textarea {
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
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.warning-text {
  color: var(--warning, #f59e0b);
  font-weight: 500;
  margin: 1rem 0;
  padding: 0.75rem;
  background: var(--warning-light, rgba(245, 158, 11, 0.1));
  border: 1px solid var(--warning-light, rgba(245, 158, 11, 0.2));
  border-radius: 4px;
}

.text-muted {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-style: italic;
}

.modal-body p {
  margin: 0.75rem 0;
  line-height: 1.5;
  
  &:first-child {
    margin-top: 0;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}
</style>
