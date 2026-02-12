// ============================================================
// 1. CONSTANTS
// ============================================================
/* debug mode */
const DEBUG = true;
/* ink image */
const TOTAL_IMAGES = 1000; // number of ink.png
const IMAGE_DIR    = '../static/images/';
/* fonts */
const FONT_FAMILIES = {
    MAIN: "HiraMinProN-W6, 'MS Mincho', serif",
    POP: "Arial Black"
};

// ============================================================
// 2. STATE
// ============================================================
/* state */
let currentStageIndex = 0;
let isStageCleared    = false;
let isRevealed        = false;
let isTransitioning   = false;
let loadedImages      = {};
/* html objects */
const canvas          = document.getElementById('gameCanvas');
const ctx             = canvas.getContext('2d');
const startLink       = document.getElementById('startLink');
const statusText      = document.getElementById('status');
const stageOverlay    = document.getElementById('stage-overlay');
const stageNumberText = document.getElementById('stage-number-text');
/* sound effect */
const splatSound      = new Audio('../static/sounds/splat.mp3'); // loading sound file
splatSound.volume     = 0.5; // volume (0.0 ~ 1.0)

// ============================================================
// 3. UTILITIES
// ============================================================
/* text drawer */
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

    // adjusting textbox size
    const metrics = ctx.measureText(text);
    return {
        w: metrics.width + 20,
        h: scaledSize
    };
}

/* image loader */
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

// ============================================================
// 4. RENDERING
// ============================================================
async function renderStage(index) {
    const stage = STAGES_DATA[index];
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const obj of stage.objects) {
        if (obj.type === 'text') {
            const size = drawText(
                obj.content, 
                obj.x, 
                obj.y, 
                obj.color, 
                'MAIN', 
                obj.fontSize
            );
            obj.computedW = obj.w || size.w;
            obj.computedH = obj.h || size.h;
        } else if (obj.type === 'image') {
            const img = await loadImage(`${IMAGE_DIR}objects/${obj.content}.png`);
            if (img) {
                const drawX = (obj.x * canvas.width) - (obj.w / 2);
                const drawY = (obj.y * canvas.height) - (obj.h / 2);
                ctx.drawImage(img, drawX, drawY, obj.w, obj.h);
                obj.computedW = obj.w;
                obj.computedH = obj.h;
            }
        }
    }
    if (DEBUG) renderDebug(stage);
    statusText.innerHTML = `Stage ${index}`;
}

function renderDebug(stage) {
    stage.targets.forEach(t => {
        const parent = stage.objects.find(obj => obj.id === t.obj);
        if (!parent) return;

        const px = parent.x * canvas.width;
        const py = parent.y * canvas.height;
        const tx = px + (t.tx - 0.5) * (parent.computedW || 0);
        const ty = py + (t.ty - 0.5) * (parent.computedH || 0);

        ctx.strokeStyle = t.found ? "blue" : "red";
        if (t.shape === 'rect') {
            const tw = t.tw * parent.computedW;
            const th = t.th * parent.computedH;
            ctx.strokeRect(tx - tw/2, ty - th/2, tw, th);
        } else {
            const tr = t.tr * parent.computedW;
            ctx.beginPath();
            ctx.arc(tx, ty, tr, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

// ============================================================
// 5. GAME LOGIC
// ============================================================

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
            const textSize = drawText("CLEAR", 0.5, 0.5, "#ffffff", 'POP', 170);
            checkTextReveal("CLEAR", textSize.w, textSize.h, nextStage);
        } else {
            // judge clear
            if (!isAuto) checkStageHit(x, y);
        }
    };
}

/* judge hit on the playing screen */
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

/* clear effect */
function showClearEffect() {
    isStageCleared = true;
    isRevealed = false;

    const centers = [-240, -160, -80, 0, 80, 160, 240];
    centers.forEach((offsetX, i) => {
        for (let j = 0; j < 2; j++) {
            setTimeout(() => {
                // 横位置：文字の中心から少し左右に散らす
                const rx = canvas.width / 2 + offsetX + (Math.random() - 0.5) * 60;
                // 縦位置：中央（canvas.height/2）から上下に少し散らす
                const ry = canvas.height / 2 + (Math.random() - 0.5) * 70;
                placeSplatter(rx, ry, true);
            }, i * 50 + (j * 25)); // 文字ごとの間隔(150) + 1文字内の時間差(50)
        }
    });
}

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

    if (ratio > 0.55 && !isRevealed) {
        isRevealed = true;
        startLink.innerHTML = text;
        startLink.style.display = "block";
        startLink.onclick = callback;
    }
}

// ============================================================
// 6. FLOW CONTROL
// ============================================================
async function playStageTransition(stageNumber) {
    isTransitioning = true;
    // 1. オーバーレイを表示状態にする
    stageOverlay.classList.remove('none');
    stageOverlay.classList.remove('hidden');
    stageNumberText.innerText = `STAGE ${stageNumber}`;

    // DOMの描画を待ってからアニメーションクラスを付与
    // setTimeout(() => stageOverlay.classList.add('active'), 10);

    // 2. 演出の裏で次のステージを準備
    await renderStage(currentStageIndex);

    // 3. 1秒待機してからフェードアウト開始
    setTimeout(() => {
        stageOverlay.classList.add('hidden');
        // 4. フェード完了後に操作解禁
        setTimeout(() => {
            stageOverlay.classList.add('none');
            isTransitioning = false; // 操作解禁
        }, 800); // CSSのtransition秒数と合わせる
    }, 1000);
}

/* 全ステージクリア画面の描画 */
async function renderAllClearScreen() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // メッセージの描画
    drawText("🎉 ALL CLEAR! 🎉", 0.5, 0.4, "#FFD700", 'POP', 100);
    drawText("遊んでくれてありがとう！", 0.5, 0.6, "#333", 'MAIN', 30);

    statusText.innerHTML = "<strong>Perfect! 全てのステージをクリアしました！</strong>";
}

function nextStage() {
    currentStageIndex++;
    if (currentStageIndex < STAGES_DATA.length) {
        isStageCleared = false;
        isRevealed = false;
        startLink.style.display = "none";
        playStageTransition(currentStageIndex);
    } else {
        isStageCleared = true;
        startLink.style.display = "none";
        renderAllClearScreen();
    }
}

function resetGame() {
    STAGES_DATA[currentStageIndex].targets.forEach(t => t.found = false);
    isRevealed = false;
    isStageCleared = false;
    isTransitioning = false;
    startLink.style.display = "none";
    renderStage(currentStageIndex);
}

// ============================================================
// 7. INITIALIZATION & EVENT LISTENER
// ============================================================
canvas.addEventListener('mousedown', (e) => {
    if (isTransitioning) return;
    if (isStageCleared && startLink.style.display === "block") return;
    placeSplatter(e.clientX, e.clientY);
});

window.addEventListener('resize', async () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    await renderStage(currentStageIndex);
});

window.dispatchEvent(new Event('resize'));