from pathlib import Path

from flask import Flask, jsonify, render_template

from config import Config
from hardware_ai import HardwareAiAnalyzer
from serial_reader import SerialSensorReader


BASE_DIR = Path(__file__).resolve().parent.parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "frontend" / "templates"),
    static_folder=str(BASE_DIR / "frontend" / "static"),
)

reader = SerialSensorReader()
reader.start()
analyzer = HardwareAiAnalyzer()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/latest")
def latest():
    return jsonify(reader.get_latest())


@app.route("/api/history")
def history():
    return jsonify(reader.get_history())


@app.route("/api/ai-analysis")
def ai_analysis():
    return jsonify(analyzer.analyze(reader.get_latest()))


@app.route("/api/health")
def health():
    return jsonify(
        {
            "ok": True,
            "ai_runtime": "hardware",
            **reader.get_status(),
        }
    )


if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG, use_reloader=False)
