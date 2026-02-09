const STAGES_DATA = [
    {
        // --- Stage 0: タイトル画面 ---
        objects: [
            { id: 'logo', type: 'image', content: 'logo', x: 0.5, y: 0.2, w: 300, h: 200 },
            { id: 'text1', type: 'text', content: "【遊び方】", x: 0.3, y: 0.7, fontSize: 32, color: "#000" },
            { id: 'text2', type: 'text', content: "- 画面をクリックしてインクを塗る", x: 0.5, y: 0.75, fontSize: 32, color: "#000" },
            { id: 'text3', type: 'text', content: "- おかしな箇所をインクで隠そう　", x: 0.5, y: 0.8, fontSize: 32, color: "#000" }
        ],
        targets: [{ obj: 'logo', shape: 'rect', tx: 0.64, ty: 0.45, tw: 0.2, th: 0.5, found: false}]
    },
    {
        // --- Stage 1 ---
        objects: [
            { id: 'north', type: 'text', content: "北", x: 0.5, y: 0.2, fontSize: 40, color: "#000" },
            { id: 'east', type: 'text', content: "東", x: 0.8, y: 0.5, fontSize: 40, color: "#000" },
            { id: 'south', type: 'text', content: "南", x: 0.5, y: 0.8, fontSize: 40, color: "#000" },
            { id: 'west', type: 'text', content: "酉", x: 0.2, y: 0.5, fontSize: 40, color: "#000" }
        ],
        targets: [{ obj: 'west', shape: 'circle', tx: 0.5, ty: 0.5, tr: 0.5, found: false }]
    },
    {
        // --- Stage 2 ---
        objects: [
            { id: 'dice1', type: 'image', content: 'dice123', x: 0.5, y: 0.8, w: 100, h: 100 },
            { id: 'dice2', type: 'image', content: 'dice263', x: 0.7, y: 0.3, w: 100, h: 100 },
            { id: 'dice3', type: 'image', content: 'dice312', x: 0.3, y: 0.9, w: 100, h: 100 },
            { id: 'dice4', type: 'image', content: 'dice421', x: 0.2, y: 0.4, w: 100, h: 100 },
            { id: 'dice5', type: 'image', content: 'dice462', x: 0.4, y: 0.5, w: 100, h: 100 },
            { id: 'dice6', type: 'image', content: 'dice536', x: 0.8, y: 0.7, w: 100, h: 100 },
            { id: 'dice7', type: 'image', content: 'dice645', x: 0.9, y: 0.2, w: 100, h: 100 },
            { id: 'diceD', type: 'image', content: 'd_dice251', x: 0.6, y: 0.6, w: 100, h: 100 }
        ],
        targets: [{ obj: 'diceD', shape: 'circle', tx: 0.5, ty: 0.5, tr: 0.5, found: false }]
    }
];

// === objects define templates ===
// objects: [
//     { type: 'text', content: "宝物庫", x: 0.5, y: 0.2, font: "40px serif", color: "#666" },
//     { type: 'image', name: 'treasure', x: 0.5, y: 0.7, w: 200, h: 200 }
// ],