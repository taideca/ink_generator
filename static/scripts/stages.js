const MINCHO = "HiraMinProN-W6, 'MS Mincho', serif";

const STAGES_DATA = [
    {
        // --- Stage 0: タイトル画面 ---
        hint: "ロゴのあたりを塗ってみて！",
        objects: [
            { id: 'logo', type: 'image', name: 'logo', x: 0.5, y: 0.2, w: 300, h: 200 },
            { id: 'text1', type: 'text', content: "【遊び方】", x: 0.3, y: 0.7, font: `20px ${MINCHO}`, color: "#000" },
            { id: 'text2', type: 'text', content: "- 画面をクリックしてインクを塗る", x: 0.5, y: 0.75, font: `20px ${MINCHO}`, color: "#000" },
            { id: 'text3', type: 'text', content: "- おかしな箇所をインクで隠そう　", x: 0.5, y: 0.8, font: `20px ${MINCHO}`, color: "#000" }
        ],
        targets: [{ obj: 'logo', shape: 'rect', tx: 0.6, ty: 0.6, tw: 0.2, th: 0.6, found: false}]
    },
    {
        // --- Stage 1 ---
        hint: "宝箱の鍵を見つけて！",
        objects: [
            { id: 'text1', type: 'text', content: "宝物庫", x: 0.5, y: 0.2, font: "40px 'Hiragino Mincho ProN', 'MS Mincho', serif", color: "#000" },
            { id: 'text2', type: 'text', content: "🎁", x: 0.5, y: 0.7, font: "100px HiraMinProN-W6", color: "#ccc" }
        ],
        targets: [{ obj: 'text2', shape: 'circle', tx: 0.5, ty: 0.5, tr: 1.0, found: false }]
    },
    {
        // --- Stage 2 ---
        hint: "間違いを見つけて",
        objects: [
            { id: 'north', type: 'text', content: "北", x: 0.5, y: 0.2, font: "40px HiraMinProN-W6", color: "#000" },
            { id: 'east', type: 'text', content: "東", x: 0.8, y: 0.5, font: "40px HiraMinProN-W6", color: "#000" },
            { id: 'south', type: 'text', content: "南", x: 0.5, y: 0.8, font: "40px HiraMinProN-W6", color: "#000" },
            { id: 'west', type: 'text', content: "酉", x: 0.2, y: 0.5, font: "40px HiraMinProN-W6", color: "#000" }
        ],
        targets: [{ obj: 'west', shape: 'circle', tx: 0.5, ty: 0.5, tr: 1.0, found: false }]
    }
];

// === objects define templates ===
// objects: [
//     { type: 'text', content: "宝物庫", x: 0.5, y: 0.2, font: "40px serif", color: "#666" },
//     { type: 'image', name: 'treasure', x: 0.5, y: 0.7, w: 200, h: 200 }
// ],