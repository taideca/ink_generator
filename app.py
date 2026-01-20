import io
import math
import random

import streamlit as st
from PIL import Image, ImageDraw, ImageFilter

# ページ設定
st.set_page_config(page_title="Ink Generator", layout="centered")


def create_ink_splatter(
    size, ink_color, core_radius, num_spikes, spike_min, spike_max, jitter_val, prob_base, blur_rad, threshold
):
    # PILの描画処理（元のロジックを流用）
    canvas = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(canvas)
    center = (size // 2, size // 2)

    # 1. 中央の核
    draw.ellipse(
        [center[0] - core_radius, center[1] - core_radius, center[0] + core_radius, center[1] + core_radius], fill=255
    )

    angle_step = (2 * math.pi) / num_spikes

    # 2. 飛沫の生成
    for i in range(num_spikes):
        base_angle = i * angle_step
        jitter = random.uniform(-0.5, 0.5) * angle_step * jitter_val
        angle = base_angle + jitter
        length = core_radius * random.uniform(spike_min, spike_max)

        if prob_base >= 1.0:
            is_connected = True
        else:
            dist_factor = 1.0 - (length / (core_radius * spike_max)) * 0.3
            is_connected = random.random() < (prob_base * dist_factor)

        if is_connected:
            rand_width_scale = random.uniform(0.6, 1.3)
            spike_points = []
            steps = 12
            for s in range(steps + 1):
                t = s / steps
                width = (
                    (18 * (1 - t) + 6) * rand_width_scale
                    if t < 0.8
                    else (12 + 10 * (t - 0.8) * 5) * random.uniform(0.9, 1.2)
                )
                curr_dist = length * t
                cx = center[0] + curr_dist * math.cos(angle)
                cy = center[1] + curr_dist * math.sin(angle)
                perp_angle = angle + math.pi / 2
                spike_points.append((cx + width * math.cos(perp_angle), cy + width * math.sin(perp_angle)))
            for s in range(steps, -1, -1):
                t = s / steps
                width = (
                    (18 * (1 - t) + 6) * rand_width_scale
                    if t < 0.8
                    else (12 + 10 * (t - 0.8) * 5) * random.uniform(0.9, 1.2)
                )
                curr_dist = length * t
                cx = center[0] + curr_dist * math.cos(angle)
                cy = center[1] + curr_dist * math.sin(angle)
                perp_angle = angle - math.pi / 2
                spike_points.append((cx + width * math.cos(perp_angle), cy + width * math.sin(perp_angle)))
            draw.polygon(spike_points, fill=255)
        else:
            tip_r_w = random.uniform(8, 20)
            tip_r_h = tip_r_w * random.uniform(1.1, 1.4)
            tip_x = center[0] + length * math.cos(angle)
            tip_y = center[1] + length * math.sin(angle)
            draw.ellipse([tip_x - tip_r_w, tip_y - tip_r_h, tip_x + tip_r_w, tip_y + tip_r_h], fill=255)

    # 3. 仕上げ
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=blur_rad))
    canvas = canvas.point(lambda x: 255 if x > threshold else 0)

    # 4. 色の適用
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # StreamlitのカラーピッカーはHEXで来るのでRGBに変換
    rgb_color = tuple(int(ink_color.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))
    color_layer = Image.new("RGBA", (size, size), rgb_color + (255,))
    result.paste(color_layer, (0, 0), mask=canvas)

    return result


# --- UI (Streamlit) ---
st.title("Ink Generator")
st.sidebar.header("調整パラメータ")

# サイドバーにパラメータを配置
# size = st.sidebar.number_input("画像サイズ", value=800)
size = 640
ink_color = st.sidebar.color_picker("インクの色", "#000000")
core_radius = st.sidebar.slider("核の半径", 50, 300, 150)
num_spikes = st.sidebar.slider("飛沫の数", 1, 30, 12)
spike_range = st.sidebar.slider("飛沫の長さ範囲", 1.0, 5.0, (1.4, 2.2))
spacing_jitter = st.sidebar.slider("配置のランダム性", 0.0, 1.0, 0.5)
# prob_base = st.sidebar.slider("つながる確率", 0.0, 1.0, 1.0)
# blur_radius = st.sidebar.slider("ぼかし量", 1, 50, 21)
# threshold = st.sidebar.slider("2値化閾値", 0, 255, 100)
prob_base = 1.0
blur_radius = 21
threshold = 100

# 生成ボタン
if st.button("画像を生成する"):
    img = create_ink_splatter(
        size,
        ink_color,
        core_radius,
        num_spikes,
        spike_range[0],
        spike_range[1],
        spacing_jitter,
        prob_base,
        blur_radius,
        threshold,
    )

    # 画像の表示
    st.image(img, caption="Generated ink.png", use_container_width=True)

    # ダウンロードボタンの設置
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    byte_im = buf.getvalue()

    st.download_button(label="この画像をダウンロード", data=byte_im, file_name="ink.png", mime="image/png")
else:
    st.info("左のパネルでパラメータを調整して、生成ボタンを押してください。")
