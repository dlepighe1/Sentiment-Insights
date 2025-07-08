# app.py
from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder="static")

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/analyze")
def analyze():
    return render_template("analyze.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/predict_text", methods=["POST"])
def predict_text():
    text = request.json.get("text", "")
    # TODO: plug in real model
    data = [{"text": text, "sentiment": "Positive", "score": 0.95}]
    return jsonify(data=data)

@app.route("/predict_bulk", methods=["POST"])
def predict_bulk():
    # TODO: handle file & model selection
    data = [
        {"text": "Sample A", "sentiment": "Neutral", "score": 0.50},
        {"text": "Sample B", "sentiment": "Negative", "score": 0.30}
    ]
    return jsonify(data=data)

@app.route("/scrape_predict", methods=["POST"])
def scrape_predict():
    url = request.json.get("url", "")
    # TODO: scrape & predict
    data = [{"text": f"Scraped from {url}", "sentiment": "Negative", "score": 0.20}]
    return jsonify(data=data)

if __name__ == "__main__":
    app.run(debug=True)
