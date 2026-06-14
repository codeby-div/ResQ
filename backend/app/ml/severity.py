import re
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import CountVectorizer

SEVERITY_KEYWORDS = {
    "critical": [
        "cardiac arrest", "heart attack", "unconscious", "not breathing",
        "severe bleeding", "gunshot", "stab", "stroke", "seizure",
        "anaphylaxis", "overdose", "head injury", "multiple fractures",
    ],
    "high": [
        "chest pain", "difficulty breathing", "burn", "fracture",
        "deep cut", "allergic reaction", "high fever", "dehydration",
        "asthma attack", "poisoning", "dislocation",
    ],
    "medium": [
        "fever", "vomiting", "sprain", "cut", "infection",
        "migraine", "abdominal pain", "dizziness", "rash",
        "ear pain", "sore throat",
    ],
    "low": [
        "cold", "cough", "minor cut", "scratch", "bruise",
        "mild headache", "routine check", "insomnia",
    ],
}

_vectorizer = CountVectorizer()
_model = None
_trained = False

_training_texts = []
_training_labels = []

for severity, keywords in SEVERITY_KEYWORDS.items():
    for kw in keywords:
        _training_texts.append(kw)
        _training_labels.append(severity)

_training_texts.append("emergency")
_training_labels.append("high")
_training_texts.append("urgent")
_training_labels.append("high")
_training_texts.append("accident")
_training_labels.append("high")
_training_texts.append("pain")
_training_labels.append("medium")


def _train():
    global _model, _trained
    X = _vectorizer.fit_transform(_training_texts)
    y = np.array(_training_labels)
    _model = LogisticRegression(max_iter=200, multi_class="multinomial")
    _model.fit(X, y)
    _trained = True


def predict_severity(description: str) -> str:
    if not description or not description.strip():
        return "medium"

    text = description.lower()

    for severity in ["critical", "high", "medium", "low"]:
        for kw in SEVERITY_KEYWORDS[severity]:
            if kw in text:
                return severity

    if not _trained:
        try:
            _train()
        except Exception:
            return "medium"

    if _trained:
        try:
            X = _vectorizer.transform([text])
            pred = _model.predict(X)[0]
            return pred
        except Exception:
            pass

    return "medium"
