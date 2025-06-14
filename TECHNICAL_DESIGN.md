# Name That Thing - Technical Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technical Stack](#technical-stack)
4. [Core Features](#core-features)
5. [Data Models](#data-models)
6. [User Interface Design](#user-interface-design)
7. [Image Processing Pipeline](#image-processing-pipeline)
8. [File Storage & Persistence](#file-storage--persistence)
9. [Implementation Plan](#implementation-plan)
10. [Testing Strategy](#testing-strategy)
11. [Deployment & Distribution](#deployment--distribution)

---

## Project Overview

**Name That Thing** is a web-based interactive guessing game where a host displays progressively clearer images to an audience until they successfully guess what the image represents. The application is designed for in-person gameplay where the host shares their screen with the audience.

### Key Requirements
- **Single-session gameplay**: Host shares screen for live interaction
- **Category management**: Create and reuse image categories
- **Progressive reveal**: 4 levels of pixelation (heavy → clear)
- **Offline capability**: No internet required during gameplay
- **Desktop-optimized**: Designed for laptop/desktop presentation
- **File-based persistence**: Local storage with import/export capability

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Name That Thing                          │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (Vue.js Components)                    │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├─ Game State Management (Pinia)                         │
│  ├─ Image Processing Service                              │
│  ├─ Category Management Service                           │
│  └─ File I/O Service                                      │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                               │
│  ├─ IndexedDB (Images & Metadata)                        │
│  └─ JSON Export/Import                                    │
├─────────────────────────────────────────────────────────────┤
│  Browser APIs                                             │
│  ├─ Canvas API (Image Processing)                        │
│  ├─ File API (Upload/Download)                           │
│  └─ IndexedDB API (Persistence)                          │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture
```
App.vue
├─ GameSetup.vue
│  ├─ CategoryManager.vue
│  ├─ ImageUploader.vue
│  └─ GameSettings.vue
├─ GamePlay.vue
│  ├─ ImageDisplay.vue
│  ├─ GameControls.vue
│  └─ ProgressIndicator.vue
└─ Settings.vue
   ├─ DataManager.vue
   └─ AppSettings.vue
```

---

## Technical Stack

### Frontend Framework
- **Vue.js 3** - Progressive JavaScript framework
- **Composition API** - For better code organization and reusability
- **Pinia** - State management library
- **Vue Router** - Client-side routing

### Build Tools & Development
- **Vite** - Fast build tool and development server
- **TypeScript** - Type safety and better developer experience
- **ESLint** - Code linting and formatting
- **Sass/SCSS** - CSS preprocessor for styling

### Browser APIs
- **Canvas API** - Image manipulation and pixelation effects
- **File API** - File upload and download functionality
- **IndexedDB** - Client-side database for persistent storage
- **Web Workers** - Background processing for image operations

### UI/UX
- **CSS Grid & Flexbox** - Modern layout techniques
- **CSS Custom Properties** - Theming and responsive design
- **Transitions & Animations** - Smooth user interactions

---

## Core Features

### 1. Category Management
- **Create Categories**: Add new game categories with names and descriptions
- **Edit Categories**: Modify existing category information
- **Delete Categories**: Remove categories and associated images
- **Category Import/Export**: Share categories via JSON files

### 2. Image Management
- **Multi-format Support**: JPG, PNG, GIF, WebP, SVG
- **Automatic Resizing**: Resize images to max 1280px width
- **Pixelation Generation**: Create 4 levels of pixelation automatically
- **Image Preview**: Preview images before adding to categories
- **Image Metadata**: Store original filename, dimensions, and processing info

### 3. Game Gameplay
- **Category Selection**: Choose from available categories
- **Progressive Reveal**: Manual control through 4 pixelation levels
- **Fullscreen Mode**: Optimize for presentation
- **Game Controls**: Next image, previous image, reset level
- **Progress Tracking**: Show current image and remaining images

### 4. Data Persistence
- **Local Storage**: All data stored locally in browser
- **Export Functionality**: Export categories and images as files
- **Import Functionality**: Import previously exported data
- **Backup & Restore**: Complete application data backup

---

## Data Models

### Category Model
```typescript
interface Category {
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
```

### Image Model
```typescript
interface GameImage {
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
    level1: Blob; // Most pixelated
    level2: Blob;
    level3: Blob;
    level4: Blob; // Original/clear
  };
  metadata: {
    uploadedAt: Date;
    processedAt: Date;
  };
}
```

### Game State Model
```typescript
interface GameState {
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
```

---

## User Interface Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                      Header                                 │
│  [Logo] Name That Thing                      [Settings] [?] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                   Main Content Area                         │
│                                                             │
│  Setup Mode:                Game Mode:                      │
│  ├─ Category List           ├─ Large Image Display          │
│  ├─ Image Grid             ├─ Pixelation Controls           │
│  └─ Upload Area            └─ Game Progress                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Footer/Controls                          │
│           [Start Game] [Settings] [Export Data]             │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Design
- **Minimum Resolution**: 1024x768
- **Optimal Resolution**: 1920x1080
- **Responsive Breakpoints**: 1024px, 1440px, 1920px
- **Fullscreen Mode**: Available for game presentation

### Color Scheme
```scss
$primary-color: #2563eb;     // Blue
$secondary-color: #7c3aed;   // Purple
$success-color: #10b981;     // Green
$warning-color: #f59e0b;     // Orange
$error-color: #ef4444;       // Red
$background: #f8fafc;        // Light gray
$surface: #ffffff;           // White
$text-primary: #1f2937;      // Dark gray
$text-secondary: #6b7280;    // Medium gray
```

---

## Image Processing Pipeline

### Upload Process
1. **File Validation**
   - Check file type against supported formats
   - Validate file size (max 10MB per image)
   - Verify image dimensions

2. **Image Optimization**
   - Resize to maximum 1280px width (maintain aspect ratio)
   - Convert to optimal format if needed
   - Compress to reduce file size

3. **Pixelation Generation**
   - **Level 1 (Heavy)**: 8x8 pixel blocks
   - **Level 2 (Medium)**: 16x16 pixel blocks
   - **Level 3 (Light)**: 32x32 pixel blocks
   - **Level 4 (Original)**: No pixelation

4. **Storage**
   - Store all levels as Blob objects
   - Save metadata to IndexedDB
   - Generate unique identifiers

### Pixelation Algorithm
```typescript
function createPixelatedImage(
  canvas: HTMLCanvasElement,
  pixelSize: number
): Blob {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Apply pixelation effect
  for (let y = 0; y < canvas.height; y += pixelSize) {
    for (let x = 0; x < canvas.width; x += pixelSize) {
      const pixelColor = getAverageColor(imageData, x, y, pixelSize);
      fillPixelBlock(ctx, x, y, pixelSize, pixelColor);
    }
  }
  
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', 0.9);
  });
}
```

---

## File Storage & Persistence

### IndexedDB Schema
```javascript
// Database: NameThatThingDB
// Version: 1

// Object Stores:
{
  categories: {
    keyPath: 'id',
    indexes: ['name', 'createdAt']
  },
  images: {
    keyPath: 'id',
    indexes: ['categoryId', 'originalName']
  },
  blobs: {
    keyPath: 'id',
    indexes: ['imageId', 'level']
  },
  settings: {
    keyPath: 'key'
  }
}
```

### Export/Import Format
```json
{
  "version": "1.0.0",
  "exportDate": "2025-06-14T10:30:00Z",
  "categories": [...],
  "images": [...],
  "blobs": {
    "imageId_level1": "base64_data",
    "imageId_level2": "base64_data",
    ...
  }
}
```

### File Operations
- **Export**: Convert IndexedDB data to JSON file
- **Import**: Parse JSON and restore to IndexedDB
- **Backup**: Complete application state export
- **Clear Data**: Remove all stored data with confirmation

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up Vue.js project with Vite
- [ ] Configure TypeScript and development tools
- [ ] Implement basic routing structure
- [ ] Set up Pinia state management
- [ ] Create basic UI components and layout

### Phase 2: Image Processing (Week 3-4)
- [ ] Implement file upload functionality
- [ ] Create Canvas-based image processing
- [ ] Build pixelation algorithm
- [ ] Add image resizing and optimization
- [ ] Test with various image formats

### Phase 3: Data Management (Week 5-6)
- [ ] Implement IndexedDB integration
- [ ] Create category management system
- [ ] Build image storage and retrieval
- [ ] Add export/import functionality
- [ ] Implement data validation

### Phase 4: Game Logic (Week 7-8)
- [ ] Create game state management
- [ ] Build game play interface
- [ ] Implement progressive reveal system
- [ ] Add game controls and navigation
- [ ] Create fullscreen presentation mode

### Phase 5: Polish & Testing (Week 9-10)
- [ ] Implement responsive design
- [ ] Add animations and transitions
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation and user guide

---

## Testing Strategy

### Unit Testing
- **Framework**: Vitest (Vite's testing framework)
- **Coverage**: Minimum 80% code coverage
- **Focus Areas**:
  - Image processing functions
  - Data validation logic
  - State management actions
  - Utility functions

### Integration Testing
- **Database Operations**: IndexedDB interactions
- **File Operations**: Upload, export, import
- **Image Processing**: End-to-end pixelation pipeline
- **State Management**: Complex state transitions

### End-to-End Testing
- **Framework**: Playwright or Cypress
- **Test Scenarios**:
  - Complete game setup workflow
  - Full gameplay session
  - Data export/import cycle
  - Error handling and recovery

### Performance Testing
- **Image Processing**: Large image handling
- **Memory Usage**: Multiple categories and images
- **Rendering Performance**: Smooth animations
- **Storage Limits**: Maximum data capacity

---

## Deployment & Distribution

### Build Configuration
```javascript
// vite.config.js
export default {
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia'],
          utils: ['./src/utils']
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
}
```

### Distribution Options
1. **Standalone HTML Bundle**
   - Single HTML file with inline assets
   - Portable and easy to share
   - Suitable for offline use

2. **Static Website**
   - Traditional web hosting
   - CDN distribution
   - Progressive Web App capabilities

3. **Desktop Application**
   - Electron wrapper (future enhancement)
   - Native file system access
   - Cross-platform distribution

### PWA Features (Optional Enhancement)
- **Service Worker**: Offline functionality
- **Web App Manifest**: Installable app
- **Background Sync**: Data synchronization
- **Push Notifications**: Game reminders

---

## Security Considerations

### Data Protection
- **Local Storage Only**: No external data transmission
- **File Validation**: Strict input validation
- **Memory Management**: Proper cleanup of large objects
- **Error Handling**: Graceful failure modes

### Performance Safeguards
- **File Size Limits**: Prevent memory exhaustion
- **Processing Limits**: Batch operations for large datasets
- **Storage Quotas**: Monitor IndexedDB usage
- **Garbage Collection**: Explicit cleanup of unused data

---

## Future Enhancements

### Potential Features
1. **Multi-language Support**: Internationalization
2. **Themes**: Customizable UI themes
3. **Sound Effects**: Audio feedback
4. **Timer Mode**: Timed gameplay
5. **Scoring System**: Point-based competition
6. **Team Mode**: Multiple team gameplay
7. **Remote Play**: Network-based audience participation
8. **Video Support**: Animated content
9. **Cloud Sync**: Optional cloud storage
10. **Mobile App**: Native mobile companion

### Technical Improvements
- **Web Workers**: Background image processing
- **WebAssembly**: High-performance image operations
- **IndexedDB Optimization**: Better query performance
- **Caching Strategy**: Intelligent asset caching
- **Accessibility**: Screen reader support and keyboard navigation

---

## Conclusion

This technical design provides a comprehensive blueprint for implementing "Name That Thing" as a robust, offline-capable web application. The modular architecture ensures maintainability and extensibility, while the chosen technology stack provides modern development practices and optimal performance.

The implementation plan provides a clear roadmap for development, with well-defined phases and milestones. The testing strategy ensures reliability and performance, while the deployment options provide flexibility for different use cases.

This design document serves as the foundation for development and should be updated as the project evolves and requirements change.
