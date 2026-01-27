// --- DEBUG MODE ---
const DEBUG = true; // trueにすると正解エリアや判定枠が赤く見えます

// === settings ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startLink = document.getElementById('startLink');
const statusText = document.getElementById('status');
// --- sound effect ---
const splatSound = new Audio('../static/sounds/splat.mp3'); // loading sound file
splatSound.volume = 0.5; // volume (0.0 ~ 1.0)

// --- ink image ---
const TOTAL_IMAGES = 1000; // number of ink.png
const IMAGE_DIR = '../static/images/';

// --- state ---
let currentStageIndex = 0;
let isStageCleared = false;
let isRevealed = false;
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
        img.onerror = () => resolve(null);
    });
}

async function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    await renderStage(currentStageIndex);
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
            const img = await loadImage(`${IMAGE_DIR}objects/${obj.name}.png`);
            if (img) {
                const drawX = (obj.x * canvas.width) - (obj.w / 2);
                const drawY = (obj.y * canvas.height) - (obj.h / 2);
                ctx.drawImage(img, drawX, drawY, obj.w, obj.h);
            }
        }
    }

    // デバッグ用の正解エリア可視化
    if (DEBUG) {
        stage.targets.forEach(target => {
            ctx.beginPath();
            ctx.arc(target.x * canvas.width, target.y * canvas.height, target.r, 0, Math.PI * 2);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.fill();
        });
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

async function placeSplatter(x, y, isAuto = false) {
    // playing click SE
    splatSound.cloneNode().play();

    // random select ink
    const randomNum = Math.floor(Math.random() * TOTAL_IMAGES);
    const formattedNum = String(randomNum).padStart(4, '0');
    const imgPath = `${IMAGE_DIR}splatters/ink${formattedNum}.png`;

    const img = new Image();
    img.src = imgPath;
    img.onload = () => {
        const drawSize = 250;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, x - drawSize/2, y - drawSize/2, drawSize, drawSize);

        if (isStageCleared) {
            drawTextCentered("CLEAR", "#ffffff");
            checkTextReveal("CLEAR", 500, 120, nextStage);
        } else {
            // judge clear
            if (!isAuto) checkStageHit(x, y);
        }
    };
}

// --- judge appearing text ---
function checkTextReveal(text, checkWidth, checkHeight, callback) {
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

    if (DEBUG) {
        ctx.strokeStyle = "rgba(0, 255, 115, 0.3)";
        ctx.strokeRect(canvas.width/2 - checkWidth/2, canvas.height/2 - checkHeight/2, checkWidth, checkHeight);
    }

    // 判定感度は 0.5〜0.7 くらいが遊びやすいです
    if (ratio > 0.6 && !isRevealed) {
        isRevealed = true;
        startLink.innerHTML = text;
        startLink.style.display = "block";
        startLink.onclick = callback;
    }
}

// --- judge hit on the playing screen ---
function checkStageHit(clickX, clickY) {
    const stage = STAGES_DATA[currentStageIndex];
    let foundCount = 0;

    stage.targets.forEach(target => {
        const tx = target.x * canvas.width;
        const ty = target.y * canvas.height;
        const dist = Math.sqrt((clickX - tx)**2 + (clickY - ty)**2);
        if (dist < target.r) target.found = true;
        if (target.found) foundCount++;
    });

    if (foundCount === stage.targets.length && !isStageCleared) {
        showClearEffect();
    }
}

// --- clear effect ---
function showClearEffect() {
    // if (isStageCleared) return; // 二重発動防止
    isStageCleared = true;
    isRevealed = false; // CLEAR文字の出現判定用にリセット
    statusText.innerHTML = "<strong>CLEAR!!</strong>";

    // "CLEAR" の文字の概ねの位置（中央からのオフセット）に順番にインクを落とす
    const centers = [-240, -160, -80, 0, 80, 160, 240];
    centers.forEach((offsetX, i) => {
        // 1文字のエリアに対して複数回のインク生成を行う
        const splattersPerLetter = 2; // ここを3に増やすとさらに派手になります
        for (let j = 0; j < splattersPerLetter; j++) {
            setTimeout(() => {
                // 横位置：文字の中心から少し左右に散らす
                const rx = canvas.width / 2 + offsetX + (Math.random() - 0.5) * 60;
                // 縦位置：中央（canvas.height/2）から上下に少し散らす
                const ry = canvas.height / 2 + (Math.random() - 0.5) * 70;
                placeSplatter(rx, ry, true);
            }, i * 50 + (j * 50/splattersPerLetter)); // 文字ごとの間隔(150) + 1文字内の時間差(50)
        }
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
    STAGES_DATA[currentStageIndex].targets.forEach(t => t.found = false);
    isRevealed = false;
    isStageCleared = false;
    startLink.style.display = "none";
    drawStartScreen();
}

window.addEventListener('resize', resize);
resize();   // 初回起動