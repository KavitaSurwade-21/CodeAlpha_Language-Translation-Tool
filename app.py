from flask import Flask, render_template, request, jsonify
import webbrowser
from threading import Timer
from deep_translator import GoogleTranslator

app = Flask(__name__)

LANGUAGES = {
    "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic",
    "hy": "Armenian", "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian",
    "bn": "Bengali", "bs": "Bosnian", "bg": "Bulgarian", "ca": "Catalan",
    "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)",
    "hr": "Croatian", "cs": "Czech", "da": "Danish", "nl": "Dutch",
    "en": "English", "fi": "Finnish", "fr": "French", "de": "German",
    "el": "Greek", "gu": "Gujarati", "hi": "Hindi", "it": "Italian",
    "ja": "Japanese", "kn": "Kannada", "ko": "Korean", "mr": "Marathi",
    "ne": "Nepali", "pa": "Punjabi", "pt": "Portuguese", "ru": "Russian",
    "es": "Spanish", "ta": "Tamil", "te": "Telugu", "tr": "Turkish",
    "ur": "Urdu", "vi": "Vietnamese"
}

@app.route("/")
def index():
    return render_template("index.html", languages=LANGUAGES)

@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()
    text = data.get("text", "").strip()
    source_lang = data.get("source_lang", "auto")
    target_lang = data.get("target_lang", "hi")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        return jsonify({"translated": translated, "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


def open_browser():
    webbrowser.open("http://127.0.0.1:5000")


if __name__ == "__main__":
    Timer(1, open_browser).start()
    app.run(debug=True)