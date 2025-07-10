from flask import Flask, render_template, request, jsonify
from MLM import LRModel, RFModel
import os

app = Flask(__name__, static_folder="static")

# Load the models here
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
LR_MODEL_PATH   = os.path.join(BASE_DIR, 'models', 'lr_model.joblib')
RF_MODEL_PATH   = os.path.join(BASE_DIR, 'models', 'rf_model.joblib')

lrModel   = LRModel(LR_MODEL_PATH)
rfModel   = RFModel(RF_MODEL_PATH)
# turboModel = TurboAIModel(TURBO_MODEL_CFG)  # your LLM wrapper

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
    payload    = request.json or {}
    model_name = payload.get("model")
    text       = payload.get("text", "")

    # Dispatch to the correct model
    if model_name == "Logistic Regression":
        pred_label, class_probs, top_features = lrModel.predict(text)
    elif model_name == "Random Forest":
        pred_label, class_probs, top_features = rfModel.predict(text)
    elif model_name == "Turbo AI (LLM)":
        pred_label, class_probs, top_features = "working", "working", "working"
    else:
        return jsonify(error="Unknown model"), 400

    # Format the response
    return jsonify({
        "prediction":    pred_label,
        "probabilities": class_probs,
        "top_features":  [
            {"feature": f, "contribution": float(c)}
            for f, c in top_features
        ]
    })


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
