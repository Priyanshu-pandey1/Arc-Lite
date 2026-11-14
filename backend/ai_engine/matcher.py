
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from ai_engine.decision_engine import UNCLEAR_THRESHOLD
from ai_engine.preprocessing import (
    contains_policy_question,
    contains_problem_report,
    contains_vague_request,
    faq_handles_problems,
    find_unsupported_terms,
    has_cross_category_conflict,
    phrase_coverage,
    question_anchors,
    tokenize_content,
)


def find_best_match(question, vectorizer, faq_vectors, faqs):
    """
    Find the FAQ most similar to the user's question.

    Three signals are combined per FAQ:

      * Document channel - the whole query against the whole FAQ
        (question + keywords), word-level and character-level TF-IDF
        cosine similarity.
      * Phrase channel - the query against each individual keyword
        phrase (word-level cosine). A phrase only counts when ALL of its
        content words appear in the question, so a coincidental single
        word overlap ("create" in "create a website" vs "create account")
        never becomes evidence.
      * Out-of-scope channel - content words in the question that appear
        nowhere in the FAQ dataset (e.g. "fee", "salary", "website").
        These tell the decision engine that the FAQ set cannot answer the
        question even if a loosely related FAQ scores highly.

    The phrase channel is still gated on document support: a FAQ's phrase
    evidence may only raise its score when that same FAQ already reaches
    the decision engine's unclear floor (UNCLEAR_THRESHOLD = 0.25) on the
    document channel. The phrase channel therefore refines existing
    evidence; it never creates evidence from nothing - in line with the
    project rule "refuse, don't guess".

    The question is not preprocessed here on purpose: the vectorizer's
    own preprocessor already runs preprocess_text (lowercase,
    punctuation removal, spelling correction), so a separate step would
    duplicate the work.

    Returns:
        {
            "faq": <best FAQ dict>,
            "similarity_score": <float>,
            "document_score": <float>,
            "phrase_evidence": <bool>,
            "phrase": <matched keyword phrase or None>,
            "phrase_coverage": <float>,
            "unsupported_terms": <list of out-of-scope words>
        }
    """

    # The vectorizer's preprocessor normalizes and spell-corrects the
    # input; invalid (non-string) input still raises a TypeError.
    question_vector = vectorizer.transform([question])

    # Document-level similarity (word + character TF-IDF)
    document_scores = cosine_similarity(question_vector, faq_vectors)[0]

    # Content tokens are order-independent and already stemmed, so a
    # phrase can be checked with a simple set membership test.
    query_tokens = tokenize_content(question, remove_fillers=False)

    scores = document_scores.copy()

    best_phrase_scores = np.zeros(len(faqs), dtype=float)
    best_phrase_texts = [None] * len(faqs)
    best_phrase_coverages = np.zeros(len(faqs), dtype=float)
    best_phrase_token_counts = np.zeros(len(faqs), dtype=int)
    has_phrase_evidence = np.zeros(len(faqs), dtype=bool)

    # ---- phrase channel (only if the vectorizer was built with one) --
    phrase_vectors = getattr(vectorizer, "phrase_vectors", None)
    phrase_tokens = getattr(vectorizer, "phrase_tokens", None)

    if (
        phrase_vectors is not None
        and phrase_vectors.shape[0] > 0
        and phrase_tokens is not None
    ):
        word_vectorizer = vectorizer.transformer_list[0][1]
        query_phrase_vector = word_vectorizer.transform([question])
        phrase_scores = cosine_similarity(
            query_phrase_vector, phrase_vectors
        )[0]

        owners = np.asarray(vectorizer.phrase_owners, dtype=int)
        phrase_texts = getattr(vectorizer, "phrase_texts", [None] * len(owners))

        for index, owner in enumerate(owners):

            coverage = phrase_coverage(
                phrase_tokens[index], query_tokens
            )

            # Partial overlaps are not evidence. This is the key guard
            # against unrelated questions inheriting a keyword score
            # from a single shared word.
            if coverage < 1.0:
                continue

            phrase_score = float(phrase_scores[index])

            if not has_phrase_evidence[owner] or (
                phrase_score > best_phrase_scores[owner]
            ):
                best_phrase_scores[owner] = phrase_score
                best_phrase_texts[owner] = phrase_texts[index]
                best_phrase_coverages[owner] = coverage
                best_phrase_token_counts[owner] = len(phrase_tokens[index])
                has_phrase_evidence[owner] = True

        # Gate: a single-word phrase needs document support, because one
        # shared word is weak evidence. A multi-word phrase that is fully
        # present needs no separate document gate - all of its curated
        # words are already in the question, which is exactly the
        # "keyword phrase present in the sentence" behaviour short
        # questions such as "learning opportunities?" rely on.
        phrase_supported = has_phrase_evidence & (
            (document_scores >= UNCLEAR_THRESHOLD)
            | (best_phrase_token_counts >= 2)
        )

        scores = np.where(
            phrase_supported,
            np.maximum(document_scores, best_phrase_scores),
            document_scores
        )
    else:
        phrase_supported = np.zeros(len(faqs), dtype=bool)

    # Find the index of the highest similarity score
    best_index = int(np.argmax(scores))

    # Retrieve the matching FAQ
    best_faq = faqs[best_index]

    # Retrieve its similarity score
    best_score = float(scores[best_index])

    # A malfunction report ("my job application is not working") must not
    # be answered with instructions for a different task just because the
    # same nouns appear. If the best FAQ is not troubleshooting content,
    # the decision engine will ask for clarification instead.
    problem_without_support = (
        contains_problem_report(question)
        and not faq_handles_problems(best_faq)
    )

    # "A certificate to get a job" mentions two categories. Answering only
    # the category that happened to match ignores half the question.
    cross_category = has_cross_category_conflict(question, best_faq)

    # Requirement questions about a domain category ("is a certificate
    # required?") are not answered by the current FAQs.
    policy_question = (
        contains_policy_question(question)
        and bool(question_anchors(question))
    )

    # Missing objects ("I cannot access it") and vague requests
    # ("something is wrong") also need clarification rather than a guess.
    # A full keyword-phrase match counts as strong intent, so conversational
    # filler such as "can you please help me?" does not turn a clearly
    # supported password/certificate/job question into a vague one.
    vague_request = contains_vague_request(
        question,
        strong_intent=bool(phrase_supported[best_index]),
    )

    needs_clarification = (
        problem_without_support
        or cross_category
        or policy_question
        or vague_request
    )

    return {
        "faq": best_faq,
        "similarity_score": best_score,
        "document_score": float(document_scores[best_index]),
        "phrase_evidence": bool(phrase_supported[best_index]),
        "phrase": best_phrase_texts[best_index],
        "phrase_coverage": float(best_phrase_coverages[best_index]),
        "unsupported_terms": find_unsupported_terms(question),
        "needs_clarification": needs_clarification,
    }
