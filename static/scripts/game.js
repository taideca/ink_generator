// === settings ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startLink = document.getElementById('startLink');
const statusText = document.getElementById('status');
// --- sound effect ---
const splatSound = new Audio('../static/sounds/splat.mp3'); // loading sound file
splatSound.volume = 0.5; // volume (0.0 ~ 1.0)

let isRevealed = false;

// --- ink image ---
const TOTAL_IMAGES = 1000; // number of ink.png
const IMAGE_DIR = '../static/images/splatters/';
const OBJ_IMG_DIR = '../static/images/objects/';

// --- state ---
let gameState = 'START'; // 'START' or 'PLAYING'
let currentStageIndex = 0;
let isStageCleared = false;
let loadedImages = {};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gameState === 'START') {
        drawStartScreen();
    } else {
        renderStage(currentStageIndex);
    }
}

// === start screen ===
function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";  // background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 120px Arial Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("START", canvas.width / 2, canvas.height / 2);
}

// === game screen ===
async function renderStage(index) {
    const stage = STAGES_DATA[index];
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const obj of stage.objects) {
        if (obj.type === 'text') {
            ctx.font = obj.font;
            ctx.fillStyle = obj.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(obj.content, obj.x * canvas.width, obj.y * canvas.height);
        } else if (obj.type === 'image') {
            const img = await loadImage(`${OBJ_IMG_DIR}${obj.name}.png`);
            const drawX = (obj.x * canvas.width) - (obj.w / 2);
            const drawY = (obj.y * canvas.height) - (obj.h / 2);
            ctx.drawImage(img, drawX, drawY, obj.w, obj.h);
        }
    }
    statusText.innerHTML = `Stage ${index + 1}: ${stage.hint}`;
}

// === click event ===
canvas.addEventListener('mousedown', (e) => {
    // Reveal後もインクを置けるようにするか、止めるかはお好みで
    // if (isRevealed) return;
    if (isStageCleared && gameState === 'PLAYING') return;
    placeSplatter(e.clientX, e.clientY);
});

async function placeSplatter(x, y) {
    // playing click SE
    splatSound.cloneNode().play();

    // random select ink
    const randomNum = Math.floor(Math.random() * TOTAL_IMAGES);
    const formattedNum = String(randomNum).padStart(4, '0');
    const imgPath = `${IMAGE_DIR}ink${formattedNum}.png`;

    const img = new Image();
    img.src = imgPath;
    img.onload = () => {
        const drawSize = 250;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, x - drawSize/2, y - drawSize/2, drawSize, drawSize);

        if (gameState === 'START') {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 120px Arial Black";
            ctx.fillText("START", canvas.width / 2, canvas.height / 2);
            checkStartReveal();
        } else {
            // judge clear
            checkStageHit(x, y);
        }
    };
}

// --- judge in start screen ---
function checkStartReveal() {
    const checkWidth = 450; // STARTの文字幅に合わせて調整
    const checkHeight = 150;
    const imageData = ctx.getImageData(
        canvas.width / 2 - checkWidth / 2, 
        canvas.height / 2 - checkHeight / 2, 
        checkWidth, checkHeight
    );
    const pixels = imageData.data;
    let coloredPixels = 0;
    // 白(255, 255, 255)以外のピクセル（＝インクが乗った場所）をカウント
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 250) coloredPixels++;
    }

    const ratio = coloredPixels / (checkWidth * checkHeight);
    // 判定感度は 0.5〜0.7 くらいが遊びやすいです
    if (ratio > 0.6 && !isRevealed) {
        isRevealed = true;
        startLink.innerHTML = "START";
        startLink.style.display = "block";
        startLink.onclick = startGame;
    }
}

// ---- game start ---
function startGame() {
    gameState = 'PLAYING';
    startLink.style.display = "none";
    currentStageIndex = 0;
    renderStage(currentStageIndex);
}

// --- judge hit on the playing screen ---
function checkStageHit(clickX, clickY) {
    const stage = STAGES_DATA[currentStageIndex];
    let allFound = true;

    stage.targets.forEach(target => {
        const tx = target.x * canvas.width;
        const ty = target.y * canvas.height;
        const dist = Math.sqrt((clickX - tx)**2 + (clickY - ty)**2);
        if (dist < target.r) target.found = true;
        if (!target.found) allFound = false;
    });

    if (allFound) {
        isStageCleared = true;
        startLink.innerHTML = "NEXT CLEAR →";
        startLink.style.display = "block";
        startLink.onclick = nextStage;
    }
}

// --- transitioning stages ---
function nextStage() {
    currentStageIndex++;
    if (currentStageIndex < STAGES_DATA.length) {
        isStageCleared = false;
        startLink.style.display = "none";
        renderStage(currentStageIndex);
    } else {
        statusText.innerHTML = "All Clear!";
        startLink.style.display = "none";
    }
}

// --- reset ---
function resetGame() {
    isRevealed = false;
    startLink.style.display = "none";
    drawStartScreen();
}

window.addEventListener('resize', resize);
resize();