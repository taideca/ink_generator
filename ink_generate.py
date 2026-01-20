import random
import math
from PIL import Image, ImageDraw, ImageFilter


def create_ink_splatter(size, color_hex="#000000"):
    # --- サイズに依存しない比率設定 ---
    # すべて size * 比率 にすることで、サイズ変更に対応
    CORE_RADIUS = size * 0.20     # 核は画像サイズの15%
    BLUR_RADIUS = size * 0.03     # ぼかしはサイズに合わせて調整

    NUM_SPIKES = 12
    SPIKE_LENGTH_MIN = 1.4
    SPIKE_LENGTH_MAX = 2.2
    SPACING_JITTER = 0.5
    CONNECTION_PROB_BASE = 1.0
    THRESHOLD = 100

    rgb_color = tuple(int(color_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
    canvas = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(canvas)
    center = (size // 2, size // 2)

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

        # 先端の座標
        tip_x = center[0] + length * math.cos(angle)
        tip_y = center[1] + length * math.sin(angle)

        if CONNECTION_PROB_BASE >= 1.0:
            is_connected = True
        else:
            is_connected = random.random() < CONNECTION_PROB_BASE

        if is_connected:
            rand_width_scale = random.uniform(0.6, 1.3)
            # 幅もサイズ(CORE_RADIUS)に比例させる
            base_w = CORE_RADIUS * 0.12

            spike_points = []
            steps = 12
            for s in range(steps + 1):
                t = s / steps
                if t < 0.8:
                    width = (base_w * (1 - t) + base_w * 0.3) * rand_width_scale
                else:
                    width = (base_w * 0.6 + base_w * 0.5 * (t - 0.8) * 5) * random.uniform(0.9, 1.2)

                curr_dist = length * t
                cx = center[0] + curr_dist * math.cos(angle)
                cy = center[1] + curr_dist * math.sin(angle)
                perp_angle = angle + math.pi / 2
                spike_points.append((cx + width * math.cos(perp_angle),
                                     cy + width * math.sin(perp_angle)))

            for s in range(steps, -1, -1):
                t = s / steps
                if t < 0.8: width = (base_w * (1 - t) + base_w * 0.3) * rand_width_scale
                else: width = (base_w * 0.6 + base_w * 0.5 * (t - 0.8) * 5) * random.uniform(0.9, 1.2)

                curr_dist = length * t
                cx = center[0] + curr_dist * math.cos(angle)
                cy = center[1] + curr_dist * math.sin(angle)
                perp_angle = angle - math.pi / 2
                spike_points.append((cx + width * math.cos(perp_angle),
                                     cy + width * math.sin(perp_angle)))

            draw.polygon(spike_points, fill=255)
        else:
            # 切り離された飛沫のサイズも比例させる
            tip_r = CORE_RADIUS * random.uniform(0.05, 0.13)
            draw.ellipse([tip_x - tip_r, tip_y - tip_r,
                           tip_x + tip_r, tip_y + tip_r], fill=255)

    # 3. 仕上げ
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
    canvas = canvas.point(lambda x: 255 if x > THRESHOLD else 0)

    # 4. 色の適用
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    color_layer = Image.new("RGBA", (size, size), rgb_color + (255,))
    result.paste(color_layer, (0, 0), mask=canvas)

    return result