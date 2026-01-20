from flask import Flask, render_template, send_file, request
import random
import math
import io
from PIL import Image, ImageDraw, ImageFilter

app = Flask(__name__)

# ==========================================
# 元のロジックをベースにした生成関数
# ==========================================
def create_ink_splatter(color_hex="#000000"):
    # パラメータ設定
    SIZE = 400                  # ゲーム用に少し小さめに調整
    CORE_RADIUS = 50            # 核の半径
    NUM_SPIKES = 12
    SPIKE_LENGTH_MIN = 1.4
    SPIKE_LENGTH_MAX = 2.2
    SPACING_JITTER = 0.5
    CONNECTION_PROB_BASE = 1.0
    BLUR_RADIUS = 12            # サイズに合わせて調整
    THRESHOLD = 100

    # HEXカラーをRGBに変換
    rgb_color = tuple(int(color_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))

    canvas = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(canvas)
    center = (SIZE // 2, SIZE // 2)

    # 1. 中央の核
    draw.ellipse([center[0]-CORE_RADIUS, center[1]-CORE_RADIUS,
                   center[0]+CORE_RADIUS, center[1]+CORE_RADIUS], fill=255)

    angle_step = (2 * math.pi) / NUM_SPIKES

    # 2. 飛沫の生成
    for i in range(NUM_SPIKES):
        base_angle = i * angle_step
        jitter = random.uniform(-0.5, 0.5) * angle_step * SPACING_JITTER
        angle = base_angle + jitter
        length = CORE_RADIUS * random.uniform(SPIKE_LENGTH_MIN, SPIKE_LENGTH_MAX)
        tip_x = center[0] + length * math.cos(angle)
        tip_y = center[1] + length * math.sin(angle)

        is_connected = True if CONNECTION_PROB_BASE >= 1.0 else random.random() < CONNECTION_PROB_BASE

        if is_connected:
            rand_width_scale = random.uniform(0.6, 1.3)
            spike_points = []
            steps = 12
            for s in range(steps + 1):
                t = s / steps
                width = (18 * (1 - t) + 6) * rand_width_scale if t < 0.8 else (12 + 10 * (t - 0.8) * 5) * random.uniform(0.9, 1.2)
                curr_dist = length * t
                cx = center[0] + curr_dist * math.cos(angle)
                cy = center[1] + curr_dist * math.sin(angle)
                perp_angle = angle + math.pi / 2
                spike_points.append((cx + width * math.cos(perp_angle), cy + width * math.sin(perp_angle)))
            for s in range(steps, -1, -1):
                t = s / steps
                width = (18 * (1 - t) + 6) * rand_width_scale if t < 0.8 else (12 + 10 * (t - 0.8) * 5) * random.uniform(0.9, 1.2)
                curr_dist = length * t
                cx = center[0] + curr_dist * math.cos(angle)
                cy = center[1] + curr_dist * math.sin(angle)
                perp_angle = angle - math.pi / 2
                spike_points.append((cx + width * math.cos(perp_angle), cy + width * math.sin(perp_angle)))
            draw.polygon(spike_points, fill=255)
        else:
            tip_r_w = random.uniform(8, 20)
            tip_r_h = tip_r_w * random.uniform(1.1, 1.4)
            draw.ellipse([tip_x - tip_r_w, tip_y - tip_r_h, tip_x + tip_r_w, tip_y + tip_r_h], fill=255)

    # 3. 仕上げ
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
    canvas = canvas.point(lambda x: 255 if x > THRESHOLD else 0)

    # 4. 色の適用
    result = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    color_layer = Image.new("RGBA", (SIZE, SIZE), rgb_color + (255,))
    result.paste(color_layer, (0, 0), mask=canvas)
    return result

# --- Flask Routes ---

@app.route('/')
def index():
    return render_template('game.html')

@app.route('/get_splatter')
def get_splatter():
    color = request.args.get('color', '#000000')
    img = create_ink_splatter(color)
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)