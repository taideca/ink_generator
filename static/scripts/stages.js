const STAGES_DATA = [
    {
        hint: "宝箱の鍵を見つけて！",
        objects: [
            { type: 'text', content: "宝物庫", x: 0.5, y: 0.2, font: "40px 'Hiragino Mincho ProN', 'MS Mincho', serif", color: "#000" },
            { type: 'text', content: "🎁", x: 0.5, y: 0.7, font: "100px HiraMinProN-W6", color: "#ccc" }
        ],
        targets: [{ x: 0.5, y: 0.7, r: 60, found: false }]
    },
    {
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