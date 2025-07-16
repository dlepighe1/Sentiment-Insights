from together import Together
import json
import os
import re

API_KEY = os.getenv("TOGETHER_API_KEY")

# Structure the model 
class SentimentAnalyzerLLM: 
    def __init__(self):
        # Connect to the API provider
        self.model = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
        self.client = Together(api_key=API_KEY)
        
        self.prompt_template = """
            You are a sentiment-analysis assistant. When given an input text, you will:
            1. Determine its overall sentiment as one of: Positive, Neutral, or Negative.
            2. Assign each category a score from 0 to 100 such that they sum (approximately) to 100.
            3. Identify the top words that most strongly contributed to the final sentiment, and give each a contribution score from 0.000 to 1.000.
            4. Return only a JSON object with these three fields: pred_label, class_probs, and top_features.

            Here’s the text to analyze:
            ---
            {text}
            ---
            Return *only* the JSON object. Do not include any explanation, markdown, or trailing text.
        """

    def predict(self, text, top_n=8):
        # Perform a light cleaning of the text
        text = text.lower().strip()
        text = re.sub(r'[\r\n\t]+', ' ', text)        
        text = re.sub(r'\s{2,}', ' ', text)
        
        # Prompt the model with the given the cleaned text
        prompt = self.prompt_template.format(text=text)
        
        # Call the API to geththe result
        response = self.client.completions.create(
            model = self.model, 
            prompt=prompt, 
            max_tokens=200, 
            temperature=0.0, 
            stop=["\n\n"]
        )
        
        # Parse the JSON returned in the generated text
        result_text = response.choices[0].text.strip()
        if not result_text.startswith("{"):
            m = re.search(r"(\{.*\})", result_text, re.DOTALL)
            if m:
                result_text = m.group(1)
        
        return json.loads(result_text)
    
model = SentimentAnalyzerLLM()
response = model.predict("This shit tastes really good. I want to buy it again")
print(response)
