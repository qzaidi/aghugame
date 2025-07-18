// Game variables
let score = 0;
let missed = 0;
let gameRunning = false;
let gameSpeed = 3000; // Initial speed for spawning items (milliseconds) - slower start
let spawnInterval;
let gameItems = [];
let basketPosition = 50; // Percentage from left
let fruitSpawnCount = 1; // Number of fruits to spawn at once - increases over time

// User variables
let currentUser = null;
let playerName = "Guest";
let isAuthenticated = false;

// DOM Elements
const gameArea = document.getElementById('game-area');
const basket = document.getElementById('basket');
const scoreDisplay = document.getElementById('score');
const missedDisplay = document.getElementById('missed');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const gameOverReason = document.getElementById('game-over-reason');

// Login elements
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const highScoresScreen = document.getElementById('high-scores-screen');
const playerNameInput = document.getElementById('player-name');
const loginButton = document.getElementById('login-button');
const loginError = document.getElementById('login-error');
const playerDisplay = document.getElementById('player-display');
const viewHighScoresButton = document.getElementById('view-high-scores');
const backToGameButton = document.getElementById('back-to-game-button');
const highScoresList = document.getElementById('high-scores-list');
const newHighScoreDisplay = document.getElementById('new-high-score');
const viewLeaderboardButton = document.getElementById('view-leaderboard-button');

// Sound effect for catching fruit
const catchSound = new Audio('catch-sound.m4a');

// Fruit types and their point values
const fruitTypes = [
    { type: 'apple', points: 10, probability: 0.3 },
    { type: 'banana', points: 15, probability: 0.25 },
    { type: 'orange', points: 20, probability: 0.2 },
    { type: 'strawberry', points: 25, probability: 0.15 }
];

// Bomb probability (increases with score)
let bombProbability = 0.1;

// Initialize Firebase when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    if (window.firebaseHelper) {
        window.firebaseHelper.initializeFirebase();
    } else {
        console.error('Firebase helper not loaded');
    }
});

// Event Listeners for game controls
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// Event listeners for login and high scores
loginButton.addEventListener('click', handleLogin);
viewHighScoresButton.addEventListener('click', showHighScores);
backToGameButton.addEventListener('click', showGameScreen);
viewLeaderboardButton.addEventListener('click', showHighScores);

// Mouse movement for basket control
gameArea.addEventListener('mousemove', moveBasket);

// Touch movement for mobile devices
gameArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const gameAreaRect = gameArea.getBoundingClientRect();
    const touchX = touch.clientX - gameAreaRect.left;
    const percentage = (touchX / gameAreaRect.width) * 100;
    moveBasketToPosition(percentage);
});

// Login functions
async function handleLogin() {
    playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        loginError.classList.remove('hidden');
        return;
    }
    
    loginError.classList.add('hidden');
    
    try {
        // Create user with the provided name
        if (window.firebaseHelper) {
            currentUser = await window.firebaseHelper.createUserWithNameAndPlay(playerName);
            isAuthenticated = !!currentUser;
            
            if (isAuthenticated) {
                console.log('User authenticated:', currentUser.uid);
            } else {
                console.warn('Failed to authenticate user, continuing as guest');
            }
        } else {
            console.warn('Firebase helper not available, continuing as guest');
        }
        
        // Update player display
        playerDisplay.textContent = playerName;
        
        // Show game screen
        showGameScreen();
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Error logging in. Please try again.';
        loginError.classList.remove('hidden');
    }
}

// Screen management functions
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    highScoresScreen.classList.add('hidden');
}

function showGameScreen() {
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    highScoresScreen.classList.add('hidden');
}

async function showHighScores() {
    loginScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    highScoresScreen.classList.remove('hidden');
    
    // Clear previous high scores
    highScoresList.innerHTML = '';
    
    try {
        // Get high scores from Firebase
        if (window.firebaseHelper) {
            const highScores = await window.firebaseHelper.getTopHighScores(10);
            
            if (highScores.length === 0) {
                highScoresList.innerHTML = '<p>No high scores yet. Be the first!</p>';
                return;
            }
            
            // Display high scores
            highScores.forEach((score, index) => {
                const scoreEntry = document.createElement('div');
                scoreEntry.className = 'high-score-entry';
                
                const rankElement = document.createElement('div');
                rankElement.className = 'high-score-rank';
                rankElement.textContent = `${index + 1}.`;
                
                const nameElement = document.createElement('div');
                nameElement.className = 'high-score-name';
                nameElement.textContent = score.userName;
                
                const scoreElement = document.createElement('div');
                scoreElement.className = 'high-score-score';
                scoreElement.textContent = score.score;
                
                scoreEntry.appendChild(rankElement);
                scoreEntry.appendChild(nameElement);
                scoreEntry.appendChild(scoreElement);
                
                highScoresList.appendChild(scoreEntry);
            });
        } else {
            highScoresList.innerHTML = '<p>High scores unavailable. Firebase not initialized.</p>';
        }
    } catch (error) {
        console.error('Error fetching high scores:', error);
        highScoresList.innerHTML = '<p>Error loading high scores. Please try again later.</p>';
    }
}

// Create placeholder images for preloading
function preloadImages() {
    const images = ['apple.png', 'banana.png', 'orange.png', 'strawberry.png', 'bomb.png', 'basket.png'];
    
    // Create SVG placeholders since we can't use actual images
    createSVGPlaceholder('basket');
    createSVGPlaceholder('apple');
    createSVGPlaceholder('banana');
    createSVGPlaceholder('orange');
    createSVGPlaceholder('strawberry');
    createSVGPlaceholder('bomb');
}

// Create SVG placeholders for the game assets
function createSVGPlaceholder(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('viewBox', '0 0 40 40');
    
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let color = '#FF0000';
    let d = '';
    
    switch(type) {
        case 'apple':
            color = '#FF0000';
            d = 'M20,5 C25,5 30,10 30,15 C30,20 25,30 20,35 C15,30 10,20 10,15 C10,10 15,5 20,5 Z';
            break;
        case 'banana':
            color = '#FFD700';
            d = 'M10,10 C15,5 25,10 30,20 C25,25 15,30 10,25 C5,20 5,15 10,10 Z';
            break;
        case 'orange':
            color = '#FFA500';
            d = 'M20,5 C30,5 35,15 35,20 C35,30 25,35 20,35 C10,35 5,30 5,20 C5,15 10,5 20,5 Z';
            break;
        case 'strawberry':
            color = '#FF69B4';
            d = 'M20,5 C25,5 30,10 30,15 C30,25 20,35 20,35 C20,35 10,25 10,15 C10,10 15,5 20,5 Z';
            break;
        case 'bomb':
            color = '#000000';
            d = 'M20,5 C30,5 35,15 35,25 C35,30 30,35 20,35 C10,35 5,30 5,25 C5,15 10,5 20,5 Z';
            break;
        case 'basket':
            // We'll create a more complex SVG for the Indian kid
            // This is just a placeholder path that will be replaced with multiple elements
            color = '#8B4513';
            d = '';
            break;
    }
    
    path.setAttribute('d', d);
    path.setAttribute('fill', color);
    svg.appendChild(path);
    
    // Add stem for fruits
    if (['apple', 'strawberry'].includes(type)) {
        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        stem.setAttribute('d', 'M20,5 C20,5 18,0 22,0 C25,0 23,5 23,5');
        stem.setAttribute('fill', '#008000');
        svg.appendChild(stem);
    }
    
    // Add fuse for bomb
    if (type === 'bomb') {
        const fuse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fuse.setAttribute('d', 'M20,5 C20,5 25,0 30,0');
        fuse.setAttribute('stroke', '#FFA500');
        fuse.setAttribute('stroke-width', '2');
        fuse.setAttribute('fill', 'none');
        svg.appendChild(fuse);
    }
    
    // Create 4-year-old Indian kid with black hair, blue shirt and shorts, holding a basket
    if (type === 'basket') {
        // Adjust viewBox for better proportions
        svg.setAttribute('viewBox', '0 0 40 60');
        svg.setAttribute('height', '60');
        
        // Head - brown skin tone
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('cx', '20');
        head.setAttribute('cy', '15');
        head.setAttribute('r', '10');
        head.setAttribute('fill', '#CD9B7A'); // Indian skin tone
        svg.appendChild(head);
        
        // Black hair
        const hair = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hair.setAttribute('d', 'M10,15 C10,5 30,5 30,15 C30,10 25,5 20,5 C15,5 10,10 10,15 Z');
        hair.setAttribute('fill', '#000000'); // Black hair
        svg.appendChild(hair);
        
        // Face features
        // Eyes
        const leftEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leftEye.setAttribute('cx', '16');
        leftEye.setAttribute('cy', '13');
        leftEye.setAttribute('r', '1.5');
        leftEye.setAttribute('fill', '#000000');
        svg.appendChild(leftEye);
        
        const rightEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rightEye.setAttribute('cx', '24');
        rightEye.setAttribute('cy', '13');
        rightEye.setAttribute('r', '1.5');
        rightEye.setAttribute('fill', '#000000');
        svg.appendChild(rightEye);
        
        // Smile
        const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        smile.setAttribute('d', 'M16,18 C18,20 22,20 24,18');
        smile.setAttribute('stroke', '#000000');
        smile.setAttribute('stroke-width', '1');
        smile.setAttribute('fill', 'none');
        svg.appendChild(smile);
        
        // Blue shirt
        const shirt = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        shirt.setAttribute('d', 'M10,25 L30,25 L28,40 L12,40 Z');
        shirt.setAttribute('fill', '#1E90FF'); // Blue color
        svg.appendChild(shirt);
        
        // Left arm (holding basket)
        const leftArm = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        leftArm.setAttribute('d', 'M10,25 L5,32 L8,34 L12,30 Z');
        leftArm.setAttribute('fill', '#CD9B7A'); // Skin tone
        svg.appendChild(leftArm);
        
        // Basket (held in left hand)
        const basket = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        basket.setAttribute('d', 'M0,32 L10,32 L8,42 L2,42 Z');
        basket.setAttribute('fill', '#8B4513'); // Brown basket
        svg.appendChild(basket);
        
        // Basket handle
        const basketHandle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        basketHandle.setAttribute('d', 'M2,32 C2,28 8,28 8,32');
        basketHandle.setAttribute('stroke', '#8B4513');
        basketHandle.setAttribute('stroke-width', '1');
        basketHandle.setAttribute('fill', 'none');
        svg.appendChild(basketHandle);
        
        // Right arm
        const rightArm = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        rightArm.setAttribute('d', 'M30,25 L35,35 L32,37 L28,30 Z');
        rightArm.setAttribute('fill', '#CD9B7A'); // Skin tone
        svg.appendChild(rightArm);
        
        // Shorts
        const shorts = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        shorts.setAttribute('d', 'M12,40 L28,40 L30,50 L25,50 L20,45 L15,50 L10,50 Z');
        shorts.setAttribute('fill', '#4169E1'); // Darker blue for shorts
        svg.appendChild(shorts);
        
        // Legs
        const leftLeg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftLeg.setAttribute('x', '15');
        leftLeg.setAttribute('y', '50');
        leftLeg.setAttribute('width', '4');
        leftLeg.setAttribute('height', '8');
        leftLeg.setAttribute('fill', '#CD9B7A'); // Skin tone
        svg.appendChild(leftLeg);
        
        const rightLeg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightLeg.setAttribute('x', '22');
        rightLeg.setAttribute('y', '50');
        rightLeg.setAttribute('width', '4');
        rightLeg.setAttribute('height', '8');
        rightLeg.setAttribute('fill', '#CD9B7A'); // Skin tone
        svg.appendChild(rightLeg);
    }
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgURL = 'data:image/svg+xml;base64,' + btoa(svgData);
    
    // Create a style rule for this type
    const style = document.createElement('style');
    style.textContent = `.${type} { background-image: url('${svgURL}'); }`;
    document.head.appendChild(style);
    
    // If it's the basket, update the basket element directly
    if (type === 'basket') {
        basket.style.backgroundImage = `url('${svgURL}')`;
    }
}

// Start the game
function startGame() {
    if (gameRunning) return;
    
    // Preload images (SVG placeholders)
    preloadImages();
    
    // Reset game state
    score = 0;
    missed = 0;
    gameSpeed = 3000; // Slower initial spawn rate
    bombProbability = 0.1;
    fruitSpawnCount = 1; // Start with spawning 1 fruit at a time
    gameItems = [];
    
    // Update displays
    scoreDisplay.textContent = score;
    missedDisplay.textContent = missed;
    
    // Hide/show buttons
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
    gameOverScreen.classList.add('hidden');
    
    // Start spawning items
    gameRunning = true;
    spawnInterval = setInterval(spawnItem, gameSpeed);
    
    // Increase game difficulty over time
    setTimeout(increaseDifficulty, 10000); // First difficulty increase after 10 seconds
}

// Restart the game
function restartGame() {
    // Clear any remaining items
    gameItems.forEach(item => {
        if (item.element && item.element.parentNode) {
            item.element.parentNode.removeChild(item.element);
        }
    });
    
    startGame();
}

// Increase game difficulty over time
function increaseDifficulty() {
    if (!gameRunning) return;
    
    // Increase speed by reducing spawn interval, but more gradually
    gameSpeed = Math.max(1500, gameSpeed - 100);
    clearInterval(spawnInterval);
    spawnInterval = setInterval(spawnItem, gameSpeed);
    
    // Increase the number of fruits spawned at once based on score
    if (score > 100 && fruitSpawnCount < 2) {
        fruitSpawnCount = 2;
    } else if (score > 300 && fruitSpawnCount < 3) {
        fruitSpawnCount = 3;
    } else if (score > 600 && fruitSpawnCount < 4) {
        fruitSpawnCount = 4;
    }
    
    // Increase bomb probability with score, but more gradually
    bombProbability = Math.min(0.25, 0.1 + (score / 800) * 0.15);
    
    // Schedule next difficulty increase
    setTimeout(increaseDifficulty, 10000); // Every 10 seconds
}

// Spawn new items (fruits or bombs)
function spawnItem() {
    if (!gameRunning) return;
    
    // Spawn multiple items based on fruitSpawnCount
    for (let i = 0; i < fruitSpawnCount; i++) {
        // Add a small delay between spawns to prevent items from appearing all at once
        setTimeout(() => {
            if (!gameRunning) return;
            
            // Decide if it's a bomb or fruit
            const isBomb = Math.random() < bombProbability;
            
            // Create the item element
            const item = document.createElement('div');
            item.classList.add(isBomb ? 'bomb' : 'fruit');
            
            // If it's a fruit, choose which type
            let points = 0;
            if (!isBomb) {
                // Determine fruit type based on probability
                let random = Math.random();
                let cumulativeProbability = 0;
                
                for (const fruit of fruitTypes) {
                    cumulativeProbability += fruit.probability;
                    if (random <= cumulativeProbability) {
                        item.classList.add(fruit.type);
                        points = fruit.points;
                        break;
                    }
                }
            }
            
            // Position the item randomly along the top
            const randomPosition = Math.random() * 90 + 5; // 5% to 95% from left
            item.style.left = `${randomPosition}%`;
            item.style.top = '0';
            
            // Add to game area
            gameArea.appendChild(item);
            
            // Add to game items array with slower initial speed
            const gameItem = {
                element: item,
                position: { x: randomPosition, y: 0 },
                isBomb: isBomb,
                points: points,
                speed: 0.5 + Math.random() * 1 + (score / 1000) // Slower initial speed that gradually increases with score
            };
            
            gameItems.push(gameItem);
            
            // Start animation
            requestAnimationFrame(updateGame);
        }, i * 200); // Stagger the spawns by 200ms
    }

}

// Update game state (move items, check collisions)
function updateGame() {
    if (!gameRunning) return;
    
    const gameAreaHeight = gameArea.clientHeight;
    const basketRect = basket.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // Move each item and check for collisions
    for (let i = gameItems.length - 1; i >= 0; i--) {
        const item = gameItems[i];
        
        // Move item down
        item.position.y += item.speed;
        item.element.style.top = `${item.position.y}%`;
        
        // Get item position relative to game area
        const itemRect = item.element.getBoundingClientRect();
        
        // Check if item is caught (collision with basket)
        if (isColliding(basketRect, itemRect)) {
            // Remove item
            gameArea.removeChild(item.element);
            gameItems.splice(i, 1);
            
            if (item.isBomb) {
                // Game over if bomb is caught
                endGame('You caught a bomb!');
            } else {
                // Add points for caught fruit
                score += item.points;
                scoreDisplay.textContent = score;
                
                // Play catch sound
                catchSound.currentTime = 0; // Reset sound to beginning
                catchSound.play().catch(error => {
                    console.log('Error playing sound:', error);
                    // Continue game even if sound fails to play
                });
            }
            continue;
        }
        
        // Check if item is missed (below game area)
        if (item.position.y > 100) {
            // Remove item
            gameArea.removeChild(item.element);
            gameItems.splice(i, 1);
            
            if (!item.isBomb) {
                // Increase missed count for missed fruit
                missed++;
                missedDisplay.textContent = missed;
                
                // Check if too many fruits are missed
                if (missed >= 5) {
                    endGame('You missed too many fruits!');
                }
            }
        }
    }
    
    // Continue animation if game is still running
    if (gameRunning) {
        requestAnimationFrame(updateGame);
    }
}

// Check collision between two rectangles
function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

// Move basket based on mouse position
function moveBasket(e) {
    const gameAreaRect = gameArea.getBoundingClientRect();
    const mouseX = e.clientX - gameAreaRect.left;
    const percentage = (mouseX / gameAreaRect.width) * 100;
    moveBasketToPosition(percentage);
}

// Move basket to a specific position
function moveBasketToPosition(percentage) {
    // Limit basket position to stay within game area
    basketPosition = Math.max(10, Math.min(90, percentage));
    basket.style.left = `${basketPosition}%`;
}

// End the game
async function endGame(reason) {
    gameRunning = false;
    clearInterval(spawnInterval);
    
    // Show game over screen
    finalScoreDisplay.textContent = `Your score: ${score}`;
    gameOverReason.textContent = reason;
    
    // Save high score if user is authenticated
    let isNewHighScore = false;
    if (isAuthenticated && currentUser && window.firebaseHelper) {
        try {
            await window.firebaseHelper.saveHighScore(currentUser.uid, playerName, score);
            
            // Check if this is a new high score by getting the top scores
            const highScores = await window.firebaseHelper.getTopHighScores(10);
            
            // If the score is in the top 10, consider it a new high score
            isNewHighScore = highScores.some(entry => 
                entry.userId === currentUser.uid && 
                entry.score === score && 
                // Check if the timestamp is recent (within the last minute)
                entry.timestamp > (Date.now() - 60000)
            );
            
            if (isNewHighScore) {
                newHighScoreDisplay.classList.remove('hidden');
            } else {
                newHighScoreDisplay.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error saving high score:', error);
            newHighScoreDisplay.classList.add('hidden');
        }
    } else {
        newHighScoreDisplay.classList.add('hidden');
    }
    
    gameOverScreen.classList.remove('hidden');
    
    // Show restart button
    restartButton.style.display = 'block';
}

// Initialize the game
window.addEventListener('load', () => {
    // Set initial basket position
    basket.style.left = `${basketPosition}%`;
    
    // Preload images
    preloadImages();
    
    // Show login screen by default
    showLoginScreen();
});