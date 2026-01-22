const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// const colorInput = document.getElementById('inkColor');
const startLink = document.getElementById('startLink');
const statusText = document.getElementById('status');
const splatSound = new Audio('../static/sounds/splat.mp3'); // 音源のロード
splatSound.volume = 0.5; // 音量の調整 (0.0 ～ 1.0)

let isRevealed = false;

// --- 設定 ---
const TOTAL_IMAGES = 1000; // 用意した画像の枚数
const IMAGE_DIR = '../static/images/splatters/'; // 画像が入っているフォルダ

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawInitialState();
}

// --- 修正ポイント：初期状態を白背景・白文字に ---
function drawInitialState() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 背景を白く塗る
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 文字を描く (白文字)
    ctx.font = "bold 120px Arial Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("START", canvas.width / 2, canvas.height / 2);
}

window.addEventListener('resize', resize);
resize();

canvas.addEventListener('mousedown', (e) => {
    // Reveal後もインクを置けるようにするか、止めるかはお好みで
    // if (isRevealed) return;
    placeSplatter(e.clientX, e.clientY);
});

async function placeSplatter(x, y) {
    // const color = encodeURIComponent(colorInput.value);

    // SE再生
    const soundClone = splatSound.cloneNode();
    soundClone.play();

    // 塗るインクをランダムに選択
    const randomNum = Math.floor(Math.random() * TOTAL_IMAGES);
    const formattedNum = String(randomNum).padStart(4, '0');
    const imgPath = `${IMAGE_DIR}ink${formattedNum}.png`;

    const img = new Image();
    img.src = imgPath;
    img.onload = () => {
        const drawSize = 250;

        // インクを描画 (常に文字の下に潜り込ませるために source-over)
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, x - drawSize/2, y - drawSize/2, drawSize, drawSize);

        // --- 修正ポイント：インクを置くたびに白文字を再描画 ---
        ctx.fillStyle = "#ffffff";
        ctx.fillText("START", canvas.width / 2, canvas.height / 2);

        checkReveal();
    };
}

// --- 修正ポイント：判定ロジック ---
function checkReveal() {
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
        const r = pixels[i];
        const g = pixels[i+1];
        const b = pixels[i+2];

        // 真っ白（背景）ではないピクセルがあるか判定
        if (r < 250 || g < 250 || b < 250) {
            coloredPixels++;
        }
    }

    const ratio = coloredPixels / (checkWidth * checkHeight);

    // 判定感度は 0.5〜0.7 くらいが遊びやすいです
    if (ratio > 0.6 && !isRevealed) {
        isRevealed = true;
        startLink.style.display = "block";
    }
}

function resetGame() {
    isRevealed = false;
    startLink.style.display = "none";
    drawInitialState();
}