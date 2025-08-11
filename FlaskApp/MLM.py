"""
This is the implementation of the Machine Learning Models trained for Sentiment Analysis
From the Jupyter Notebook.
"""
import joblib
import re
import os
import numpy as np

# Load the vectorizer
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTORIZER_PATH = os.path.join(BASE_DIR, 'models', 'vectorizer.joblib')
STOPWORDS_PATH = os.path.join(BASE_DIR, 'models', 'stopwords.txt')
vectorizer = joblib.load(VECTORIZER_PATH)

# Load stopwords (to avoid NLTK's delay)
with open(STOPWORDS_PATH, 'r', encoding='utf-8') as f:
    stop_words = [line.strip() for line in f]

# Define a global cleaning function
def clean_text(text): 
    text = str(text).lower()
    text = re.sub(r'[^a-z\s]', '', text)                                         # Remove non-alphabet characters
    text = " ".join([word for word in text.split() if word not in stop_words])   # Tokenize and remove stop words
    text = re.sub(r'\s+', ' ', text).strip()                                     # Remove extra spaces
    return text

# ------------------------------------------------------------------------------- #
class LRModel:  # Logistic Regression
    def __init__(self, model_path):
        self.model = joblib.load(model_path)
        self.label_map = {0: "negative", 1: "neutral", 2: "positive"}

    def predict(self, text, top_n=10):
        X = vectorizer.transform([clean_text(text)])

        # Predict
        pred_label_num = self.model.predict(X)[0]  # np.int64
        pred_label = self.label_map[int(pred_label_num)]

        proba = self.model.predict_proba(X)[0]
        # Map numeric keys -> categorical names
        class_probs = {self.label_map[int(k)]: float(v)
                       for k, v in zip(self.model.classes_, proba)}

        # Get top features
        class_idx = list(self.model.classes_).index(pred_label_num)
        coef_for_class = self.model.coef_[class_idx]
        x_dense = X.toarray().ravel()
        contributions = x_dense * coef_for_class

        feature_names = vectorizer.get_feature_names_out()
        top_indices = np.argsort(contributions)[::-1][:top_n]
        top_features = [(feature_names[i], contributions[i])
                        for i in top_indices if contributions[i] > 0]

        return pred_label, class_probs, top_features

# ---------------------------------------------------------------------- #
class RFModel:  # Random Forest
    def __init__(self, model_path):
        self.model = joblib.load(model_path)
        self.label_map = {0: "negative", 1: "neutral", 2: "positive"}

    def predict(self, text, top_n=10):
        X = vectorizer.transform([clean_text(text)])

        # Predict
        pred_label_num = self.model.predict(X)[0]  # np.int64
        pred_label = self.label_map[int(pred_label_num)]

        proba = self.model.predict_proba(X)[0]
        # Map numeric keys -> categorical names
        class_probs = {self.label_map[int(k)]: float(v)
                       for k, v in zip(self.model.classes_, proba)}

        # Feature relevance
        x_dense = X.toarray().ravel()
        importances = self.model.feature_importances_
        relevance = x_dense * importances

        feature_names = vectorizer.get_feature_names_out()
        top_indices = np.argsort(relevance)[::-1][:top_n]
        top_features = [(feature_names[i], relevance[i])
                        for i in top_indices if relevance[i] > 0]

        return pred_label, class_probs, top_features