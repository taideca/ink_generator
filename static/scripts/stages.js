const STAGES_DATA = [
    {
        // --- Stage 0: タイトル画面 ---
        hint: "ロゴのあたりを塗ってみて！",
        objects: [
            { type: 'image', name: 'logo', x: 0.5, y: 0.2, w: 300, h: 200 },
            { type: 'text', content: "【遊び方】", x: 0.3, y: 0.7, font: "20px HiraMinProN-W6", color: "#000" },
            { type: 'text', content: "- 画面をクリックしてインクを塗る", x: 0.5, y: 0.75, font: "20px HiraMinProN-W6", color: "#000" },
            { type: 'text', content: "- おかしな箇所をインクで隠そう　", x: 0.5, y: 0.8, font: "20px HiraMinProN-W6", color: "#000" }
        ],
        targets: [
            { x: 0.55, y: 0.2, r: 50, found: false } // ロゴの位置を塗れば次へ
        ]
    },
    {
        // --- Stage 1 ---
        hint: "宝箱の鍵を見つけて！",
        objects: [
            { type: 'text', content: "宝物庫", x: 0.5, y: 0.2, font: "40px 'Hiragino Mincho ProN', 'MS Mincho', serif", color: "#000" },
            { type: 'text', content: "🎁", x: 0.5, y: 0.7, font: "100px HiraMinProN-W6", color: "#ccc" }
        ],
        targets: [{ x: 0.5, y: 0.7, r: 60, found: false }]
    },
    {
        // --- Stage 2 ---
        hint: "間違いを見つけて",
        objects: [
            { type: 'text', content: "北", x: 0.5, y: 0.2, font: "40px HiraMinProN-W6", color: "#000" },
            { type: 'text', content: "東", x: 0.8, y: 0.5, font: "40px HiraMinProN-W6", color: "#000" },
            { type: 'text', content: "南", x: 0.5, y: 0.8, font: "40px HiraMinProN-W6", color: "#000" },
            { type: 'text', content: "酉", x: 0.2, y: 0.5, font: "40px HiraMinProN-W6", color: "#000" }
        ],
        targets: [{ x: 0.2, y: 0.5, r: 20, found: false }]
    }
];

// === objects define templates ===
// objects: [
//     { type: 'text', content: "宝物庫", x: 0.5, y: 0.2, font: "40px serif", color: "#666" },
//     { type: 'image', name: 'treasure', x: 0.5, y: 0.7, w: 200, h: 200 }
// ],