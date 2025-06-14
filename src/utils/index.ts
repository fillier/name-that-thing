// Utility functions for Name That Thing application

/**
 * Generate a unique ID using crypto.randomUUID()
 */
export const generateId = (): string => {
  return crypto.randomUUID()
}

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format date in a readable format
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Validate image file type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Validate image file size (max 10MB)
 */
export const isValidImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes
  return file.size <= maxSize
}

/**
 * Load image from file and return HTMLImageElement
 */
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Resize image to maximum width while maintaining aspect ratio
 */
export const resizeImage = (
  img: HTMLImageElement,
  maxWidth: number = 1280,
  quality: number = 0.9
): Promise<{
  canvas: HTMLCanvasElement
  blob: Blob
  dimensions: { width: number; height: number }
}> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }
    
    // Calculate new dimensions
    let { width, height } = img
    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }
    
    canvas.width = width
    canvas.height = height
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, width, height)
    
    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            canvas,
            blob,
            dimensions: { width, height }
          })
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Create pixelated version of image
 */
export const createPixelatedImage = (
  canvas: HTMLCanvasElement,
  pixelSize: number,
  quality: number = 0.9
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }
    
    const { width, height } = canvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Create pixelated effect
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        // Get average color for the pixel block
        let r = 0, g = 0, b = 0, a = 0, count = 0
        
        for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4
            r += data[idx]
            g += data[idx + 1]
            b += data[idx + 2]
            a += data[idx + 3]
            count++
          }
        }
        
        if (count > 0) {
          r = Math.round(r / count)
          g = Math.round(g / count)
          b = Math.round(b / count)
          a = Math.round(a / count)
          
          // Fill the pixel block with average color
          for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
            for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4
              data[idx] = r
              data[idx + 1] = g
              data[idx + 2] = b
              data[idx + 3] = a
            }
          }
        }
      }
    }
    
    // Put the pixelated image data back
    ctx.putImageData(imageData, 0, 0)
    
    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create pixelated blob'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Create blob URL for display
 */
export const createBlobUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob)
}

/**
 * Revoke blob URL to free memory
 */
export const revokeBlobUrl = (url: string): void => {
  URL.revokeObjectURL(url)
}

/**
 * Download data as file
 */
export const downloadFile = (data: string, filename: string, type: string = 'application/json'): void => {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Read file as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Create a promise that resolves after specified delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if browser supports required features
 */
export const checkBrowserSupport = (): {
  supported: boolean
  missing: string[]
} => {
  const missing: string[] = []
  
  if (!window.crypto?.randomUUID) {
    missing.push('crypto.randomUUID')
  }
  
  if (!window.indexedDB) {
    missing.push('IndexedDB')
  }
  
  if (!HTMLCanvasElement.prototype.toBlob) {
    missing.push('Canvas.toBlob')
  }
  
  if (!window.URL?.createObjectURL) {
    missing.push('URL.createObjectURL')
  }
  
  return {
    supported: missing.length === 0,
    missing
  }
}
