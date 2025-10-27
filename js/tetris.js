const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d'); 
const nextCanvas = document.getElementById('next_piece');
const nextContext = nextCanvas.getContext('2d');
// Un tamaño de bloque más pequeño para el panel de "siguiente pieza"
const NEXT_BLOCK_SIZE = 25;

const ROWS = 16;
const COLS = 16;
const BLOCK_SIZE = 30;
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const COLORS = [
    // 'shap' corregido a 'shape'
    { color: 'cyan', shape: [[1, 1, 1, 1]] },   
    // Sintaxis de 'shape' corregida
    { color: 'blue', shape: [[1, 1], [1, 1]] }, 
    { color: 'orange', shape: [[1, 1, 1], [1, 0, 0]] },
    { color: 'yellow', shape: [[1, 1, 1], [0, 0, 1]] },
    { color: 'green', shape: [[1, 1, 0], [0, 1, 1]] },
    // Sintaxis de 'shape' corregida
    { color: 'purple', shape: [[0, 1, 1], [1, 1, 0]] }, 
    // Sintaxis de 'shape' corregida
    { color: 'red', shape: [[0, 1, 0], [1, 1, 1]] } 
];

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentPiece = getRandomPiece();
let currentPosition = { x: 3, y: 0 };
let score = 0;
let interval = 400;
let gameOver = false;
let speedIncreaseInterval = 10000; // Aumentar velocidad cada 10 segundos
let lastSpeedIncreaseTime = Date.now();

// Variable para el próximo loop (para pausar)
let gameLoopTimeout;

let nextPiece = getRandomPiece(); // Genera la primera "siguiente pieza"

function getRandomPiece() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}
function drawBlock(x, y, color) {
    context.fillStyle = color; 
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = 'white';
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height); 
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                drawBlock(c, r, board[r][c]);
            }
        }
    }
}



function drawPiece() {
    const shape = currentPiece.shape;
    const color = currentPiece.color;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
            
                drawBlock(currentPosition.x + c, currentPosition.y + r, color); 
            }
        }
    }
}

// --- AÑADE ESTA FUNCIÓN NUEVA ---
function drawNextPiece() {
    // 1. Limpiar el canvas de "siguiente pieza"
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    const { shape, color } = nextPiece;
    
    // 2. Calcular offsets para centrar la pieza
    const canvasWidth = nextCanvas.width;
    const canvasHeight = nextCanvas.height;
    // Usamos el tamaño de bloque pequeño
    const pieceWidth = shape[0].length * NEXT_BLOCK_SIZE; 
    const pieceHeight = shape.length * NEXT_BLOCK_SIZE;

    const startX = (canvasWidth - pieceWidth) / 2;
    const startY = (canvasHeight - pieceHeight) / 2;

    // 3. Dibujar la pieza
    shape.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value) {
                nextContext.fillStyle = color;
                nextContext.fillRect(startX + c * NEXT_BLOCK_SIZE, startY + r * NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);
                nextContext.strokeStyle = 'white';
                nextContext.strokeRect(startX + c * NEXT_BLOCK_SIZE, startY + r * NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);
            }
        });
    });
}
// --- FIN DE LA FUNCIÓN NUEVA ---

function hasCollision(xOffset, yOffset) {
    const shape = currentPiece.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            // Usamos 'x' e 'y' de currentPosition
            const newX = currentPosition.x + c + xOffset; 
            const newY = currentPosition.y + r + yOffset; 

            if (shape[r][c] && (
                newX < 0 || // Fuera por la izquierda
                newX >= COLS || // Fuera por la derecha
                newY >= ROWS || // Fuera por abajo
                (newY >= 0 && board[newY][newX]) // Choca con otra pieza
            )) {
                return true;
            }
        }
    }
    return false;
}


function mergePiece() {
    const shape = currentPiece.shape;
    const color = currentPiece.color;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                // Usamos 'x' e 'y' de currentPosition
                board[currentPosition.y + r][currentPosition.x + c] = color; 
            }
        }
    }
}
function removeRows() {
    let rowsRemoved = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell)) {
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(null));
            rowsRemoved++;
            r++; // Revisar la misma fila de nuevo 
        }
    }
    score += rowsRemoved * 10;
    document.getElementById('score_display').innerText = score;
}

function rotatePiece() {
    const shape = currentPiece.shape;
    const newShape = shape[0].map((_, index) => shape.map(row => row[index]).reverse());
    const originalShape = currentPiece.shape;
    currentPiece.shape = newShape;
    if (hasCollision(0, 0)) { // Si la rotación colisiona
        currentPiece.shape = originalShape; // Revertir
    }
}

function moveDown() {
    if (!hasCollision(0, 1)) {
        currentPosition.y++;
    } else {
        mergePiece();
        removeRows();
        currentPiece = nextPiece; // La siguiente pieza ahora es la actual
        nextPiece = getRandomPiece(); // Generamos una nueva "siguiente"
        drawNextPiece(); // Actualizamos el canvas de "siguiente pieza"

        currentPosition = { x: 7, y: 0 };
        if (hasCollision(0, 0)) {
            gameOver = true;
            document.getElementById('score_display').innerText = "Fin: " + score;
            alert('Game Over! Tu puntaje es: ' + score);
            // Mostrar botón de reinicio
            document.getElementById('restartButton').style.display = 'block'; 
        }
    }
}

// Esta función estaba huérfana, su lógica se movió al gameLoop
// function move(offsetc){ ... }

function gameLoop() {
    if (gameOver) return;

    // Lógica de velocidad 
    const now = Date.now();
    if (now - lastSpeedIncreaseTime >= speedIncreaseInterval) {
        interval = Math.max(100, interval - 20); // Aumentar velocidad
        lastSpeedIncreaseTime = now;
    }

    moveDown();
    drawBoard(); // Dibuja el tablero
    drawPiece(); // Dibuja la pieza encima

    gameLoopTimeout = setTimeout(gameLoop, interval); 
}

document.addEventListener('keydown', (event) => {
    if (gameOver) return;
    if (event.key === 'ArrowLeft') {
        if (!hasCollision(-1, 0)) {
            currentPosition.x--;
        }
    } else if (event.key === 'ArrowRight') {
        if (!hasCollision(1, 0)) {
            currentPosition.x++;
        }
    } else if (event.key === 'ArrowDown') {
        moveDown();
    } else if (event.key === 'ArrowUp') {
        rotatePiece();
    }
    drawBoard(); // Re-dibujar tablero
    drawPiece(); // Re-dibujar pieza inmediatamente después de mover
});

document.getElementById('restartButton').addEventListener('click', () => {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    currentPiece = getRandomPiece();
    currentPosition = { x: 3, y: 0 };
    score = 0;
    interval = 400;
    gameOver = false;
    lastSpeedIncreaseTime = Date.now();
    
    document.getElementById('restartButton').style.display = 'none'; 
    
    document.getElementById('score_display').textContent = score; 
    gameLoop();
});

// Iniciar el juego al cargar la página
gameLoop(); 
drawNextPiece();
// No hay llave extra