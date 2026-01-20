import io
from flask import Flask, render_template, request, send_file
import ink_generate as ink  # pyをインポート

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("game.html")


@app.route("/get_splatter")
def get_splatter():
    color = request.args.get("color", "#000000")
    # logic.py内の関数を呼び出す。サイズをここで指定可能。
    img = ink.create_ink_splatter(size=300, color_hex=color)

    img_io = io.BytesIO()
    img.save(img_io, "PNG")
    img_io.seek(0)
    return send_file(img_io, mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True)
