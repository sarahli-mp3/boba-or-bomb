# Boba or Bomb Game

A simple three-page game built with React, TypeScript, and Vite. Catch boba pearls while avoiding bombs!

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to the local server (usually http://localhost:3000)

## How to Play

1. **Start Screen**: Choose your favorite drink (Taro, Milk Tea, or Matcha)
2. **Game Screen**:
   - Use arrow keys (←/→) or A/D keys to move your cup
   - Touch and drag on mobile devices
   - Catch boba pearls (good!) and avoid bombs (bad!)
   - Fill your cup with 10 boba pearls to win
3. **Result Screen**: See if you won or lost, then play again!

## Game Features

- Responsive design that works on mobile and desktop
- Canvas-based rendering with smooth animations
- Touch and keyboard controls
- Visual cup filling as you collect boba
- Automatic window resize handling
- High DPI display support

## Technical Details

- Built with React 18, TypeScript, and Vite
- Uses HTML5 Canvas for game rendering
- RequestAnimationFrame for smooth 60fps gameplay
- Device pixel ratio support for crisp graphics
- Fixed delta time for consistent physics across devices
