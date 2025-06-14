<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Name That Thing - Copilot Instructions

This is a Vue.js 3 web application for an interactive guessing game called "Name That Thing". The game displays progressively clearer pixelated images until the audience guesses correctly.

## Project Context
- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: SCSS with modern CSS features
- **Storage**: IndexedDB for offline data persistence
- **Image Processing**: HTML5 Canvas API

## Key Features
1. **Category Management**: Create/edit categories of images
2. **Image Upload & Processing**: Auto-resize and generate 4 pixelation levels
3. **Game Presentation**: Fullscreen mode with manual progression controls
4. **Offline Capability**: Complete offline functionality with local storage
5. **Data Export/Import**: File-based persistence with JSON export/import

## Code Style Guidelines
- Use TypeScript for type safety
- Follow Vue.js 3 Composition API patterns
- Use Pinia for state management
- Implement proper error handling for file operations
- Use modern CSS with CSS Grid/Flexbox
- Follow accessibility best practices
- Optimize for desktop/laptop presentation use

## Technical Considerations
- Images are processed client-side using Canvas API
- All data stored locally in IndexedDB
- Maximum image width of 1280px
- Support for JPG, PNG, GIF, WebP formats
- Progressive pixelation: 8x8 → 16x16 → 32x32 → original
- File-based export/import using JSON format

## Architecture
- Component-based Vue.js architecture
- Service layer for business logic
- Repository pattern for data access
- Event-driven communication between components
- Modular SCSS organization
