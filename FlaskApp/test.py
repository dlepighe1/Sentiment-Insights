import re
import json

def extract_json_from_backticks(text):
    # Check for triple backticks first (code blocks)
    match = re.search(r'```(.*?)```', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # If not found, check for single backticks (inline)
    match = re.search(r'`([^`]+)`', text)
    if match:
        return match.group(1).strip()
    
    # If no backticks, return None or raise exception
    return None

text_with_backticks = "Here is the payload: ```{\"pred_label\": \"Neutral\", \"class_probs\": {\"Neutral\": 100}}```"
extracted = extract_json_from_backticks(text_with_backticks)

if extracted:
    payload = json.loads(extracted)
    print(payload, type(payload))
else:
    print("No JSON found in backticks.")
