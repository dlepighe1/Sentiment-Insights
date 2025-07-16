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

class LRModel:                       # Logistic Regression
    def __init__(self, model_path):
        """ Load the model given the path where it is located """
        self.model = joblib.load(model_path)

    def predict(self, text, top_n=10):
        """ Predict the result given the input text: Return a json file with data information """
        # Vectorize
        X = vectorizer.transform([clean_text(text)])
        
        # Predict
        pred_label = self.model.predict(X)[0]
        proba = self.model.predict_proba(X)[0]
        class_probs = dict(zip(self.model.classes_, proba))
        
        # Identify the coefficient row for the predicted class
        #    model.coef_.shape == (n_classes, n_features)
        class_idx = list(self.model.classes_).index(pred_label)
        coef_for_class = self.model.coef_[class_idx]
        
        # Compute per-word contributions = tfidf_value * coefficient
        #    X is sparse, so we convert to dense row
        x_dense = X.toarray().ravel()
        contributions = x_dense * coef_for_class
        
        # Get feature names and sort by highest positive contributions
        feature_names = vectorizer.get_feature_names_out()
        top_indices = np.argsort(contributions)[::-1][:top_n]
        top_features = [(feature_names[i], contributions[i]) for i in top_indices if contributions[i] > 0]
        
        return pred_label, class_probs, top_features
     
# ===================================================================== # 
   
class RFModel:                       # Random Forest
    def __init__(self, model_path):    
        """ Load the model given the path where it is located """
        self.model = joblib.load(model_path)
        
    def predict(self, text, top_n=10): 
        """ Predict the result given the input text: Return a json file with data information """
        # Vectorize
        X = vectorizer.transform([clean_text(text)])

        # Predict label and probabilities
        pred_label = self.model.predict(X)[0]
        proba = self.model.predict_proba(X)[0]
        class_probs = dict(zip(self.model.classes_, proba))
        
        # Compute word-level relevance scores
        x_dense = X.toarray().ravel()
        importances = self.model.feature_importances_
        relevance = x_dense * importances 
        
        # Identify top_n contributing features
        feature_names = vectorizer.get_feature_names_out()
        top_indices = np.argsort(relevance)[::-1][:top_n]
        top_features = [(feature_names[i], float(relevance[i])) for i in top_indices if relevance[i] > 0]
        
        return pred_label, class_probs, top_features