// --- DEBUG MODE ---
const DEBUG = true; // trueにすると正解エリアや判定枠が赤く見えます

// === configs ===
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

// --- fonts ---
const FONT_FAMILIES = {
    MAIN: "HiraMinProN-W6, 'MS Mincho', serif",
    POP: "Arial Black"
};

// --- state ---
let currentStageIndex = 0;
let isStageCleared = false;
let isRevealed = false;
let loadedImages = {};

// === utility ===
// --- text drawer ---
function drawText(text, xRelative, yRelative, color, fontKey, fontSize) {
    const family = FONT_FAMILIES[fontKey] || "sans-serif";
    const scaledSize = fontSize * (canvas.height / 1080);

    ctx.font = `${scaledSize}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;

    const x = xRelative * canvas.width;
    const y = yRelative * canvas.height;

    ctx.fillText(text, x, y);

    // 自動ボックス定義のためのサイズ計測
    const metrics = ctx.measureText(text);
    return {
        w: metrics.width + 20, // 判定用に少しマージンを追加
        h: scaledSize
    };
}

// --- image loader ---
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
            // drawTextCustom を呼び出して描画し、サイズを取得
            const size = drawText(
                obj.content, 
                obj.x, 
                obj.y, 
                obj.color, 
                'MAIN', 
                obj.fontSize
            );
            // ターゲット判定用に計算されたサイズを保持 (手動設定があれば優先)
            obj.computedW = obj.w || size.w;
            obj.computedH = obj.h || size.h;
        } else if (obj.type === 'image') {
            const img = await loadImage(`${IMAGE_DIR}objects/${obj.name}.png`);
            if (img) {
                const drawX = (obj.x * canvas.width) - (obj.w / 2);
                const drawY = (obj.y * canvas.height) - (obj.h / 2);
                ctx.drawImage(img, drawX, drawY, obj.w, obj.h);
                obj.computedW = obj.w;
                obj.computedH = obj.h;
            }
        }
    }

    // デバッグ用の正解エリア可視化
    if (DEBUG) {
        stage.targets.forEach(t => {
            const parent = stage.objects.find(obj => obj.id === t.obj);
            if (!parent) return;

            const px = parent.x * canvas.width;
            const py = parent.y * canvas.height;
            const pw = parent.computedW || 0;
            const ph = parent.computedH || 0;
            const tx = px + (t.tx - 0.5) * pw;
            const ty = py + (t.ty - 0.5) * ph;

            ctx.strokeStyle = t.found ? "blue" : "red";
            if (t.shape === 'rect') {
                const tw = t.tw * pw;
                const th = t.th * ph;
                ctx.strokeRect(tx - tw/2, ty - th/2, tw, th);
            } else {
                const tr = t.tr * pw;
                ctx.beginPath();
                ctx.arc(tx, ty, tr, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }

    statusText.innerHTML = `Stage ${index + 1}`;
}

// === click event ===
canvas.addEventListener('mousedown', (e) => {
    if (isStageCleared && startLink.style.display === "block") return;
    placeSplatter(e.clientX, e.clientY);
});

async function placeSplatter(x, y, isAuto = false) {
    // playing click SE
    splatSound.cloneNode().play();

    // random select ink
    const randomNum = Math.floor(Math.random() * TOTAL_IMAGES);
    const imgPath = `${IMAGE_DIR}splatters/ink${String(randomNum).padStart(4, '0')}.png`;

    const img = new Image();
    img.src = imgPath;
    img.onload = () => {
        const drawSize = 250;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, x - drawSize/2, y - drawSize/2, drawSize, drawSize);

        if (isStageCleared) {
            const textSize =drawText("CLEAR", 0.5, 0.5, "#ffffff", 'POP', 120);
            checkTextReveal("CLEAR", textSize.w, textSize.h, nextStage);
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
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 250) coloredPixels++;
    }

    const ratio = coloredPixels / (checkWidth * checkHeight);

    if (DEBUG) {
        ctx.strokeStyle = "rgba(0, 255, 115, 0.3)";
        ctx.strokeRect(canvas.width/2 - checkWidth/2, canvas.height/2 - checkHeight/2, checkWidth, checkHeight);
    }

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

    stage.targets.forEach(t => {
        if (t.found) return;

        // 1. 親となるオブジェクトをIDで探す
        const parent = stage.objects.find(obj => obj.id === t.obj);
        if (!parent) return;

        // 2. 親オブジェクトの現在のピクセル座標とサイズ
        const px = parent.x * canvas.width;
        const py = parent.y * canvas.height;
        const pw = parent.computedW || 0;
        const ph = parent.computedH || 0;

        // 3. 親の範囲内でのターゲットの絶対座標を算出
        const tx = px + (t.tx - 0.5) * pw;
        const ty = py + (t.ty - 0.5) * ph;

        let isHit = false;

        if (t.shape === 'rect') {
            const tw = t.tw * pw;
            const th = t.th * ph;
            if (clickX >= tx - tw/2 && clickX <= tx + tw/2 &&
                clickY >= ty - th/2 && clickY <= ty + th/2) {
                isHit = true;
            }
        } else if (t.shape === 'circle') {
            const tr = t.tr * pw;
            const dist = Math.sqrt((clickX - tx)**2 + (clickY - ty)**2);
            if (dist < tr) isHit = true;
        }

        if (isHit) t.found = true;
    });

    if (stage.targets.every(t => t.found) && !isStageCleared) showClearEffect();
}

// --- clear effect ---
function showClearEffect() {
    // if (isStageCleared) return; // 二重発動防止
    isStageCleared = true;
    isRevealed = false;
    statusText.innerHTML = "<strong>CLEAR!!</strong>";

    // "CLEAR" の文字の概ねの位置（中央からのオフセット）に順番にインクを落とす
    const centers = [-240, -160, -80, 0, 80, 160, 240];
    centers.forEach((offsetX, i) => {
        const splattersPerLetter = 2;
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