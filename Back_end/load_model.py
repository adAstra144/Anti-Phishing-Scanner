# load_model.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "ealvaradob/bert-finetuned-phishing"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

def load_phishing_model():
    return tokenizer, model
