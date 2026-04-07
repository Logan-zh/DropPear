# DropPear - React Version v0.4

A match-3 puzzle game built with React and Vite.

## Setup & Run

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

- `src/` - React components and game logic
  - `App.jsx` - Main app component with game state management
  - `Screens.jsx` - Home, Game, and Result screen components
  - `GameCanvas.jsx` - Canvas rendering components
  - `gameLogic.js` - Pure game logic functions
  - `main.jsx` - React entry point
- `style.css` - Global styles
- `vite.config.js` - Vite configuration
- `package.json` - Dependencies and scripts

## Game Features

- 10 difficulty levels with progression system
- Match 3 pearls to score points
- 1-minute gameplay timer
- Storage bag system (6-pearl capacity)
- Solid pearl graphics (v0.31+)
- Level unlocking system (v0.3+)

## Versions

- v0.4: Complete React refactoring with Vite
- v0.31: Solid circles at 1.2x scale, orange color in initial levels
- v0.3: Level progression, difficulty balancing
- v0.2: 7 colors, 6-pearl rows
- v0.1: Initial game concept
