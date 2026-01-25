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

// --- utility ---
function drawTextCentered(text, color, fontSize = "120px") {
    ctx.font = `bold ${fontSize} Arial Black`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// === image loader ===
function loadImage(src) {
    return new Promise((resolve) => {
        if (loadedImages[src]) {
            resolve(loadedImages[src]);
            return;
        }
        const img = new Image();
        img.src = src;
        img.onload = () => {
            loadedImages[src] = img;
            resolve(img);
        };
    });
}

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
    drawTextCentered("START", "#ffffff");
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
    // ステージクリア後、リンクが出るまではインクを置ける
    if (isStageCleared && startLink.style.display === "block") return;
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
            drawTextCentered("START", "#ffffff");
            checkTextReveal("START", startGame);
        } else if (isStageCleared) {
            drawTextCentered("CLEAR", "#ffffff");
            checkTextReveal("CLEAR", nextStage);
        } else {
            // judge clear
            checkStageHit(x, y);
        }
    };
}

// --- judge appearing text ---
function checkTextReveal(text, callback) {
    const checkWidth = 450; // STARTの文字幅に合わせて調整
    const checkHeight = 110;
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
        startLink.innerHTML = text;
        startLink.style.display = "block";
        startLink.onclick = callback;
    }
}

// ---- game start ---
function startGame() {
    gameState = 'PLAYING';
    isRevealed = false;
    isStageCleared = false;
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
        showClearEffect();
    }
}

// --- clear effect ---
async function showClearEffect() {
    if (isStageCleared) return; // 二重発動防止
    isStageCleared = true;
    isRevealed = false; // CLEAR文字の出現判定用にリセット
    statusText.innerHTML = "<strong>CLEAR!! インクを塗って次へ！</strong>";

    // "CLEAR" の文字の概ねの位置（中央からのオフセット）に順番にインクを落とす
    // 文字幅を約500pxと想定した5文字分の相対位置
    const centers = [-200, -100, 0, 100, 200];
    centers.forEach((offsetX, i) => {
        setTimeout(() => {
            const rx = canvas.width / 2 + offsetX + (Math.random() - 0.5) * 40;
            const ry = canvas.height / 2 + (Math.random() - 0.5) * 40;
            placeSplatter(rx, ry);
        }, i * 200); // 0.25秒間隔で一文字ずつ
    });
}

// --- transitioning stages ---
function nextStage() {
    currentStageIndex++;
    if (currentStageIndex < STAGES_DATA.length) {
        isStageCleared = false;
        isRevealed = false;
        startLink.style.display = "none";
        renderStage(currentStageIndex);
    } else {
        statusText.innerHTML = "All Clear!";
        startLink.style.display = "none";
        // 全クリア後の演出が必要ならここに追加
    }
}

// --- reset ---
function resetGame() {
    isRevealed = false;
    isStageCleared = false;
    gameState = 'START';
    startLink.style.display = "none";
    drawStartScreen();
}

window.addEventListener('resize', resize);
resize();   // 初回起動