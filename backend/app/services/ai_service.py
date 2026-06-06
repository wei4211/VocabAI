from openai import OpenAI
from app.config import settings
import json
import re

def _get_client():
    return OpenAI(
        api_key=settings.GEMINI_API_KEY,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

MODEL = "gemini-2.5-flash"


def generate_word_card(word: str) -> dict:
    """Use Gemini to generate vocabulary card data."""
    if not settings.GEMINI_API_KEY:
        return _fallback_word_card(word)

    prompt = f"""For the English word "{word}", provide a JSON response with:
- meaning: Chinese translation/explanation (繁體中文)
- part_of_speech: grammatical category (noun/verb/adjective/adverb/etc.)
- example_sentence: one natural English example sentence
- synonyms: comma-separated list of 2-3 synonyms
- antonyms: comma-separated list of 2-3 antonyms (or empty string if none)

Respond ONLY with valid JSON, no markdown.
Example: {{"meaning":"維持；支撐","part_of_speech":"verb","example_sentence":"She could not sustain the pace.","synonyms":"maintain, support, uphold","antonyms":"abandon, neglect"}}"""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )
        text = response.choices[0].message.content.strip()
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        return json.loads(text)
    except Exception as e:
        print(f"Gemini error: {e}")
        return _fallback_word_card(word)


def _fallback_word_card(word: str) -> dict:
    return {
        "meaning": "（請設定 GEMINI_API_KEY 以自動產生解釋）",
        "part_of_speech": "unknown",
        "example_sentence": f"Please look up '{word}' in a dictionary.",
        "synonyms": "",
        "antonyms": "",
    }


def generate_quiz_questions(words: list[dict], question_count: int = 10) -> list[dict]:
    """Generate quiz questions for given words."""
    if not settings.GEMINI_API_KEY or not words:
        return []

    words_text = "\n".join([f"- {w['word']}: {w['meaning']}" for w in words[:20]])

    prompt = f"""Create {min(question_count, len(words))} quiz questions for these English vocabulary words:
{words_text}

Mix these question types evenly:
1. multiple_choice: 4 options, test meaning recognition
2. fill_blank: fill in the blank sentence
3. translation: Chinese to English translation

Return ONLY a JSON array:
[
  {{
    "word": "original word",
    "question_type": "multiple_choice",
    "question_text": "question text",
    "correct_answer": "correct answer",
    "options": ["option1", "option2", "option3", "option4"]
  }}
]
For fill_blank and translation, options is null."""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=2000,
        )
        text = response.choices[0].message.content.strip()
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
        return json.loads(text)
    except Exception as e:
        print(f"Quiz generation error: {e}")
        return []


def ocr_extract_words_from_image(image_bytes: bytes, content_type: str) -> dict | None:
    """Use Gemini vision to extract text and vocabulary from an image."""
    if not settings.GEMINI_API_KEY:
        return None

    import base64
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """This is an English document (textbook, exam, article, etc.).

Please:
1. Extract all the English text you can see in the image
2. Identify vocabulary words that an English learner might find difficult

Return ONLY valid JSON in this format:
{
  "extracted_text": "full text from image",
  "suggested_words": [
    {"word": "vocabulary_word", "context": "sentence it appeared in"}
  ]
}

For suggested_words: max 20 words, exclude common words like articles/prepositions."""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{content_type};base64,{image_b64}"},
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        text_resp = response.choices[0].message.content.strip()
        text_resp = re.sub(r"^```(?:json)?\n?", "", text_resp)
        text_resp = re.sub(r"\n?```$", "", text_resp)
        return json.loads(text_resp)
    except Exception as e:
        print(f"OCR error: {e}")
        return {"extracted_text": "", "suggested_words": []}
