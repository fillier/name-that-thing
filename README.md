# Name That Thing - Interactive Guessing Game

A Vue.js 3 web application for hosting interactive guessing games where presenters display progressively clearer pixelated images until the audience guesses correctly.

## 🎯 Perfect For
- Classroom activities and educational presentations
- Team building events and icebreakers
- Virtual meetings and screen sharing sessions
- Family game nights and parties
- Training sessions and conferences

## ✨ Key Features

### 🎮 Game Mechanics
- **Progressive Revelation**: Images start heavily pixelated (8x8) and become clearer through 4 levels
- **Manual Control**: Host controls when to reveal more detail or move to next image
- **Flexible Categories**: Organize content by themes (Movies, Animals, Landmarks, etc.)
- **Instant Reset**: Quickly return any image to its most pixelated state

### 🖥️ Presentation Features
- **Fullscreen Mode**: Distraction-free presentation view for screen sharing
- **Keyboard Shortcuts**: Arrow keys for navigation, spacebar to reveal, F for fullscreen
- **Progress Tracking**: Visual indicators showing game progress and clarity levels
- **Professional UI**: Clean, modern interface optimized for projection

### 💾 Data Management
- **Offline First**: Complete functionality without internet connection
- **Local Storage**: All data stored locally using IndexedDB
- **Import/Export**: Backup and share game sets as JSON files
- **Drag & Drop**: Easy image uploading with batch processing

### 🔧 Technical Highlights
- **Vue.js 3** with Composition API and TypeScript
- **Vite** for fast development and building
- **Pinia** for state management
- **IndexedDB** for persistent local storage
- **Canvas API** for client-side image processing
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation
```bash
# Clone or download the project
cd name-that-thing

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The built application will be in the `dist/` directory and can be served from any static web server or opened directly in a browser.

## 📖 How to Use

### 1. Create Categories
1. Launch the application
2. Click "Add Category" on the main screen
3. Enter a name and optional description
4. Categories help organize your images by theme

### 2. Add Images
1. Select a category from the left panel
2. Click "Add Images" to upload photos
3. Supported formats: JPG, PNG, GIF, WebP (max 10MB each)
4. Images are automatically processed and optimized

### 3. Start Presenting
1. Select a category with images
2. Click "Start Game" to enter presentation mode
3. Use controls or keyboard shortcuts to manage the game
4. Click "Fullscreen" for optimal screen sharing

### 4. Game Controls
- **Previous/Next**: Navigate between images
- **Reveal More**: Show the next level of clarity
- **Reset**: Return to most pixelated version
- **Progress Bar**: Track completion status

### 5. Keyboard Shortcuts
- `→` or `Space`: Reveal more or next image
- `←`: Previous image  
- `R`: Reset current image
- `F`: Toggle fullscreen
- `Esc`: Exit fullscreen or pause

## 🎯 Use Cases & Examples

### Educational Settings
- **Geography**: Countries, capitals, landmarks
- **Science**: Animals, plants, lab equipment
- **History**: Historical figures, artifacts, events
- **Literature**: Book covers, author portraits

### Corporate Training
- **Team Building**: Employee photos, office locations
- **Product Training**: Product images, logos, interfaces
- **Safety Training**: Equipment, procedures, hazards

### Entertainment
- **Movie Night**: Film stills, movie posters, actors
- **Sports Events**: Athletes, teams, equipment
- **Pop Culture**: Celebrities, TV shows, music artists

## 📁 Data Management

### Export Data
1. Go to Settings
2. Click "Export Data"
3. Save JSON file as backup
4. Share with other users or devices

### Import Data
1. Go to Settings  
2. Click "Import Data"
3. Select previously exported JSON file
4. Data merges with existing content

### Storage Location
- **Browser**: IndexedDB (persistent local storage)
- **File Size**: Automatically optimized images
- **Backup**: Regular exports recommended

## 🔧 Technical Details

### Architecture
- **Frontend**: Vue.js 3 with Composition API
- **State Management**: Pinia stores
- **Routing**: Vue Router for navigation
- **Styling**: SCSS with CSS custom properties
- **Build Tool**: Vite for fast development

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance
- **Image Processing**: Automatic resizing and optimization for web delivery
- **Memory Management**: Efficient blob storage and cleanup
- **Progressive Loading**: Images loaded as needed
- **Responsive UI**: Non-blocking operations

### Image Processing
- **Maximum Width**: 1280px (automatically resized)
- **Quality**: 90% (optimized for web)
- **Pixelation Levels**: 8x8 → 16x16 → 32x32 → Original
- **Supported Formats**: JPG, PNG, GIF, WebP

## 🔒 Privacy & Security

- **Local Storage Only**: No data sent to external servers
- **Offline Operation**: Complete functionality without internet
- **User Control**: Full control over data import/export
- **No Tracking**: No analytics or user tracking implemented

## 🛠️ Troubleshooting

### Common Issues

**Images Not Loading**
- Check file format (JPG, PNG, GIF, WebP only)
- Verify file size is under 10MB
- Try refreshing the browser

**Performance Issues**
- Limit concurrent uploads to 3-5 images
- Use smaller image files when possible
- Clear browser cache if needed

**Display Problems**
- Ensure browser is up to date
- Check screen resolution and zoom level
- Try different browser if issues persist

### Getting Help
- Check browser console for error messages
- Try export/import to backup data before troubleshooting
- Test with different image formats and sizes

## 📁 Project Structure

```
src/
├── components/          # Vue components
│   ├── common/         # Shared components
│   ├── game/           # Game-specific components
│   └── setup/          # Setup and management components
├── stores/             # Pinia state stores
├── services/           # Business logic services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── views/              # Page components
└── styles/             # Global styles and SCSS
```

## 📄 Documentation

For detailed technical information, architecture decisions, and implementation details, see:
- [Technical Design Document](./TECHNICAL_DESIGN.md) - Complete architecture and implementation guide
- [Project Status](./PROJECT_STATUS.md) - Current development status and feature completion

## 🙏 Credits

Built with modern web technologies:
- Vue.js 3 - Progressive JavaScript framework
- Pinia - State management
- Vite - Build tool and development server
- TypeScript - Type safety
- SCSS - Enhanced CSS with variables and mixins

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Presenting! 🎉**

Whether you're teaching a class, running a meeting, or hosting a party, Name That Thing makes interactive guessing games fun and engaging for everyone.
