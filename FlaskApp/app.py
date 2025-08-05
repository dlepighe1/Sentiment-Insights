from flask import Flask, render_template, request, jsonify
from MLM import LRModel, RFModel
from LLM import SentimentAnalyzerLLM
import os
import io 
import csv

app = Flask(__name__, static_folder="static")

# Load the models here
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
LR_MODEL_PATH   = os.path.join(BASE_DIR, 'models', 'lr_model.joblib')
RF_MODEL_PATH   = os.path.join(BASE_DIR, 'models', 'rf_model.joblib')

lrModel   = LRModel(LR_MODEL_PATH)
rfModel   = RFModel(RF_MODEL_PATH)
llModel   = SentimentAnalyzerLLM()

PREDICTIONS = []

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

    if model_name == "Logistic Regression":
        pred_label, class_probs, top_features = lrModel.predict(text)
        explanation = None

    elif model_name == "Random Forest":
        pred_label, class_probs, top_features = rfModel.predict(text)
        explanation = None

    elif model_name == "Meta Llama 3.3":
        pred_label, class_probs, top_features, explanation = llModel.predict(text)
        # Normalize class probabilities
        class_probs = {label.lower(): score / 100.0 if score > 1 else score for label, score in class_probs.items()}

    else:
        return jsonify(error="Unknown model"), 400

    return jsonify({
        "prediction":    pred_label,
        "probabilities": class_probs,
        "top_features":  [
            {"feature": feature, "contribution": contribution}
            for feature, contribution in top_features
        ],
        "explanation": explanation
    })

@app.route("/predict_bulk", methods=["POST"])
def predict_bulk():
    payload     = request.get_json() or {}
    model_name  = payload.get("model")
    file_text   = payload.get("file_text", "").strip()
    filename    = payload.get("filename", "").strip()

    # Basic validation
    if not file_text or not filename:
        return jsonify(error="Must provide both 'filename' and 'file_text'"), 400

    ext = os.path.splitext(filename)[1].lower()
    if ext not in (".csv", ".txt"):
        return jsonify(error="Unsupported file type. Only .csv and .txt allowed."), 400

    # Extract texts
    texts = []
    if ext == ".csv":
        reader = csv.DictReader(io.StringIO(file_text))
        # look for a "text" column (case-insensitive)
        field = next((h for h in reader.fieldnames if h.lower() == "text"), None)
        if not field:
            return jsonify(error="CSV must contain a 'text' header"), 400
        for row in reader:
            txt = row.get(field, "").strip()
            if txt:
                texts.append(txt)
    else:  # .txt
        for line in file_text.splitlines():
            line = line.strip()
            if line:
                texts.append(line)

    # Run predictions
    results = []
    for text in texts:
        if model_name == "Logistic Regression":
            pred_label, class_probs, _ = lrModel.predict(text)
            score = class_probs.get(pred_label, 0.0)
            
        elif model_name == "Random Forest":
            pred_label, class_probs, _ = rfModel.predict(text)
            score = class_probs.get(pred_label, 0.0)
            
        elif model_name == "Meta Llama 3.3":
            pred_label, score = llModel.predict_proba(text)
            score = score / 100.0 if score > 1 else score      # Normalize the probabilities
        else:
            return jsonify(error="Unknown model"), 400
        
        results.append({
            "text":      text,
            "sentiment": pred_label,
            "score":     score
        })

    return jsonify(data=results)

app.run(debug=True)