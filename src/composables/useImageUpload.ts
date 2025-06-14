// Composable for handling image uploads and processing

import { ref, computed } from 'vue'
import { ImageProcessingService } from '@/services/imageProcessing'
import type { GameImage } from '@/types'

export interface UploadProgress {
  current: number
  total: number
  percentage: number
  currentFileName?: string
}

export function useImageUpload() {
  const isUploading = ref(false)
  const uploadProgress = ref<UploadProgress>({ current: 0, total: 0, percentage: 0 })
  const uploadErrors = ref<Array<{ fileName: string; error: string }>>([])

  const progressPercentage = computed(() => uploadProgress.value.percentage)
  const hasErrors = computed(() => uploadErrors.value.length > 0)

  const uploadImages = async (
    files: FileList | File[],
    categoryId: string,
    options?: {
      maxWidth?: number
      minWidth?: number
      quality?: number
      pixelSizes?: number[]
      onImageProcessed?: (image: GameImage) => void
      onError?: (fileName: string, error: string) => void
    }
  ): Promise<{
    successful: GameImage[]
    failed: Array<{ fileName: string; error: string }>
  }> => {
    if (isUploading.value) {
      throw new Error('Upload already in progress')
    }

    const fileArray = Array.from(files)
    const successful: GameImage[] = []
    const failed: Array<{ fileName: string; error: string }> = []

    isUploading.value = true
    uploadErrors.value = []
    uploadProgress.value = { current: 0, total: fileArray.length, percentage: 0 }

    try {
      // Process files sequentially to avoid overwhelming the browser
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]

        // Update progress
        uploadProgress.value = {
          current: i + 1,
          total: fileArray.length,
          percentage: Math.round(((i + 1) / fileArray.length) * 100),
          currentFileName: file.name
        }

        try {
          const result = await ImageProcessingService.processImage(
            file,
            categoryId,
            options?.maxWidth,
            options?.quality,
            options?.minWidth,
            options?.pixelSizes
          )

          if (result.success && result.processedImage) {
            // The ImageProcessingService already validates pixelation levels internally
            // No need for additional validation here as it can cause false positives
            successful.push(result.processedImage)
            options?.onImageProcessed?.(result.processedImage)
          } else {
            const error = { fileName: file.name, error: result.error || 'Unknown error' }
            failed.push(error)
            uploadErrors.value.push(error)
            options?.onError?.(file.name, result.error || 'Unknown error')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const errorObj = { fileName: file.name, error: errorMessage }
          failed.push(errorObj)
          uploadErrors.value.push(errorObj)
          options?.onError?.(file.name, errorMessage)
        }

        // Enhanced delay to prevent resource contention and allow memory cleanup
        if (i < fileArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300)) // Increased to 300ms for better reliability
        }
      }

      return { successful, failed }
    } finally {
      isUploading.value = false
      uploadProgress.value = { current: 0, total: 0, percentage: 0 }
    }
  }

  const validateFiles = (files: FileList | File[]): {
    valid: File[]
    invalid: Array<{ file: File; reason: string }>
  } => {
    const fileArray = Array.from(files)
    const valid: File[] = []
    const invalid: Array<{ file: File; reason: string }> = []

    for (const file of fileArray) {
      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        invalid.push({ file, reason: 'Invalid file type. Only JPG, PNG, GIF, and WebP are supported.' })
        continue
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        invalid.push({ file, reason: 'File too large. Maximum size is 10MB.' })
        continue
      }

      valid.push(file)
    }

    return { valid, invalid }
  }

  const clearErrors = () => {
    uploadErrors.value = []
  }

  const reset = () => {
    isUploading.value = false
    uploadProgress.value = { current: 0, total: 0, percentage: 0 }
    uploadErrors.value = []
  }

  return {
    isUploading: readonly(isUploading),
    uploadProgress: readonly(uploadProgress),
    uploadErrors: readonly(uploadErrors),
    progressPercentage,
    hasErrors,
    uploadImages,
    validateFiles,
    clearErrors,
    reset
  }
}

function readonly<T>(ref: import('vue').Ref<T>) {
  return computed(() => ref.value)
}
