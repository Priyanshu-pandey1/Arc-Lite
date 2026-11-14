
import json
from pathlib import Path

from ai_engine.vectorizer import build_faq_vectors
from ai_engine.matcher import find_best_match
from ai_engine.response_builder import build_response
from ai_engine.faq_repository import load_faqs_from_database


class FAQAssistant:
    """
    FAQ-based assistant.

    Supports two FAQ sources:
    1. JSON file (useful for existing tests).
    2. Neon PostgreSQL database (used by the Flask application).
    """

    def __init__(
        self,
        faq_file=None,
        allow_unverified=False,
        use_database=False
    ):

        self.allow_unverified = allow_unverified
        self.use_database = use_database

        # Load FAQs from the selected source
        if self.use_database:
            self.faqs = load_faqs_from_database()

        else:
            if faq_file is None:
                faq_file = (
                    Path(__file__).resolve().parent.parent
                    / "data"
                    / "faqs.json"
                )

            with open(faq_file, "r", encoding="utf-8") as file:
                self.faqs = json.load(file)

        if not self.faqs:
            raise ValueError("FAQ dataset is empty.")

        # Build TF-IDF vectors once at startup
        self.vectorizer, self.faq_vectors = build_faq_vectors(
            self.faqs
        )

    def answer_question(self, question):

        if not isinstance(question, str) or not question.strip():
            raise ValueError("Question must be a non-empty string.")

        matching_result = find_best_match(
            question,
            self.vectorizer,
            self.faq_vectors,
            self.faqs
        )

        matching_result["question"] = question

        response = build_response(
            matching_result,
            allow_unverified=self.allow_unverified
        )

        # Preserve the matched database FAQ ID for conversation logging.
        matched_faq = matching_result.get("faq")
        response["faq_id"] = (
            matched_faq.get("id") if matched_faq else None
        )

        return response
