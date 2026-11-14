
import json

from ai_engine.vectorizer import build_faq_vectors
from ai_engine.matcher import find_best_match


# Load FAQs
with open("data/faqs.json", "r", encoding="utf-8") as file:
    faqs = json.load(file)


# Build FAQ vectors
vectorizer, faq_vectors = build_faq_vectors(faqs)


# Questions to test
test_questions = [
    "How do I get my certificate?",
    "Where can I find job opportunities?",
    "I forgot my password",
    "How can I explore learning courses?",
    # Short/paraphrased Jobs questions (previously below threshold)
    "How can I discover available jobs?",
    "Available jobs?"
]


# Test each question
for question in test_questions:

    result = find_best_match(
        question,
        vectorizer,
        faq_vectors,
        faqs
    )

    print("\nUser Question:", question)
    print("Matched FAQ:", result["faq"]["question"])
    print("Category:", result["faq"]["category"])
    print("Similarity Score:", round(result["similarity_score"], 4))
    print("-" * 60)
