# Snake Game — Animated Web Implementation

A fully-featured Snake game built with HTML, CSS, JavaScript, GSAP, and Tailwind CSS — rendered on a CSS Grid game board (no canvas), with keyboard controls, on-screen directional buttons, swipe gesture support, progressive difficulty, persistent high score via `localStorage`, live game stats panel, and three overlay screens (Start, Game Over, Pause). The entire project ships as three files totalling under 200 lines of HTML, with all game logic in `script.js` and visual theming in `style.css`.

---

## What This Project Does

The page opens on a dark slate game board with a Start Screen overlay explaining the controls. Clicking "START GAME" dismisses the overlay and begins the game loop. A snake represented as a series of highlighted grid cells moves in the current direction at a fixed interval, growing by one cell each time it eats the red food item. Score, high score, and level counters update in real time in three stat cards above the board. A side panel tracks speed level label, total foods eaten, and current snake length. When the snake hits a wall or its own body, the Game Over screen displays the final score and high score. The Pause screen (triggered by `P`, `Space`, or the on-screen pause button) freezes the game loop and offers Resume and Restart options.

---

## Game Board — CSS Grid, Not Canvas

The game is rendered on a `div#game-grid` using CSS Grid — no `<canvas>` element. `script.js` dynamically generates an `N×N` grid of `div.cell` elements as the game initializes. Each cell is a fixed-size square. The snake occupies a set of cells that receive a `.snake` class; the head cell gets an additional `.snake-head` class with a distinct style. The food occupies a single cell with a `.food` class. On every game tick, the JavaScript engine calculates the next head position, checks for collisions, updates the snake body array, removes the `.snake` and `.food` classes from all cells, then re-applies them to the current snake positions and the food position. This approach makes grid state fully readable as DOM at all times, and avoids the imperative pixel-level drawing of canvas.

---

## Game Loop — `setInterval` + Progressive Difficulty

The core loop runs via `setInterval(gameStep, currentSpeed)`. `currentSpeed` starts at a normal baseline (e.g., 150ms per tick) and is recalculated every time `foodsEaten` hits a multiple of 5:

```js
if (foodsEaten % 5 === 0 && foodsEaten > 0) {
  currentLevel++;
  currentSpeed = Math.max(50, baseSpeed - (currentLevel - 1) * 15);
  clearInterval(gameInterval);
  gameInterval = setInterval(gameStep, currentSpeed);
}
```

The interval is cleared and restarted with the new speed — a clean restart pattern that avoids interval drift. `Math.max(50, ...)` caps the minimum speed at 50ms/tick so the game never becomes physically unplayable. The side panel's "Speed Level" label updates to reflect the current tier (Normal → Fast → Very Fast → etc.).

---

## Collision Detection

On every tick, `gameStep()` computes `nextHead = { x: head.x + dx, y: head.y + dy }` based on current direction. Two checks run before the snake moves:

**1. Wall collision:** If `nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE`, the game ends immediately and the Game Over screen is shown.

**2. Self collision:** The snake body array is checked — if `snake.some(segment => segment.x === nextHead.x && segment.y === nextHead.y)`, the game ends.

If both checks pass, the new head is unshifted onto the snake array. If the new head position matches the food position, the tail is not removed (snake grows by 1), a new food position is randomly generated (guaranteed not to overlap any snake segment), and the score/foods-eaten/snake-length counters increment. If no food was eaten, the tail is popped from the array (snake moves forward without growing).

---

## Direction Input — Keyboard, Buttons, and Swipe

**Keyboard:** A `keydown` listener checks `e.key` against `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`. A direction-change guard prevents 180-degree reversal (e.g., going left while moving right). `P` toggles pause; `r` or `Space` restarts.

**On-screen buttons:** `#up-btn`, `#down-btn`, `#left-btn`, `#right-btn` each have `click` listeners that call the same direction-change function as the keyboard handler — applying the identical reversal guard.

**Swipe gestures:** `touchstart` and `touchend` listeners on the game board record `startX`/`startY` and compute `deltaX`/`deltaY` on touch end. Whichever delta is larger in absolute value determines the swipe axis; the sign determines the direction. The same direction-change guard applies.

---

## GSAP Animations

GSAP (loaded from CDN: `gsap.min.js` v3.11.4) handles the non-game-loop animations:

**Food appear:** When new food spawns, `gsap.from('.food', { scale: 0, duration: 0.3, ease: 'back.out(1.7)' })` pops the food cell into view with a spring-like overshoot.

**Score update:** When the score counter increments, `gsap.from('#score', { scale: 1.4, duration: 0.3, ease: 'power2.out' })` briefly scales the score display up then back to 1 — a visual "pop" that draws attention to the change.

**Game Over entrance:** `gsap.from('#game-over-screen', { opacity: 0, y: -30, duration: 0.5, ease: 'power3.out' })` slides the overlay in from above.

**Level up:** When the level increments, `gsap.from('#level', { scale: 1.6, color: '#facc15', duration: 0.4 })` briefly enlarges and gold-tints the level counter.

---

## Screens — Start, Game Over, Pause

All three screens are `div.screen-overlay` elements absolutely positioned inside `.game-board`, filling it completely. They are shown/hidden by toggling the `hidden` class (which sets `display: none`). Each overlay has a semi-transparent dark backdrop (`background: rgba(0,0,0,0.85)`) with a flex column center layout.

**Start Screen (`#start-screen`):** Displays the game title, a "How to Play" card with four instruction items (arrow key control, food growth, collision death, speed progression), and the "START GAME" button. Removed on first game start and never shown again in the session — the Game Over screen handles subsequent restarts.

**Game Over Screen (`#game-over-screen`):** Displays "GAME OVER", final score, and session high score (read from `localStorage`). The "PLAY AGAIN" button restarts the game loop and re-hides the overlay.

**Pause Screen (`#pause-screen`):** Displayed when `P` or the pause button is pressed during active gameplay. Shows "GAME PAUSED" and two buttons — "RESUME" (clears pause state and restarts the interval) and "RESTART" (resets game state entirely).

---

## Persistent High Score — `localStorage`

On every game over, `script.js` reads the existing high score from `localStorage.getItem('snakeHighScore')`, compares it to the current session score, and writes back the higher value via `localStorage.setItem('snakeHighScore', newHigh)`. On game initialization, the high score display is pre-populated from storage — so the personal best persists across browser sessions and page refreshes.

---

## Responsive Layout

The layout uses Tailwind CSS (CDN) utility classes throughout. The game board and side panel stack vertically on screens below the `lg` breakpoint and sit side-by-side on large screens (`flex-col lg:flex-row`). Score cards use `gap-4 md:gap-6` and `text-2xl md:text-3xl` for fluid scaling. Control buttons and padding scale between `p-3 md:p-4`, `py-3 md:py-4`, and `px-8 md:px-12`. The game grid cell sizes are computed in `style.css` relative to the container width, so the board fills available space on any screen.

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| HTML5 | — | 197-line semantic markup — header, score cards, game board with `#game-grid` + 3 overlay screens, on-screen directional controls, game info sidebar, footer |
| Tailwind CSS | CDN (3.x) | All layout, spacing, color, and responsive utilities — `flex-col lg:flex-row`, `text-green-400`, `bg-slate-800`, responsive padding/font-size |
| CSS3 | — | Custom `game-title` font style, `screen-overlay` positioning, `game-board` border/shadow, `snake`/`snake-head`/`food` cell states, `control-btn` hover effects |
| JavaScript (ES6+) | — | Grid generation, `setInterval` game loop, collision detection, food spawn, direction-change guard, keyboard/button/swipe input, `localStorage` high score, screen toggle logic |
| GSAP | 3.11.4 (CDN) | Food spawn spring, score pop, Game Over entrance slide, level-up color flash |
| Font Awesome | 6.4.0 (CDN) | Directional arrow icons in on-screen control buttons, How-to-Play list icons, Play/Pause/Redo icons in overlay buttons |
| Google Fonts | CDN | Press Start 2P (game title), Roboto (UI body text) |

---

## Project Structure

```
Snake-Game/
├── index.html     # 197-line markup — header with 3 score cards (score/high-score/level), .game-board containing #game-grid + Start/GameOver/Pause overlay screens, 3×3 on-screen control grid (up/down/left/right + pause button), game-info sidebar (speed label, foods eaten, snake length, controls guide), footer
├── style.css      # Custom game-board border/shadow, game-title display font, screen-overlay absolute fill, snake/snake-head/food cell state classes, control-btn hover styles, score-card glassmorphism
├── script.js      # Grid generation (N×N div.cell), setInterval loop + progressive speed recalculation, wall + self collision detection, food spawn with overlap guard, direction-change 180° guard, keyboard + click + swipe input, GSAP food/score/level/gameover animations, localStorage high score read/write
└── README.md
```

---

## How to Run

1. Clone the repository
   ```bash
   git clone https://github.com/tripathipawan/Snake-Game.git
   ```
2. Open `index.html` in any modern browser. All dependencies (Tailwind, GSAP, Font Awesome, Google Fonts) load from CDN — no npm, no build step, no local server required.

---

## Controls Reference

| Input | Action |
|---|---|
| Arrow Keys | Change snake direction |
| On-screen buttons | Change snake direction (mobile) |
| Swipe (touch) | Change snake direction (mobile) |
| `P` key | Pause / Resume |
| `R` key or `Space` | Restart game |

---

## Repository

[https://github.com/tripathipawan/Snake-Game](https://github.com/tripathipawan/Snake-Game)
