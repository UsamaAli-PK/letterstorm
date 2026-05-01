# Software Architecture: Letterstorm

This document outlines the software design patterns, state management, and asset-generation approaches used in the application.

## 1. System Overview

Letterstorm is a single-page React application (SPA). To maintain 60 FPS while managing multiple on-screen entities (words dropping down the screen, player projectiles, and explosion particles), the application employs a hybrid functional-reactive game loop approach.

Instead of binding entity coordinates completely to React state and re-rendering the DOM on every tick, the application utilizes standard React component state for high-level UI updates (score, waves, combos) and utilizes a `requestAnimationFrame` (rAF) loop backed by React `useRef` for rapid coordinate logic. 

However, since this is a pure DOM-based game (no `<canvas>`), React ultimately maps the `.current` refs back to the DOM at a controlled rate, heavily optimized via Tailwind hardware-acceleration utilities (`translate`, `scale`).

## 2. Core Components

### 2.1 The Game Loop Hook (`useCallback` + `requestAnimationFrame`)

The core game logic lives in the `gameLoop` function within `src/components/Game.tsx`. 

**Responsibilities of Game Loop:**
- **DeltaTime Calculations:** Standardizes movement speeds regardless of the refresh rate.
- **Entity Spawning:** Checks intervals to determine if a new enemy, wave, or powerup should be initialized.
- **Collision Detection & Movement:** Moves words downwards and calculates if a target word hit the bottom margin (resulting in a 'loss' scenario).
- **Particle Animation:** Updates X/Y/Opacity of explosion particles.

### 2.2 Input Handling (Typing)

User input bypasses traditional forms. An event listener is attached globally to `keydown`.
- **Character Matching:** When a user types, the handler filters for alphanumeric keys.
- **Target Lock:** If no target is selected, it searches the `enemies` array for any word starting with the typed letter. If found, it "locks" onto that word's ID.
- **Progression:** Subsequent keystrokes must strictly match the following characters in the "locked" target. Correct keystrokes increment the `combo` counter, while incorrect ones reset the combination.
- **Destruction:** Once the typed string perfectly matches the target word, the enemy is flagged for destruction, particles are spawned, score is awarded, and `targetId` is set to null.

### 2.3 State Management (Refs vs. State)

- **`useRef`:** Used for data that mutations constantly within the game loop and does not strictly require an instant UI hydration. Examples: `enemiesRef`, `particlesRef`, `projectilesRef`.
- **`useState`:** Used for data that the broader React component tree relies on for conditional rendering. Examples: `gameState` ('menu', 'playing', 'gameover'), `stats` (Score, Wave, EndTime).

## 3. Audio Synthesis (Web Audio API)

A notable architectural aspect of Letterstorm is its absence of `.mp3` or `.wav` files. All game audio is procedurally synthesized at runtime via the browser's Web Audio API (`AudioContext`).

**Sound Generator Functions:**
- `playShootSound()`: Uses a high-frequency `square` wave with an aggressive `exponentialRampToValueAtTime` downward pitch bend to mimic arcade lasers.
- `playHitSound()`: Uses a `sawtooth` wave with a low frequency envelope to create a percussive explosion crunch.
- `startAmbientMusic()`: Combines `sine` and `triangle` oscillators acting as a slow, continuous drone chord with LFOs modulating the volume to create breathing ambiance.

This guarantees a near-instant load time for the game and circumvents standard browser audio blocking policies, as audio is strictly initialized inside the `keydown` and `click` user-interaction handlers.

## 4. UI Strategy & Styling

### 4.1 Tailwind & Motion

The game leans heavily into the Cyberpunk / Terminal aesthetic using core Tailwind utility structures:
- `text-emerald-400`, `text-red-500`
- Extensive `drop-shadow-[...]` usage to create glowing neon typography.
- Standard CSS grid/flex structures layered upon absolute positioning for game elements.

Motion's `AnimatePresence` is used specifically for menu modal transitions (Main Menu -> Game Over Modal), abstracting layout animations securely away from the raw CSS update loop of the game.

### 4.2 Single File Component (Game.tsx)

Currently, the primary loop, particle logic, and modal rendering are compacted within `Game.tsx` for hyper-fast iteration. In a future production-scale context, the following architecture is advised:
- `/hooks/useGameLoop.ts`
- `/hooks/useAudioEngine.ts`
- `/components/Entities/Enemy.tsx`
- `/components/UI/Modals.tsx`

## 5. Deployment 

The app generates a purely static `dist/` folder via Vite. The production environment configuration relies on `nginx` routing (via the provided `Dockerfile` and `nginx.conf`) to serve `index.html` across all routes, satisfying the standard requirements for a modern SPA.
