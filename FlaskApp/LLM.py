from together import Together
import json
import os
import re

API_KEY = "3a823237163e2759f94c94b7a7b32f2454cfe3a0dbf677afe8090d16dd1ef4c7"

class SentimentAnalyzerLLM: 
    def __init__(self):
        self.model = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
        self.client = Together(api_key=API_KEY)
        
    def clean_response(self, text):
        # Check for the triple backticks first
        match = re.search(r'```(.*?)```', text, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        # If not found, check for single backticks (inline)
        match = re.search(r'`([^`]+)`', text)
        if match:
            return match.group(1).strip()
        
        # If no backticks, return None or raise exception
        return None

    def predict(self, text, top_n=10):
        # Clean the input text
        text = text.lower().strip()
        text = re.sub(r'[\r\n\t]+', ' ', text)        
        text = re.sub(r'\s{2,}', ' ', text)

        attempt = 0
        while True:
            attempt += 1
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a sentiment analysis assistant. You always return results strictly in valid JSON format with no extra text."},
                    {"role": "user", "content": f"""
    Analyze the following text for sentiment and return a JSON object with these fields:
    - "pred_label": Positive, Neutral, or Negative
    - "class_probs": dictionary with scores summing to ~100
    - "top_features": list of important and relevant words with scores between 0.000 and 1.000
    - "explanation": short reasoning for your prediction

    Rules:
    - If the text is factual, informational, a question, or lacks emotional content, classify it as **Neutral**.
    - Only assign **Positive** or **Negative** if the text clearly expresses an opinion, sentiment, or evaluation.
    - Ensure class_probs reflect this logic (Neutral should have the highest score for factual or emotionless texts).
    - Keep the structure of the result the same across all sentiments (even for Neutral sentiment, include the word and contribution)
    - If more than **5** candidate words are found in "top_features" field, select only the **7 most relevant** with contribution scores higher than **0.050**.

    Text:
    ---
    {text}
    ---

    Respond ONLY with the JSON object. Do not add any extra text or explanation or ```."""}
                ],
                max_tokens=300,
                temperature=0.0
            )

            result_text = response.choices[0].message.content.strip()
            result = self.clean_response(result_text)

            if result:
                try:
                    payload = json.loads(result)
                    # print(f"[Attempt {attempt}] Successful response:\n{result_text}\n")

                    pred_label = payload.get("pred_label")
                    class_probs = payload.get("class_probs", {})
                    top_features = []
                    for item in payload.get("top_features", []):
                        if isinstance(item, dict) and 'word' in item and 'score' in item:
                            top_features.append((item['word'], item['score']))
                        elif isinstance(item, list) and len(item) == 2:
                            top_features.append((item[0], item[1]))
                    explanation = payload.get("explanation")
                    return pred_label, class_probs, top_features[:top_n], explanation

                except json.JSONDecodeError as e:
                    print(f"[Attempt {attempt}] JSON decode failed. Retrying...\nError: {e}\n{result_text}\n")
            else:
                print(f"[Attempt {attempt}] No valid JSON found. Retrying...\n")

    
    
test = SentimentAnalyzerLLM()
text = "I know you ain't laughing. this shit is trash"
text = "I know you ain't laughing. this shit is trash. What else can you do other than messing around?"
res = test.predict(text)
