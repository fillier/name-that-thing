// Image processing service for Name That Thing

import type { GameImage, ImageProcessingResult, PixelationLevel } from '@/types'
import {
  generateId,
  isValidImageType,
  isValidImageSize,
  loadImageFromFile,
  resizeImage,
  createPixelatedImage
} from '@/utils'

export class ImageProcessingService {
  private static readonly DEFAULT_PIXELATION_LEVELS = [64, 32, 16, 0] // 0 means original, higher numbers are more pixelated
  private static readonly DEFAULT_MAX_WIDTH = 1280
  private static readonly DEFAULT_MIN_WIDTH = 800
  private static readonly DEFAULT_QUALITY = 0.9

  /**
   * Process a single image file for the game
   */
  static async processImage(
    file: File,
    categoryId: string,
    maxWidth: number = ImageProcessingService.DEFAULT_MAX_WIDTH,
    quality: number = ImageProcessingService.DEFAULT_QUALITY,
    minWidth: number = ImageProcessingService.DEFAULT_MIN_WIDTH,
    pixelSizes: number[] = ImageProcessingService.DEFAULT_PIXELATION_LEVELS
  ): Promise<ImageProcessingResult> {
    try {
      // Validate file
      if (!isValidImageType(file)) {
        return {
          success: false,
          error: `Invalid file type. Supported types: JPG, PNG, GIF, WebP`
        }
      }

      if (!isValidImageSize(file)) {
        return {
          success: false,
          error: `File too large. Maximum size is 10MB`
        }
      }

      // Load image
      const img = await loadImageFromFile(file)
      
      // Resize image
      const { canvas, blob: resizedBlob, dimensions } = await resizeImage(img, maxWidth, quality, minWidth)
      
      // Create pixelation levels
      const pixelationLevels = await ImageProcessingService.createPixelationLevels(
        canvas,
        quality,
        pixelSizes
      )

      // Final validation to ensure all levels are present and valid
      const isValid = ImageProcessingService.validatePixelationLevels(pixelationLevels)
      if (!isValid) {
        throw new Error('Final validation failed: Generated pixelation levels are incomplete')
      }

      console.log('ImageProcessingService: Final validation passed for', file.name, 'with levels:', {
        level1: pixelationLevels.level1?.size || 0,
        level2: pixelationLevels.level2?.size || 0,
        level3: pixelationLevels.level3?.size || 0,
        level4: pixelationLevels.level4?.size || 0
      })

      // Create GameImage object
      const gameImage: GameImage = {
        id: generateId(),
        categoryId,
        originalName: file.name,
        mimeType: file.type,
        originalSize: file.size,
        processedSize: resizedBlob.size,
        dimensions,
        pixelationLevels,
        metadata: {
          uploadedAt: new Date(),
          processedAt: new Date()
        }
      }

      return {
        success: true,
        processedImage: gameImage
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Process multiple image files
   */
  static async processImages(
    files: FileList | File[],
    categoryId: string,
    maxWidth?: number,
    quality?: number,
    minWidth?: number,
    pixelSizes?: number[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    successful: GameImage[]
    failed: Array<{ file: File; error: string }>
  }> {
    const fileArray = Array.from(files)
    const successful: GameImage[] = []
    const failed: Array<{ file: File; error: string }> = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      
      try {
        const result = await ImageProcessingService.processImage(
          file,
          categoryId,
          maxWidth,
          quality,
          minWidth,
          pixelSizes
        )

        if (result.success && result.processedImage) {
          successful.push(result.processedImage)
        } else {
          failed.push({
            file,
            error: result.error || 'Unknown error'
          })
        }
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Report progress
      onProgress?.(i + 1, fileArray.length)
    }

    return { successful, failed }
  }

  /**
   * Process multiple images sequentially to avoid resource contention
   */
  static async processBatch(
    files: File[],
    categoryId: string,
    options: {
      maxWidth?: number
      minWidth?: number
      quality?: number
      pixelSizes?: number[]
      batchSize?: number
      onProgress?: (processed: number, total: number) => void
      onImageComplete?: (result: ImageProcessingResult, index: number) => void
    } = {}
  ): Promise<ImageProcessingResult[]> {
    const {
      maxWidth = ImageProcessingService.DEFAULT_MAX_WIDTH,
      minWidth = ImageProcessingService.DEFAULT_MIN_WIDTH,
      quality = ImageProcessingService.DEFAULT_QUALITY,
      pixelSizes = ImageProcessingService.DEFAULT_PIXELATION_LEVELS,
      onProgress,
      onImageComplete
    } = options

    const results: ImageProcessingResult[] = []
    const total = files.length

    // Process files sequentially to avoid canvas resource contention
    // Canvas operations can interfere with each other when run concurrently
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        console.log(`ImageProcessingService: Processing batch item ${i + 1}/${total}: ${file.name}`)
        
        const result = await ImageProcessingService.processImage(
          file,
          categoryId,
          maxWidth,
          quality,
          minWidth,
          pixelSizes
        )
        
        results.push(result)
        onImageComplete?.(result, i)
        onProgress?.(i + 1, total)
        
        // Small delay between images to allow garbage collection and prevent memory pressure
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150))
        }
        
      } catch (error) {
        console.error(`ImageProcessingService: Failed to process batch item ${file.name}:`, error)
        
        const errorResult: ImageProcessingResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        
        results.push(errorResult)
        onImageComplete?.(errorResult, i)
        onProgress?.(i + 1, total)
      }
    }

    return results
  }

  /**
   * Create all pixelation levels for an image with retry logic
   */
  private static async createPixelationLevels(
    canvas: HTMLCanvasElement,
    quality: number,
    pixelSizes: number[] = ImageProcessingService.DEFAULT_PIXELATION_LEVELS,
    retryCount: number = 0
  ): Promise<GameImage['pixelationLevels']> {
    const maxRetries = 5 // Increased from 3 to 5 retries for better reliability
    
    try {
      const result = await this.createPixelationLevelsInternal(canvas, quality, pixelSizes)
      
      // Double-check validation after successful creation
      const isValid = this.validatePixelationLevels(result)
      if (!isValid) {
        throw new Error('Created pixelation levels failed final validation check')
      }
      
      return result
    } catch (error) {
      if (retryCount < maxRetries) {
        console.warn(`ImageProcessingService: Retry ${retryCount + 1}/${maxRetries} for pixelation levels creation:`, error)
        
        // More aggressive cleanup before retry
        await this.forceMemoryCleanup()
        
        // Progressive delay that gets longer with each retry
        const delay = 1000 + (retryCount * 1000) // 1s, 2s, 3s, 4s, 5s
        console.log(`ImageProcessingService: Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Try with slightly lower quality on later retries to reduce memory pressure
        const retryQuality = retryCount >= 2 ? Math.max(0.7, quality - 0.1) : quality
        if (retryQuality !== quality) {
          console.log(`ImageProcessingService: Reducing quality to ${retryQuality} for retry ${retryCount + 1}`)
        }
        
        return this.createPixelationLevels(canvas, retryQuality, pixelSizes, retryCount + 1)
      } else {
        console.error(`ImageProcessingService: Failed to create pixelation levels after ${maxRetries} retries:`, error)
        
        // One final attempt with minimal quality as a last resort
        if (quality > 0.6) {
          console.log('ImageProcessingService: Attempting final retry with minimal quality (0.6)')
          try {
            return await this.createPixelationLevelsInternal(canvas, 0.6)
          } catch (finalError) {
            console.error('ImageProcessingService: Final low-quality attempt also failed:', finalError)
          }
        }
        
        throw new Error(`Failed to create pixelation levels after ${maxRetries} retries and fallback attempt: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  /**
   * Internal method to create all pixelation levels for an image
   */
  private static async createPixelationLevelsInternal(
    canvas: HTMLCanvasElement,
    quality: number,
    pixelSizes: number[] = ImageProcessingService.DEFAULT_PIXELATION_LEVELS
  ): Promise<GameImage['pixelationLevels']> {
    const levels: GameImage['pixelationLevels'] = {} as GameImage['pixelationLevels']
    
    console.log('ImageProcessingService: Starting pixelation level creation with enhanced validation')
    
    // Create a copy of the canvas for each level with enhanced error handling and validation
    for (let i = 0; i < pixelSizes.length; i++) {
      const pixelSize = pixelSizes[i]
      const levelKey = `level${i + 1}` as keyof GameImage['pixelationLevels']
      
      console.log(`ImageProcessingService: Creating ${levelKey} with pixel size ${pixelSize}`)
      
      let levelCanvas: HTMLCanvasElement | null = null
      let ctx: CanvasRenderingContext2D | null = null
      
      try {
        // Create canvas copy with better memory management
        levelCanvas = document.createElement('canvas')
        levelCanvas.width = canvas.width
        levelCanvas.height = canvas.height
        ctx = levelCanvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('Could not get canvas context')
        }

        // Copy original image to level canvas
        ctx.drawImage(canvas, 0, 0)
        
        // Add a small delay to prevent browser overload
        await new Promise(resolve => setTimeout(resolve, 50))
        
        if (pixelSize === 0) {
          // Level 4: Original image
          console.log(`ImageProcessingService: Creating original image blob for ${levelKey}`)
          levels[levelKey] = await new Promise<Blob>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Timeout creating original blob for ${levelKey}`))
            }, 15000) // Increased timeout to 15 seconds
            
            levelCanvas!.toBlob(
              (blob) => {
                clearTimeout(timeoutId)
                if (blob && blob.size > 0) {
                  console.log(`ImageProcessingService: Created ${levelKey} blob, size: ${blob.size}`)
                  resolve(blob)
                } else {
                  reject(new Error(`Failed to create original blob for ${levelKey}, size: ${blob?.size || 0}`))
                }
              },
              'image/jpeg',
              quality
            )
          })
        } else {
          // Pixelated levels
          console.log(`ImageProcessingService: Creating pixelated image blob for ${levelKey} with ${pixelSize}px pixels`)
          const pixelatedBlob = await createPixelatedImage(levelCanvas, pixelSize, quality)
          if (pixelatedBlob && pixelatedBlob.size > 0) {
            levels[levelKey] = pixelatedBlob
            console.log(`ImageProcessingService: Created ${levelKey} pixelated blob, size: ${pixelatedBlob.size}`)
          } else {
            throw new Error(`Failed to create pixelated blob for ${levelKey}, size: ${pixelatedBlob?.size || 0}`)
          }
        }
        
        // Validate the level was created successfully before continuing
        if (!levels[levelKey] || levels[levelKey]!.size === 0) {
          throw new Error(`Level ${levelKey} validation failed after creation`)
        }
        
      } catch (error) {
        console.error(`ImageProcessingService: Failed to create ${levelKey}:`, error)
        throw new Error(`Failed to create pixelation level ${levelKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        // Clean up the level canvas to free memory immediately
        if (ctx && levelCanvas) {
          try {
            ctx.clearRect(0, 0, levelCanvas.width, levelCanvas.height)
            levelCanvas.width = 1 // Reset to minimal size
            levelCanvas.height = 1
          } catch (cleanupError) {
            console.warn(`ImageProcessingService: Canvas cleanup warning for ${levelKey}:`, cleanupError)
          }
        }
        
        // Explicit cleanup
        levelCanvas = null
        ctx = null
      }
    }
    
    // Final comprehensive validation of all levels
    const invalidLevels = Object.entries(levels).filter(([_, blob]) => !blob || blob.size === 0)
    if (invalidLevels.length > 0) {
      const invalidKeys = invalidLevels.map(([key, _]) => key)
      console.error(`ImageProcessingService: Invalid levels detected:`, invalidKeys)
      console.error(`ImageProcessingService: Level sizes:`, {
        level1: levels.level1?.size || 0,
        level2: levels.level2?.size || 0,
        level3: levels.level3?.size || 0,
        level4: levels.level4?.size || 0
      })
      throw new Error(`Failed to create valid pixelation levels: ${invalidKeys.join(', ')}`)
    }
    
    console.log('ImageProcessingService: All pixelation levels created successfully:', {
      level1: levels.level1?.size || 0,
      level2: levels.level2?.size || 0,
      level3: levels.level3?.size || 0,
      level4: levels.level4?.size || 0
    })
    
    return levels
  }

  /**
   * Get blob URL for a specific pixelation level
   */
  static getBlobUrl(image: GameImage, level: PixelationLevel): string | null {
    const levelKey = `level${level}` as keyof GameImage['pixelationLevels']
    const blob = image.pixelationLevels[levelKey]
    if (!blob) {
      return null
    }
    return URL.createObjectURL(blob)
  }

  /**
   * Clean up blob URLs to prevent memory leaks
   */
  static revokeBlobUrls(urls: string[]): void {
    urls.forEach(url => URL.revokeObjectURL(url))
  }

  /**
   * Get image dimensions from blob
   */
  static getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(blob)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image for dimension calculation'))
      }
      
      img.src = url
    })
  }

  /**
   * Convert blob to base64 for export
   */
  static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix to get just the base64 data
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        } else {
          reject(new Error('Failed to convert blob to base64'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read blob'))
      }
      
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Convert base64 to blob for import
   */
  static base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  /**
   * Validate that all pixelation levels are properly generated
   */
  static validatePixelationLevels(levels: GameImage['pixelationLevels']): boolean {
    const requiredLevels: (keyof GameImage['pixelationLevels'])[] = ['level1', 'level2', 'level3', 'level4']
    
    for (const level of requiredLevels) {
      const blob = levels[level]
      if (!blob || blob.size === 0) {
        console.warn(`ImageProcessingService: Invalid or missing blob for ${level}, size: ${blob?.size || 0}`)
        return false
      }
    }
    
    return true
  }

  /**
   * Regenerate missing pixelation levels for an image
   */
  static async regeneratePixelationLevels(
    originalBlob: Blob,
    existingLevels: GameImage['pixelationLevels'],
    quality: number = 0.9
  ): Promise<GameImage['pixelationLevels']> {
    console.log('ImageProcessingService: Regenerating missing pixelation levels')
    
    // CRITICAL: Only use the original image (level4) or the provided originalBlob as source
    // Never use pixelated levels as source for regeneration as this corrupts the image quality
    let sourceBlob = existingLevels.level4 || originalBlob
    
    if (!sourceBlob || sourceBlob.size === 0) {
      throw new Error('No original (non-pixelated) source blob available for regeneration. Cannot regenerate from pixelated levels.')
    }
    
    console.log(`ImageProcessingService: Using ${existingLevels.level4 ? 'level4' : 'originalBlob'} as regeneration source (${sourceBlob.size} bytes)`)
    
    // Load the source image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      const url = URL.createObjectURL(sourceBlob)
      
      image.onload = () => {
        URL.revokeObjectURL(url)
        resolve(image)
      }
      
      image.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load source image for regeneration'))
      }
      
      image.src = url
    })
    
    // Create canvas from the image
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Could not create canvas context for regeneration')
    }
    
    ctx.drawImage(img, 0, 0)
    
    // Generate all levels from the original source
    const newLevels = await this.createPixelationLevels(canvas, quality)
    
    // Return the newly generated levels (don't merge with existing pixelated levels)
    console.log('ImageProcessingService: Regeneration complete - all levels regenerated from original source')
    return newLevels
  }

  /**
   * Force regenerate all pixelation levels for an image (useful for fixing corrupted data)
   */
  static async forceRegenerateAllLevels(
    sourceBlob: Blob,
    quality: number = 0.9
  ): Promise<GameImage['pixelationLevels']> {
    console.log('ImageProcessingService: Force regenerating all pixelation levels')
    
    // Load the source image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      const url = URL.createObjectURL(sourceBlob)
      
      image.onload = () => {
        URL.revokeObjectURL(url)
        resolve(image)
      }
      
      image.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load source image for regeneration'))
      }
      
      image.src = url
    })
    
    // Create canvas from the image
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Could not create canvas context for regeneration')
    }
    
    ctx.drawImage(img, 0, 0)
    
    // Generate all levels fresh
    const newLevels = await this.createPixelationLevels(canvas, quality)
    
    // Validate all levels were created successfully
    const isValid = this.validatePixelationLevels(newLevels)
    if (!isValid) {
      throw new Error('Failed to regenerate valid pixelation levels')
    }
    
    console.log('ImageProcessingService: Force regeneration complete')
    return newLevels
  }

  /**
   * Force garbage collection and memory cleanup (best effort)
   */
  private static async forceMemoryCleanup() {
    console.log('ImageProcessingService: Starting aggressive memory cleanup')
    
    // Trigger garbage collection if available (mainly for development)
    if (typeof window !== 'undefined' && (window as any).gc) {
      console.log('ImageProcessingService: Triggering garbage collection')
      ;(window as any).gc()
    }
    
    // Request idle callback for cleanup if available
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      await new Promise<void>(resolve => {
        window.requestIdleCallback(() => {
          console.log('ImageProcessingService: Idle callback executed')
          resolve()
        }, { timeout: 1000 })
      })
    }
    
    // Force browser to perform any pending cleanup with longer delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Try to revoke any dangling object URLs (best effort)
    try {
      // Force creation and immediate cleanup of a small canvas to trigger cleanup
      const cleanupCanvas = document.createElement('canvas')
      cleanupCanvas.width = 1
      cleanupCanvas.height = 1
      const cleanupCtx = cleanupCanvas.getContext('2d')
      if (cleanupCtx) {
        cleanupCtx.clearRect(0, 0, 1, 1)
      }
    } catch (error) {
      console.warn('ImageProcessingService: Cleanup canvas creation failed:', error)
    }
    
    // Additional cleanup attempt
    if (typeof window !== 'undefined' && (window as any).gc) {
      ;(window as any).gc()
    }
    
    console.log('ImageProcessingService: Memory cleanup completed')
  }
}
