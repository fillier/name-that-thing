# Name That Thing - Demo Script

This script guides you through testing all the key features of the Name That Thing application.

## 🎬 Demo Walkthrough (5-10 minutes)

### 1. Initial Setup (1 minute)
- [ ] Open http://localhost:5173
- [ ] Verify the application loads with empty state
- [ ] Check responsive design by resizing browser window

### 2. Category Management (2 minutes)
- [ ] Click "Add Category" button
- [ ] Create category: "Movie Characters"
- [ ] Add description: "Famous characters from popular movies"
- [ ] Create second category: "World Landmarks"
- [ ] Select first category to see empty state

### 3. Image Upload Testing (3 minutes)
- [ ] Click "Add Images" for Movie Characters category
- [ ] Upload 3-5 sample images (JPG/PNG recommended)
- [ ] Watch upload progress indicator
- [ ] Verify images appear as thumbnails with overlay info
- [ ] Test remove image functionality
- [ ] Upload images to second category

### 4. Game Play Experience (3 minutes)
- [ ] Click "Start Game" for category with images
- [ ] Navigate to game play view
- [ ] Test image navigation (Previous/Next buttons)
- [ ] Test reveal progression (Reveal More button)
- [ ] Test reset functionality
- [ ] Try keyboard shortcuts:
  - Arrow keys for navigation
  - Spacebar to reveal more
  - R to reset
  - F for fullscreen
  - Escape to exit fullscreen

### 5. Settings and Data Management (1 minute)
- [ ] Go to Settings page
- [ ] Test export functionality (downloads JSON file)
- [ ] Test import functionality (upload the exported file)
- [ ] Verify data persistence after page refresh

## 🧪 Advanced Testing Scenarios

### Image Processing
- [ ] Upload very large image (test auto-resize to 1280px)
- [ ] Upload different formats (JPG, PNG, GIF, WebP)
- [ ] Test invalid file rejection (wrong format, too large)
- [ ] Upload batch of 10+ images (test performance)

### Error Handling
- [ ] Try to start game with empty category
- [ ] Test with corrupted image file
- [ ] Test with extremely small images
- [ ] Test browser refresh during upload

### Accessibility
- [ ] Navigate using only keyboard
- [ ] Test with screen reader (if available)
- [ ] Verify ARIA labels are present
- [ ] Check color contrast and readability

### Performance
- [ ] Create category with 20+ images
- [ ] Test smooth navigation between images
- [ ] Monitor browser memory usage
- [ ] Test on different devices/browsers

## 📋 Feature Checklist

### Core Functionality
- [x] Category creation and management
- [x] Image upload with validation
- [x] Automatic image processing (4 pixelation levels)
- [x] Game presentation with manual controls
- [x] Fullscreen mode for presentation
- [x] Keyboard navigation shortcuts
- [x] Progress tracking and indicators

### Data Management
- [x] Local storage using IndexedDB
- [x] Export data to JSON file
- [x] Import data from JSON file
- [x] Offline functionality
- [x] Data persistence across sessions

### User Experience
- [x] Responsive design
- [x] Toast notifications for user feedback
- [x] Error handling and validation
- [x] Loading states and progress indicators
- [x] Accessibility features
- [x] Professional presentation interface

### Technical Features
- [x] TypeScript type safety
- [x] Vue 3 Composition API
- [x] Pinia state management
- [x] Component-based architecture
- [x] SCSS styling with CSS variables
- [x] Vite build optimization

## 🎯 Demo Tips

### For Presentation
1. **Start with Empty State**: Show the clean, professional interface
2. **Create Themed Categories**: Use recognizable themes (movies, landmarks)
3. **Use High-Quality Images**: Better images make better demos
4. **Demonstrate Keyboard Shortcuts**: Show the presenter-friendly features
5. **Show Export/Import**: Demonstrate data portability

### For Testing
1. **Mixed File Types**: Test various image formats
2. **Different Sizes**: Test both large and small images
3. **Edge Cases**: Try empty categories, single images
4. **Browser Compatibility**: Test in different browsers
5. **Device Testing**: Try on tablet/mobile if possible

## 🐛 Known Issues to Watch For

### Current Limitations
- Maximum 10MB per image file
- Optimal performance with 20-30 images per category
- Best experience on desktop browsers
- Requires modern browser with IndexedDB support

### If You Encounter Issues
1. Check browser console for errors
2. Verify file formats and sizes
3. Try refreshing the page
4. Clear browser cache if needed
5. Test in different browser

## 🚀 Next Steps

After successful demo:
1. **Share with Users**: Get feedback on usability
2. **Content Creation**: Build image libraries for specific use cases
3. **Performance Testing**: Test with larger datasets
4. **Feature Requests**: Document desired enhancements
5. **Deployment**: Consider hosting options for broader access

---

**Demo Complete!** 🎉

The Name That Thing application is ready for interactive presentations and engaging guessing games.
