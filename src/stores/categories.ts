import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Category, GameImage } from '@/types'
import { db } from '@/services/database'
import { ImageProcessingService } from '@/services/imageProcessing'

export const useCategoriesStore = defineStore('categories', () => {
  // State
  const categories = ref<Category[]>([])
  const images = ref<GameImage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getCategoryById = computed(() => {
    return (id: string) => categories.value.find((cat: Category) => cat.id === id)
  })

  const getImagesByCategory = computed(() => {
    return (categoryId: string) => images.value.filter((img: GameImage) => img.categoryId === categoryId)
  })

  const categoriesWithImageCount = computed(() => {
    return categories.value.map((category: Category) => ({
      ...category,
      imageCount: images.value.filter((img: GameImage) => img.categoryId === category.id).length
    }))
  })

  // Actions
  const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'imageIds'>) => {
    try {
      loading.value = true
      error.value = null

      const newCategory: Category = {
        id: crypto.randomUUID(),
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
        imageIds: []
      }

      categories.value.push(newCategory)
      
      // Save to IndexedDB
      await db.saveCategory(newCategory)
      return newCategory
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      loading.value = true
      error.value = null

      const categoryIndex = categories.value.findIndex((cat: Category) => cat.id === id)
      if (categoryIndex === -1) {
        throw new Error('Category not found')
      }

      const updatedCategory = {
        ...categories.value[categoryIndex],
        ...updates,
        updatedAt: new Date()
      }

      categories.value[categoryIndex] = updatedCategory

      // Save to IndexedDB
      await db.saveCategory(updatedCategory)
      return updatedCategory
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      // Remove from state
      categories.value = categories.value.filter((cat: Category) => cat.id !== id)
      
      // Remove all images in this category
      const categoryImages = images.value.filter((img: GameImage) => img.categoryId === id)
      for (const image of categoryImages) {
        await db.deleteImage(image.id)
      }
      images.value = images.value.filter((img: GameImage) => img.categoryId !== id)

      // Delete from IndexedDB
      await db.deleteCategory(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addImageToCategory = async (categoryId: string, image: GameImage) => {
    try {
      loading.value = true
      error.value = null

      // Add image to state
      images.value.push(image)

      // Update category's imageIds
      const categoryIndex = categories.value.findIndex((cat: Category) => cat.id === categoryId)
      if (categoryIndex !== -1) {
        categories.value[categoryIndex].imageIds.push(image.id)
        categories.value[categoryIndex].updatedAt = new Date()
        
        // Create a clean copy for database storage
        const categoryToSave = {
          id: categories.value[categoryIndex].id,
          name: categories.value[categoryIndex].name,
          description: categories.value[categoryIndex].description,
          createdAt: categories.value[categoryIndex].createdAt instanceof Date 
            ? categories.value[categoryIndex].createdAt.toISOString()
            : categories.value[categoryIndex].createdAt,
          updatedAt: categories.value[categoryIndex].updatedAt instanceof Date 
            ? categories.value[categoryIndex].updatedAt.toISOString()
            : categories.value[categoryIndex].updatedAt,
          imageIds: categories.value[categoryIndex].imageIds,
          settings: categories.value[categoryIndex].settings ? {
            shuffleImages: categories.value[categoryIndex].settings.shuffleImages,
            showFileName: categories.value[categoryIndex].settings.showFileName
          } : undefined
        }
        
        await db.saveCategory(categoryToSave)
      }

      // Save to IndexedDB
      await db.saveImage(image)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add image'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeImageFromCategory = async (imageId: string) => {
    try {
      loading.value = true
      error.value = null

      const image = images.value.find((img: GameImage) => img.id === imageId)
      if (!image) {
        throw new Error('Image not found')
      }

      // Remove image
      images.value = images.value.filter((img: GameImage) => img.id !== imageId)

      // Update category's imageIds
      const categoryIndex = categories.value.findIndex((cat: Category) => cat.id === image.categoryId)
      if (categoryIndex !== -1) {
        categories.value[categoryIndex].imageIds = categories.value[categoryIndex].imageIds.filter((id: string) => id !== imageId)
        categories.value[categoryIndex].updatedAt = new Date()
        await db.saveCategory(categories.value[categoryIndex])
      }

      // Delete from IndexedDB
      await db.deleteImage(imageId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove image'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadCategories = async () => {
    try {
      loading.value = true
      error.value = null
      
      console.log('Loading categories and images from database...')
      
      // Initialize database
      await db.init()
      console.log('Database initialized')
      
      // Load from IndexedDB
      const [loadedCategories, loadedImages] = await Promise.all([
        db.getCategories(),
        db.getImages()
      ])
      
      console.log('Loaded from database:', loadedCategories.length, 'categories,', loadedImages.length, 'images')
      
      // Validate and fix incomplete images before setting state
      console.log('Validating loaded images...')
      const validatedImages: GameImage[] = []
      
      for (const image of loadedImages) {
        // Ensure dates are Date objects (convert from string if needed)
        const imageWithDateObjects = {
          ...image,
          metadata: {
            ...image.metadata,
            uploadedAt: image.metadata.uploadedAt instanceof Date 
              ? image.metadata.uploadedAt 
              : new Date(image.metadata.uploadedAt),
            processedAt: image.metadata.processedAt instanceof Date 
              ? image.metadata.processedAt 
              : new Date(image.metadata.processedAt)
          }
        }
        
        console.log(`Validating image ${imageWithDateObjects.originalName}:`, {
          level1: imageWithDateObjects.pixelationLevels.level1?.size || 0,
          level2: imageWithDateObjects.pixelationLevels.level2?.size || 0,
          level3: imageWithDateObjects.pixelationLevels.level3?.size || 0,
          level4: imageWithDateObjects.pixelationLevels.level4?.size || 0
        })
        
        const isValid = ImageProcessingService.validatePixelationLevels(imageWithDateObjects.pixelationLevels)
        
        if (!isValid) {
          console.warn(`Image ${imageWithDateObjects.originalName} has incomplete pixelation levels, checking if regeneration is possible...`)
          
          try {
            // CRITICAL: Only attempt regeneration if we have the original (level4) available
            // Never regenerate from pixelated levels as this corrupts image quality
            const originalSourceBlob = imageWithDateObjects.pixelationLevels.level4
            
            if (originalSourceBlob && originalSourceBlob.size > 0) {
              console.log(`Regenerating ${imageWithDateObjects.originalName} from original source (${originalSourceBlob.size} bytes)...`)
              
              // Try regeneration with proper error handling
              const regeneratedLevels = await ImageProcessingService.regeneratePixelationLevels(
                originalSourceBlob, // Pass original as both parameters since we have it
                imageWithDateObjects.pixelationLevels
              )
              
              // Validate regenerated levels before proceeding
              const regenerationValid = ImageProcessingService.validatePixelationLevels(regeneratedLevels)
              
              if (!regenerationValid) {
                console.error(`Regeneration failed validation for ${imageWithDateObjects.originalName}`)
                continue // Skip this image
              }
              
              console.log(`Successfully regenerated ${imageWithDateObjects.originalName}:`, {
                level1: regeneratedLevels.level1?.size || 0,
                level2: regeneratedLevels.level2?.size || 0,
                level3: regeneratedLevels.level3?.size || 0,
                level4: regeneratedLevels.level4?.size || 0
              })
              
              // Create updated image with regenerated levels
              const updatedImage: GameImage = {
                ...imageWithDateObjects,
                pixelationLevels: regeneratedLevels
              }
              
              // Save with explicit validation before adding to validated set
              try {
                await db.saveImage(updatedImage)
                console.log(`Successfully saved regenerated ${imageWithDateObjects.originalName} to database`)
                validatedImages.push(updatedImage)
              } catch (saveError) {
                console.error(`Failed to save regenerated ${imageWithDateObjects.originalName}:`, saveError)
                // Don't add to validated set if save failed
              }
            } else {
              console.error(`Cannot regenerate ${imageWithDateObjects.originalName}: no original (level4) source available. Image will be excluded from game.`)
              console.warn(`Corrupted image ${imageWithDateObjects.originalName} excluded - missing original source for regeneration`)
            }
          } catch (regenerationError) {
            console.error(`Failed to regenerate ${imageWithDateObjects.originalName}:`, regenerationError)
            console.warn(`Excluding corrupted image ${imageWithDateObjects.originalName} from game`)
          }
        } else {
          console.log(`Image ${imageWithDateObjects.originalName} is valid, adding to validated set`)
          validatedImages.push(imageWithDateObjects)
        }
      }
      
      console.log(`Validation complete: ${validatedImages.length}/${loadedImages.length} images are valid`)
      
      // Update category imageIds to only include valid images
      const validImageIds = new Set(validatedImages.map(img => img.id))
      const updatedCategories = loadedCategories.map(category => {
        const originalImageCount = category.imageIds.length
        const validImageIds_filtered = category.imageIds.filter(id => validImageIds.has(id))
        
        // Ensure dates are Date objects (convert from string if needed)
        const categoryWithDateObjects = {
          ...category,
          createdAt: category.createdAt instanceof Date ? category.createdAt : new Date(category.createdAt),
          updatedAt: category.updatedAt instanceof Date ? category.updatedAt : new Date(category.updatedAt),
          imageIds: validImageIds_filtered
        }
        
        if (validImageIds_filtered.length !== originalImageCount) {
          console.log(`Category ${category.name}: removed ${originalImageCount - validImageIds_filtered.length} corrupted images`)
          categoryWithDateObjects.updatedAt = new Date()
        }
        
        return categoryWithDateObjects
      })
      
      categories.value = updatedCategories
      images.value = validatedImages
      
      console.log('Store updated - categories:', categories.value.length, 'images:', images.value.length)
    } catch (err) {
      console.error('Error in loadCategories:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load categories'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Debug function for manual regeneration
  const debugRegenerateImages = async () => {
    console.log('Manual regeneration triggered...')
    try {
      loading.value = true
      const loadedImages = await db.getImages()
      
      let regeneratedCount = 0
      for (const image of loadedImages) {
        const isValid = ImageProcessingService.validatePixelationLevels(image.pixelationLevels)
        if (!isValid) {
          // Only attempt regeneration if we have the original (level4)
          const originalSourceBlob = image.pixelationLevels.level4
          
          if (originalSourceBlob && originalSourceBlob.size > 0) {
            const regeneratedLevels = await ImageProcessingService.regeneratePixelationLevels(
              originalSourceBlob,
              image.pixelationLevels
            )
            
            const updatedImage: GameImage = {
              ...image,
              pixelationLevels: regeneratedLevels
            }
            
            await db.saveImage(updatedImage)
            regeneratedCount++
            console.log(`Regenerated ${image.originalName}`)
          } else {
            console.log(`Cannot regenerate ${image.originalName} - no original source available`)
          }
        }
      }
      
      console.log(`Manual regeneration complete: ${regeneratedCount} images processed`)
      await loadCategories() // Reload everything
    } catch (error) {
      console.error('Manual regeneration failed:', error)
    } finally {
      loading.value = false
    }
  }

  // Expose debug function
  ;(window as any).debugRegenerateImages = debugRegenerateImages

  return {
    // State
    categories,
    images,
    loading,
    error,
    
    // Getters
    getCategoryById,
    getImagesByCategory,
    categoriesWithImageCount,
    
    // Actions
    addCategory,
    updateCategory,
    deleteCategory,
    addImageToCategory,
    removeImageFromCategory,
    loadCategories,
    clearError,
    debugRegenerateImages
  }
})
