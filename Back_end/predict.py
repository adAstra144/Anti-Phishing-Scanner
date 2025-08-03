import torch
from .load_model import load_phishing_model

device = torch.device("cpu")  # Force CPU

# Load tokenizer and model once
tokenizer, model = load_phishing_model()
model.to(device)

def predict_phishing(text):
    # Tokenize the input text and send tensors to CPU
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        probabilities = torch.nn.functional.softmax(outputs.logits, dim=1)
        confidence, predicted_class = torch.max(probabilities, dim=1)

    label = "Phishing" if predicted_class.item() == 1 else "Safe"
    confidence_value = confidence.item()

    if label == "Phishing":
        reasoning = (
            "Highly likely phishing" if confidence_value >= 0.95 else
            "Possibly phishing" if confidence_value >= 0.7 else
            "Suspicious, but uncertain"
        )
    else:
        reasoning = (
            "Very likely safe" if confidence_value >= 0.95 else
            "Probably safe" if confidence_value >= 0.7 else
            "Unclear, but not phishing"
        )

    confidence_percent = round(confidence_value * 100, 1)
    return label, confidence_percent, reasoning
