// IndexedDB service for Name That Thing data persistence

import type { Category, GameImage, ExportData } from '@/types'

const DB_NAME = 'NameThatThingDB'
const DB_VERSION = 1

interface DBSchema {
  categories: Category
  images: GameImage
  blobs: { id: string; imageId: string; level: string; blob: Blob }
  settings: { key: string; value: any }
}

export class DatabaseService {
  private static instance: DatabaseService
  private db: IDBDatabase | null = null

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('Failed to open database'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
          categoryStore.createIndex('name', 'name', { unique: false })
          categoryStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Images store
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' })
          imageStore.createIndex('categoryId', 'categoryId', { unique: false })
          imageStore.createIndex('originalName', 'originalName', { unique: false })
        }

        // Blobs store (separate from images for better performance)
        if (!db.objectStoreNames.contains('blobs')) {
          const blobStore = db.createObjectStore('blobs', { keyPath: 'id' })
          blobStore.createIndex('imageId', 'imageId', { unique: false })
          blobStore.createIndex('level', 'level', { unique: false })
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  private getStore(storeName: keyof DBSchema, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const transaction = this.db.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    const store = this.getStore('categories')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Deserialize Date fields
        const categories = request.result.map(cat => ({
          ...cat,
          createdAt: new Date(cat.createdAt),
          updatedAt: new Date(cat.updatedAt)
        }))
        resolve(categories)
      }
    })
  }

  async saveCategory(category: Category | any): Promise<void> {
    const store = this.getStore('categories', 'readwrite')
    return new Promise((resolve, reject) => {
      console.log('DatabaseService: Original category object:', category)
      console.log('DatabaseService: Category.imageIds type:', typeof category.imageIds, 'isArray:', Array.isArray(category.imageIds))
      console.log('DatabaseService: Category.imageIds contents:', category.imageIds)
      
      // Create a completely clean object using JSON serialization to remove any Vue reactivity
      try {
        const cleanCategory = {
          id: String(category.id),
          name: String(category.name),
          description: category.description ? String(category.description) : undefined,
          createdAt: category.createdAt instanceof Date 
            ? category.createdAt.toISOString() 
            : String(category.createdAt),
          updatedAt: category.updatedAt instanceof Date 
            ? category.updatedAt.toISOString() 
            : String(category.updatedAt),
          imageIds: Array.isArray(category.imageIds) ? category.imageIds.map((id: string) => String(id)) : [],
          settings: category.settings ? {
            shuffleImages: Boolean(category.settings.shuffleImages),
            showFileName: Boolean(category.settings.showFileName)
          } : undefined
        }
        
        console.log('DatabaseService: Clean category object:', cleanCategory)
        console.log('DatabaseService: Attempting to save to IndexedDB...')
        
        const request = store.put(cleanCategory)
        request.onerror = () => {
          console.error('DatabaseService: Error saving category:', request.error)
          reject(request.error)
        }
        request.onsuccess = () => {
          console.log('DatabaseService: Category saved successfully')
          resolve()
        }
      } catch (error) {
        console.error('DatabaseService: Error preparing category for save:', error)
        reject(error)
      }
    })
  }

  async deleteCategory(id: string): Promise<void> {
    const store = this.getStore('categories', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // Image operations
  async getImages(): Promise<GameImage[]> {
    console.log('DatabaseService: Loading images from database...')
    const store = this.getStore('images')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => {
        console.error('DatabaseService: Error loading images:', request.error)
        reject(request.error)
      }
      request.onsuccess = async () => {
        const images = request.result
        console.log('DatabaseService: Loaded', images.length, 'image records')
        
        // Load blobs for each image
        const imagesWithBlobs = await Promise.all(
          images.map(async (image) => {
            console.log('DatabaseService: Loading blobs for image', image.originalName)
            const blobs = await this.getBlobsForImage(image.id)
            const blobCount = Object.keys(blobs).length
            console.log('DatabaseService: Loaded', blobCount, 'blobs for', image.originalName)
            
            // Log blob details and validate
            const validatedBlobs: Record<string, Blob> = {}
            let hasInvalidBlobs = false
            Object.entries(blobs).forEach(([level, blob]) => {
              console.log(`DatabaseService: Blob ${level} size:`, blob.size, 'type:', blob.type)
              if (blob.size > 0) {
                validatedBlobs[level] = blob
              } else {
                console.warn(`DatabaseService: Invalid blob for ${image.originalName} level ${level} (size: ${blob.size})`)
                hasInvalidBlobs = true
              }
            })
            
            const pixelationLevels = {
              level1: validatedBlobs.level1 || null,
              level2: validatedBlobs.level2 || null,
              level3: validatedBlobs.level3 || null,
              level4: validatedBlobs.level4 || null
            }
            
            // If we have invalid blobs, try to regenerate from the best available source
            if (hasInvalidBlobs) {
              console.warn(`DatabaseService: Attempting to regenerate missing blobs for ${image.originalName}`)
              try {
                const { ImageProcessingService } = await import('@/services/imageProcessing')
                const sourceBlob = pixelationLevels.level4 || pixelationLevels.level3 || pixelationLevels.level2 || pixelationLevels.level1
                if (sourceBlob) {
                  const regeneratedLevels = await ImageProcessingService.regeneratePixelationLevels(
                    sourceBlob,
                    pixelationLevels
                  )
                  
                  // Update the pixelation levels with regenerated ones
                  Object.assign(pixelationLevels, regeneratedLevels)
                  
                  // Save the regenerated image back to database
                  const updatedImage = {
                    ...image,
                    metadata: {
                      uploadedAt: new Date(image.metadata.uploadedAt),
                      processedAt: new Date(image.metadata.processedAt)
                    },
                    pixelationLevels: regeneratedLevels
                  }
                  
                  // Save asynchronously without blocking the load
                  this.saveImage(updatedImage).catch(err => {
                    console.error('Failed to save regenerated image:', err)
                  })
                  
                  console.log(`DatabaseService: Successfully regenerated blobs for ${image.originalName}`)
                } else {
                  console.error(`DatabaseService: No valid source blob found for regeneration of ${image.originalName}`)
                }
              } catch (regenerationError) {
                console.error(`DatabaseService: Failed to regenerate blobs for ${image.originalName}:`, regenerationError)
              }
            }
            
            return {
              ...image,
              metadata: {
                uploadedAt: new Date(image.metadata.uploadedAt),
                processedAt: new Date(image.metadata.processedAt)
              },
              pixelationLevels
            }
          })
        )
        console.log('DatabaseService: Returning', imagesWithBlobs.length, 'complete images')
        resolve(imagesWithBlobs)
      }
    })
  }

  async saveImage(image: GameImage): Promise<void> {
    console.log('DatabaseService: Saving image', image.originalName, 'ID:', image.id)
    
    // Validate pixelation levels before saving
    const levels = image.pixelationLevels
    const levelSizes = {
      level1: levels.level1?.size || 0,
      level2: levels.level2?.size || 0,
      level3: levels.level3?.size || 0,
      level4: levels.level4?.size || 0
    }
    
    console.log('DatabaseService: Image pixelation level sizes:', levelSizes)
    
    const hasAllLevels = levelSizes.level1 > 0 && levelSizes.level2 > 0 && levelSizes.level3 > 0 && levelSizes.level4 > 0
    if (!hasAllLevels) {
      const missingLevels = Object.entries(levelSizes)
        .filter(([_, size]) => size === 0)
        .map(([level, _]) => level)
      
      console.error(`DatabaseService: CRITICAL - Attempting to save image ${image.originalName} with missing pixelation levels:`, missingLevels)
      throw new Error(`Cannot save image with missing pixelation levels: ${missingLevels.join(', ')}`)
    }
    
    // Create a clean, serializable object by explicitly copying only the needed properties
    const serializedMetadata = {
      id: image.id,
      categoryId: image.categoryId,
      originalName: image.originalName,
      mimeType: image.mimeType,
      originalSize: image.originalSize,
      processedSize: image.processedSize,
      dimensions: {
        width: image.dimensions.width,
        height: image.dimensions.height
      },
      metadata: {
        uploadedAt: image.metadata.uploadedAt.toISOString(),
        processedAt: image.metadata.processedAt.toISOString()
      }
    }
    console.log('DatabaseService: Saving clean image metadata:', serializedMetadata)

    // Save image metadata first
    const imageStore = this.getStore('images', 'readwrite')
    await new Promise<void>((resolve, reject) => {
      const request = imageStore.put(serializedMetadata)
      request.onerror = () => {
        console.error('DatabaseService: Error saving image metadata:', request.error)
        reject(request.error)
      }
      request.onsuccess = () => {
        console.log('DatabaseService: Image metadata saved successfully')
        resolve()
      }
    })

    // Save blobs separately with individual transactions to avoid TransactionInactiveError
    const pixelationLevels = image.pixelationLevels
    console.log('DatabaseService: Saving', Object.keys(pixelationLevels).length, 'blob levels')
    
    for (const [level, blob] of Object.entries(pixelationLevels)) {
      // Skip null blobs
      if (!blob) {
        console.warn(`DatabaseService: Skipping null blob for level ${level}`)
        continue
      }
      
      // Create a new transaction for each blob to ensure it's active
      const blobStore = this.getStore('blobs', 'readwrite')
      await new Promise<void>((resolve, reject) => {
        const blobData = {
          id: `${image.id}_${level}`,
          imageId: image.id,
          level,
          blob
        }
        console.log('DatabaseService: Saving blob', blobData.id, 'size:', blob.size)
        const request = blobStore.put(blobData)
        request.onerror = () => {
          console.error('DatabaseService: Error saving blob:', level, request.error)
          reject(request.error)
        }
        request.onsuccess = () => {
          console.log('DatabaseService: Blob saved successfully:', level)
          resolve()
        }
      })
    }

    console.log('DatabaseService: All blobs saved for image', image.originalName)
  }

  async deleteImage(id: string): Promise<void> {
    // Delete image metadata first
    const imageStore = this.getStore('images', 'readwrite')
    await new Promise<void>((resolve, reject) => {
      const request = imageStore.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })

    // Delete associated blobs with a separate transaction
    const blobStore = this.getStore('blobs', 'readwrite')
    const blobIndex = blobStore.index('imageId')
    
    // Get all blob records for this image
    const blobRecords = await new Promise<any[]>((resolve, reject) => {
      const request = blobIndex.getAll(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    // Delete each blob record with individual transactions
    for (const blobRecord of blobRecords) {
      const blobDeleteStore = this.getStore('blobs', 'readwrite')
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = blobDeleteStore.delete(blobRecord.id)
        deleteRequest.onerror = () => reject(deleteRequest.error)
        deleteRequest.onsuccess = () => resolve()
      })
    }
  }

  private async getBlobsForImage(imageId: string): Promise<Record<string, Blob>> {
    console.log('DatabaseService: Getting blobs for image ID:', imageId)
    const store = this.getStore('blobs')
    const index = store.index('imageId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(imageId)
      request.onerror = () => {
        console.error('DatabaseService: Error getting blobs for image:', imageId, request.error)
        reject(request.error)
      }
      request.onsuccess = () => {
        const blobs: Record<string, Blob> = {}
        console.log('DatabaseService: Found', request.result.length, 'blob records for image', imageId)
        request.result.forEach(record => {
          console.log('DatabaseService: Loading blob level', record.level, 'size:', record.blob.size)
          blobs[record.level] = record.blob
        })
        resolve(blobs)
      }
    })
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    const store = this.getStore('settings')
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result?.value)
    })
  }

  async setSetting(key: string, value: any): Promise<void> {
    const store = this.getStore('settings', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // Export/Import operations
  async exportData(): Promise<ExportData> {
    try {
      const categories = await this.getCategories()
      const images = await this.getImages()
      
      console.log(`Exporting ${categories.length} categories and ${images.length} images`)
      
      // Convert blobs to base64
      const blobs: Record<string, string> = {}
      for (const image of images) {
        for (const [level, blob] of Object.entries(image.pixelationLevels)) {
          if (blob && blob.size > 0) {  // Only process non-null, non-empty blobs
            try {
              const base64 = await this.blobToBase64(blob)
              blobs[`${image.id}_${level}`] = base64
            } catch (error) {
              console.warn(`Failed to convert blob for image ${image.id} level ${level}:`, error)
              // Continue with other blobs even if one fails
            }
          }
        }
      }

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        categories,
        images: images.map(({ pixelationLevels, ...image }) => image as any),
        blobs
      }
      
      console.log(`Export complete: ${Object.keys(blobs).length} blobs processed`)
      return exportData
    } catch (error) {
      console.error('Export failed:', error)
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async importData(data: ExportData): Promise<void> {
    try {
      // Validate data structure
      if (!data.version || !Array.isArray(data.categories) || !Array.isArray(data.images)) {
        throw new Error('Invalid backup file structure')
      }
      
      console.log(`Importing ${data.categories.length} categories and ${data.images.length} images`)
      
      // Clear existing data
      await this.clearAllData()

      // Import categories
      for (const category of data.categories) {
        try {
          await this.saveCategory(category)
        } catch (error) {
          console.warn(`Failed to import category ${category.name}:`, error)
          // Continue with other categories
        }
      }

      // Import images with blobs
      for (const imageData of data.images) {
        try {
          const pixelationLevels = {
            level1: data.blobs[`${imageData.id}_level1`] ? this.base64ToBlob(data.blobs[`${imageData.id}_level1`]) : null,
            level2: data.blobs[`${imageData.id}_level2`] ? this.base64ToBlob(data.blobs[`${imageData.id}_level2`]) : null,
            level3: data.blobs[`${imageData.id}_level3`] ? this.base64ToBlob(data.blobs[`${imageData.id}_level3`]) : null,
            level4: data.blobs[`${imageData.id}_level4`] ? this.base64ToBlob(data.blobs[`${imageData.id}_level4`]) : null
          }

          const image: GameImage = {
            ...imageData,
            pixelationLevels,
            metadata: {
              ...imageData.metadata,
              uploadedAt: new Date(imageData.metadata.uploadedAt),
              processedAt: new Date(imageData.metadata.processedAt)
            }
          } as GameImage

          await this.saveImage(image)
        } catch (error) {
          console.warn(`Failed to import image ${imageData.originalName}:`, error)
          // Continue with other images
        }
      }
      
      console.log('Import completed successfully')
    } catch (error) {
      console.error('Import failed:', error)
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async clearAllData(): Promise<void> {
    const storeNames: (keyof DBSchema)[] = ['categories', 'images', 'blobs', 'settings']
    
    for (const storeName of storeNames) {
      const store = this.getStore(storeName, 'readwrite')
      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1] // Remove data URL prefix
        resolve(base64)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  }

  private base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    if (!base64) return new Blob()
    
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance()
