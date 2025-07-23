import csv

texts = [
    "I absolutely love this product. It exceeded my expectations.",
    "This is the worst experience I've ever had with customer service.",
    "It was okay, nothing special but not bad either.",
    "I would highly recommend this to my friends!",
    "I don't think I'll buy this again. It broke after a week.",
    "Great value for the price — I'm satisfied.",
    "What a disappointment. The quality is terrible.",
    "It's fine. It does what it’s supposed to do.",
    "I'm genuinely impressed by the performance.",
    "Does this product even work? I'm not sure."
]

with open("sentiment_texts.csv", mode="w", newline='', encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["text"])  # Header
    for entry in texts:
        writer.writerow([entry])

print("CSV file 'sentiment_texts.csv' created with 10 text entries.")
