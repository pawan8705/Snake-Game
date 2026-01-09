// Game Configuration
const GRID_SIZE = 20;
const INITIAL_SPEED = 200;
const SPEED_INCREMENT = 30;
const MIN_SPEED = 80;
const SCORE_PER_FOOD = 10;
const LEVEL_UP_FOODS = 5;

// Game State
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameInterval = null;
let gameSpeed = INITIAL_SPEED;
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let level = 1;
let gameRunning = false;
let gamePaused = false;
let foodsEaten = 0;

// DOM Elements
const gameGrid = document.getElementById('game-grid');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const finalScoreElement = document.getElementById('final-score');
const finalHighScoreElement = document.getElementById('final-high-score');
const speedDisplay = document.getElementById('speed-display');
const foodsEatenElement = document.getElementById('foods-eaten');
const snakeLengthElement = document.getElementById('snake-length');

// Buttons
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const restartPauseBtn = document.getElementById('restart-pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const pauseBtn = document.getElementById('pause-btn');
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

// Initialize Game
function initGame() {
    // Set high score
    highScoreElement.textContent = highScore;
    
    // Create game grid
    createGrid();
    
    // Initialize game state
    resetGameState();
    
    // Draw initial state
    drawSnake();
    drawFood();
}

// Create Game Grid
function createGrid() {
    gameGrid.innerHTML = '';
    gameGrid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gameGrid.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = col;
            cell.dataset.y = row;
            gameGrid.appendChild(cell);
        }
    }
}

// Reset Game State
function resetGameState() {
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    
    direction = 'right';
    nextDirection = 'right';
    gameSpeed = INITIAL_SPEED;
    score = 0;
    level = 1;
    foodsEaten = 0;
    
    generateFood();
    
    updateUI();
}

// Update UI Elements
function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    foodsEatenElement.textContent = foodsEaten;
    snakeLengthElement.textContent = snake.length;
    
    // Update speed display
    if (gameSpeed <= 100) {
        speedDisplay.textContent = "Very Fast";
        speedDisplay.className = "font-bold text-red-400";
    } else if (gameSpeed <= 150) {
        speedDisplay.textContent = "Fast";
        speedDisplay.className = "font-bold text-yellow-400";
    } else {
        speedDisplay.textContent = "Normal";
        speedDisplay.className = "font-bold text-green-400";
    }
}

// Generate Food at Random Position
function generateFood() {
    let newFood;
    let foodOnSnake;
    
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        
        // Check if food would be placed on snake
        for (const segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    food = newFood;
}

// Draw Snake on Grid
function drawSnake() {
    // Clear all snake cells
    document.querySelectorAll('.snake-cell').forEach(cell => {
        cell.classList.remove('snake-cell', 'snake-head', 'snake-body');
        cell.style.background = '';
    });
    
    // Draw snake
    snake.forEach((segment, index) => {
        const cell = document.querySelector(`[data-x="${segment.x}"][data-y="${segment.y}"]`);
        if (cell) {
            cell.classList.add('snake-cell');
            
            if (index === 0) {
                cell.classList.add('snake-head');
                cell.classList.remove('snake-body');
            } else {
                cell.classList.add('snake-body');
                cell.classList.remove('snake-head');
            }
            
            // Add GSAP animation for head movement
            if (index === 0) {
                gsap.to(cell, {
                    scale: 1.1,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                });
            }
        }
    });
}

// Draw Food on Grid
function drawFood() {
    // Clear previous food
    document.querySelectorAll('.food-cell').forEach(cell => {
        cell.classList.remove('food-cell');
        cell.style.background = '';
    });
    
    // Draw new food
    const cell = document.querySelector(`[data-x="${food.x}"][data-y="${food.y}"]`);
    if (cell) {
        cell.classList.add('food-cell');
        
        // Animate food
        gsap.to(cell, {
            rotation: 360,
            duration: 3,
            ease: "none",
            repeat: -1
        });
    }
}

// Move Snake
function moveSnake() {
    if (!gameRunning || gamePaused) return;
    
    direction = nextDirection;
    
    // Calculate new head position
    const head = {...snake[0]};
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score += SCORE_PER_FOOD;
        foodsEaten++;
        
        // Check level up
        if (foodsEaten % LEVEL_UP_FOODS === 0) {
            levelUp();
        }
        
        // Generate new food
        generateFood();
        drawFood();
        
        // Animate score
        gsap.to(scoreElement, {
            scale: 1.3,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    // Update UI and draw
    updateUI();
    drawSnake();
}

// Level Up
function levelUp() {
    level++;
    gameSpeed = Math.max(MIN_SPEED, gameSpeed - SPEED_INCREMENT);
    
    // Animate level up
    gsap.to(levelElement, {
        scale: 1.5,
        duration: 0.3,
        yoyo: true,
        repeat: 2,
        ease: "bounce.out"
    });
    
    // Update game interval
    if (gameRunning && !gamePaused) {
        clearInterval(gameInterval);
        gameInterval = setInterval(moveSnake, gameSpeed);
    }
    
    updateUI();
}

// Start Game
function startGame() {
    resetGameState();
    
    // Hide screens
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    
    // Reset grid
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('snake-cell', 'food-cell', 'snake-head', 'snake-body');
        cell.style.background = '';
    });
    
    // Draw initial state
    drawSnake();
    drawFood();
    
    // Start game loop
    gameRunning = true;
    gamePaused = false;
    
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    gameInterval = setInterval(moveSnake, gameSpeed);
    
    // Update button
    pauseBtn.innerHTML = '<i class="fas fa-pause text-xl md:text-2xl"></i>';
    
    // Animate start
    gsap.from(".game-board", {
        scale: 0.9,
        opacity: 0.8,
        duration: 0.5,
        ease: "back.out(1.7)"
    });
}

// Game Over
function gameOver() {
    gameRunning = false;
    clearInterval(gameInterval);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
        
        // Animate new high score
        gsap.to(highScoreElement, {
            scale: 1.5,
            duration: 0.5,
            yoyo: true,
            repeat: 3,
            ease: "elastic.out(1, 0.5)"
        });
    }
    
    // Update final scores
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    
    // Show game over screen
    gameOverScreen.classList.remove('hidden');
    
    // Animate game over
    gsap.from("#game-over-screen", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
    });
}

// Pause Game
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        clearInterval(gameInterval);
        pauseScreen.classList.remove('hidden');
        pauseBtn.innerHTML = '<i class="fas fa-play text-xl md:text-2xl"></i>';
        
        gsap.from("#pause-screen", {
            scale: 0.9,
            opacity: 0,
            duration: 0.3
        });
    } else {
        pauseScreen.classList.add('hidden');
        gameInterval = setInterval(moveSnake, gameSpeed);
        pauseBtn.innerHTML = '<i class="fas fa-pause text-xl md:text-2xl"></i>';
    }
}

// Change Direction
function changeDirection(newDirection) {
    // Prevent 180-degree turns
    if (
        (newDirection === 'up' && direction !== 'down') ||
        (newDirection === 'down' && direction !== 'up') ||
        (newDirection === 'left' && direction !== 'right') ||
        (newDirection === 'right' && direction !== 'left')
    ) {
        nextDirection = newDirection;
    }
}

// Initialize Event Listeners
function initEventListeners() {
    // Keyboard Controls
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp': changeDirection('up'); e.preventDefault(); break;
            case 'ArrowDown': changeDirection('down'); e.preventDefault(); break;
            case 'ArrowLeft': changeDirection('left'); e.preventDefault(); break;
            case 'ArrowRight': changeDirection('right'); e.preventDefault(); break;
            case ' ':
            case 'p':
            case 'P': togglePause(); e.preventDefault(); break;
            case 'r':
            case 'R':
            case 'Enter':
                if (!gameRunning || gamePaused) {
                    startGame();
                    e.preventDefault();
                }
                break;
        }
    });
    
    // Button Controls
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    restartPauseBtn.addEventListener('click', startGame);
    resumeBtn.addEventListener('click', togglePause);
    pauseBtn.addEventListener('click', togglePause);
    
    // Direction Buttons
    upBtn.addEventListener('click', () => changeDirection('up'));
    downBtn.addEventListener('click', () => changeDirection('down'));
    leftBtn.addEventListener('click', () => changeDirection('left'));
    rightBtn.addEventListener('click', () => changeDirection('right'));
    
    // Touch Controls
    let touchStartX = 0;
    let touchStartY = 0;
    
    gameGrid.addEventListener('touchstart', (e) => {
        if (!gameRunning || gamePaused) return;
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    gameGrid.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    gameGrid.addEventListener('touchend', (e) => {
        if (!gameRunning || gamePaused) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // Minimum swipe distance
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
        
        // Determine swipe direction
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 0) changeDirection('right');
            else changeDirection('left');
        } else {
            // Vertical swipe
            if (dy > 0) changeDirection('down');
            else changeDirection('up');
        }
        
        e.preventDefault();
    }, { passive: false });
}

// Initialize Game on Load
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    initEventListeners();
    
    // Initial animations
    gsap.from(".game-title", {
        y: -30,
        opacity: 0,
        duration: 1,
        ease: "bounce.out"
    });
    
    gsap.from(".game-board", {
        scale: 0,
        rotation: 180,
        duration: 1,
        delay: 0.3,
        ease: "back.out(1.7)"
    });
    
    gsap.from(".game-info", {
        x: 50,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: "power2.out"
    });
});

// Make sure game works on window resize
window.addEventListener('resize', () => {
    // Redraw game to ensure proper scaling
    if (gameRunning) {
        drawSnake();
        drawFood();
    }
});