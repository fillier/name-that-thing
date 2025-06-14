# Name That Thing

An interactive web-based guessing game where hosts display progressively clearer pixelated images until the audience successfully guesses what the image represents.

## Features

- **Category Management**: Create and organize image categories (movies, landmarks, objects, etc.)
- **Image Upload & Processing**: Automatic resizing and pixelation level generation
- **Progressive Reveal**: 4 levels of pixelation from heavily pixelated to crystal clear
- **Offline Gameplay**: Complete offline functionality with local storage
- **Host-Friendly Interface**: Designed for screen sharing and live presentation
- **Data Persistence**: Export and import categories and images as files

## Technology Stack

- **Vue.js 3** with Composition API
- **Vite** for fast development and building
- **Pinia** for state management
- **TypeScript** for type safety
- **SCSS** for styling
- **IndexedDB** for local data storage
- **Canvas API** for image processing

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built application will be in the `dist/` directory and can be served from any static web server or opened directly in a browser.

## How to Play

1. **Setup Phase**:
   - Create categories (e.g., "Movies", "Landmarks", "Animals")
   - Upload images for each category
   - Images are automatically processed into 4 pixelation levels

2. **Game Phase**:
   - Select a category to play
   - Host shares screen with audience
   - Progress through pixelation levels manually
   - Audience shouts out guesses
   - Host determines when correct answer is given

## Project Structure

```
src/
├── components/          # Vue components
├── stores/             # Pinia state stores
├── services/           # Business logic services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles and SCSS
```

## Technical Details

For detailed technical information, architecture decisions, and implementation details, see the [Technical Design Document](./TECHNICAL_DESIGN.md).

## License

This project is open source and available under the [MIT License](LICENSE).
