const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const colorInput = document.getElementById('inkColor');
const startLink = document.getElementById('startLink');
const statusText = document.getElementById('status');

let isRevealed = false;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawInitialState();
}

function drawInitialState() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 120px Arial Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeText("START", canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillText("START", canvas.width / 2, canvas.height / 2);
}

window.addEventListener('resize', resize);
resize();

canvas.addEventListener('mousedown', (e) => {
    if (isRevealed) return;
    placeSplatter(e.clientX, e.clientY);
});

async function placeSplatter(x, y) {
    const color = encodeURIComponent(colorInput.value);
    const response = await fetch(`/get_splatter?color=${color}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.src = url;
    img.onload = () => {
        const drawSize = 250;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, x - drawSize/2, y - drawSize/2, drawSize, drawSize);

        // 文字を上書き
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = "white";
        ctx.fillText("START", canvas.width / 2, canvas.height / 2);

        URL.revokeObjectURL(url);
        checkReveal();
    };
}

function checkReveal() {
    const checkWidth = 400;
    const checkHeight = 150;
    const imageData = ctx.getImageData(
        canvas.width / 2 - checkWidth / 2, 
        canvas.height / 2 - checkHeight / 2, 
        checkWidth, checkHeight
    );
    const pixels = imageData.data;
    let coloredPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 20 || pixels[i+1] > 20 || pixels[i+2] > 20) {
            coloredPixels++;
        }
    }

    const ratio = coloredPixels / (checkWidth * checkHeight);

    if (ratio > 0.7 && !isRevealed) {
        isRevealed = true;
        startLink.style.display = "block";
        statusText.innerHTML = "<strong>READY! CLICK START!</strong>";
        statusText.style.color = "red";
    }
}

function resetGame() {
    isRevealed = false;
    startLink.style.display = "none";
    statusText.innerHTML = "<small>画面をクリックしてね</small>";
    statusText.style.color = "black";
    drawInitialState();
}