// Core data models for Name That Thing application

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  imageIds: string[];
  settings?: {
    shuffleImages: boolean;
    showFileName: boolean;
  };
}

export interface GameImage {
  id: string;
  categoryId: string;
  originalName: string;
  mimeType: string;
  originalSize: number;
  processedSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  pixelationLevels: {
    level1: Blob | null; // Most pixelated (32x32)
    level2: Blob | null; // Medium pixelated (16x16)
    level3: Blob | null; // Light pixelated (8x8)
    level4: Blob | null; // Original/clear
  };
  metadata: {
    uploadedAt: Date;
    processedAt: Date;
  };
}

export interface GameState {
  currentCategory: Category | null;
  currentImageIndex: number;
  currentPixelationLevel: number;
  gameMode: 'setup' | 'playing' | 'paused';
  settings: {
    fullscreen: boolean;
    showProgress: boolean;
    autoAdvance: boolean;
  };
}

export interface AppSettings {
  theme: 'light' | 'dark';
  maxImageSize: number;
  compressionQuality: number;
  pixelationLevels: number[];
}

// Utility types
export type PixelationLevel = 1 | 2 | 3 | 4;

export interface ImageProcessingResult {
  success: boolean;
  error?: string;
  processedImage?: GameImage;
}

export interface ExportData {
  version: string;
  exportDate: string;
  categories: Category[];
  images: GameImage[];
  blobs: Record<string, string>; // base64 encoded blobs
}

// UI Event types
export interface ImageUploadEvent {
  files: FileList;
  categoryId: string;
}

export interface GameControlEvent {
  action: 'next' | 'previous' | 'reset' | 'reveal';
  payload?: any;
}
