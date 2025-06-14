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
  private static readonly PIXELATION_LEVELS = [32, 16, 8, 0] // 0 means original, higher numbers are more pixelated
  private static readonly DEFAULT_MAX_WIDTH = 1280
  private static readonly DEFAULT_QUALITY = 0.9

  /**
   * Process a single image file for the game
   */
  static async processImage(
    file: File,
    categoryId: string,
    maxWidth: number = ImageProcessingService.DEFAULT_MAX_WIDTH,
    quality: number = ImageProcessingService.DEFAULT_QUALITY
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
      const { canvas, blob: resizedBlob, dimensions } = await resizeImage(img, maxWidth, quality)
      
      // Create pixelation levels
      const pixelationLevels = await ImageProcessingService.createPixelationLevels(
        canvas,
        quality
      )

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
          quality
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
   * Process multiple images in batches to avoid memory issues
   */
  static async processBatch(
    files: File[],
    categoryId: string,
    options: {
      maxWidth?: number
      quality?: number
      batchSize?: number
      onProgress?: (processed: number, total: number) => void
      onImageComplete?: (result: ImageProcessingResult, index: number) => void
    } = {}
  ): Promise<ImageProcessingResult[]> {
    const {
      maxWidth = ImageProcessingService.DEFAULT_MAX_WIDTH,
      quality = ImageProcessingService.DEFAULT_QUALITY,
      batchSize = 3, // Process 3 images concurrently
      onProgress,
      onImageComplete
    } = options

    const results: ImageProcessingResult[] = []
    const total = files.length

    // Process files in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      
      // Process batch concurrently
      const batchPromises = batch.map(async (file, batchIndex) => {
        const globalIndex = i + batchIndex
        try {
          const result = await ImageProcessingService.processImage(
            file,
            categoryId,
            maxWidth,
            quality
          )
          
          onImageComplete?.(result, globalIndex)
          onProgress?.(globalIndex + 1, total)
          
          return result
        } catch (error) {
          const errorResult: ImageProcessingResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          
          onImageComplete?.(errorResult, globalIndex)
          onProgress?.(globalIndex + 1, total)
          
          return errorResult
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Small delay between batches to prevent UI blocking
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return results
  }

  /**
   * Create all pixelation levels for an image
   */
  private static async createPixelationLevels(
    canvas: HTMLCanvasElement,
    quality: number
  ): Promise<GameImage['pixelationLevels']> {
    const levels: GameImage['pixelationLevels'] = {} as GameImage['pixelationLevels']
    
    // Create a copy of the canvas for each level
    for (let i = 0; i < ImageProcessingService.PIXELATION_LEVELS.length; i++) {
      const pixelSize = ImageProcessingService.PIXELATION_LEVELS[i]
      const levelKey = `level${i + 1}` as keyof GameImage['pixelationLevels']
      
      console.log(`ImageProcessingService: Creating ${levelKey} with pixel size ${pixelSize}`)
      
      try {
        // Create canvas copy
        const levelCanvas = document.createElement('canvas')
        levelCanvas.width = canvas.width
        levelCanvas.height = canvas.height
        const ctx = levelCanvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('Could not get canvas context')
        }
        
        // Copy original image to level canvas
        ctx.drawImage(canvas, 0, 0)
        
        if (pixelSize === 0) {
          // Level 4: Original image
          levels[levelKey] = await new Promise<Blob>((resolve, reject) => {
            levelCanvas.toBlob(
              (blob) => {
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
          const pixelatedBlob = await createPixelatedImage(levelCanvas, pixelSize, quality)
          if (pixelatedBlob && pixelatedBlob.size > 0) {
            levels[levelKey] = pixelatedBlob
            console.log(`ImageProcessingService: Created ${levelKey} pixelated blob, size: ${pixelatedBlob.size}`)
          } else {
            throw new Error(`Failed to create pixelated blob for ${levelKey}, size: ${pixelatedBlob?.size || 0}`)
          }
        }
      } catch (error) {
        console.error(`ImageProcessingService: Failed to create ${levelKey}:`, error)
        throw new Error(`Failed to create pixelation level ${levelKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Validate all levels were created successfully
    const invalidLevels = Object.entries(levels).filter(([_, blob]) => !blob || blob.size === 0)
    if (invalidLevels.length > 0) {
      const invalidKeys = invalidLevels.map(([key, _]) => key)
      console.error(`ImageProcessingService: Invalid levels detected:`, invalidKeys)
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
}
