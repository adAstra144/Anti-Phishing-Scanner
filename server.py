from flask import Flask, request, jsonify, render_template
from Back_end.predict import predict_phishing
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Missing message"}), 400

    message = data["message"]
    label, confidence = predict_phishing(message)

    return jsonify({
        "result": label,
        "confidence": f"{confidence}%"
    })

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
