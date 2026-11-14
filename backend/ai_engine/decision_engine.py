from ai_engine.preprocessing import preprocess_text


# Decision thresholds. Kept as named constants so other modules (the
# matcher's phrase gate) reuse the exact same values instead of
# duplicating magic numbers.
ANSWER_THRESHOLD = 0.50    # similarity >= this -> answered
UNCLEAR_THRESHOLD = 0.25    # similarity >= this (but < 0.50) -> unclear
                           # similarity < this -> refused


# Questions too generic to map onto any specific FAQ. They are refused
# even when a high similarity score exists, because answering them with
# an arbitrary FAQ would be guessing.
GENERIC_QUESTIONS = {
    "can you help me",
    "i need some information",
    "help me",
    "i need help",
    "can you assist me",
    "tell me something"
}


def make_decision(
    similarity_score,
    verification_status,
    allow_unverified=False,
    question=None,
    phrase_evidence=False,
    unsupported_terms=None,
    needs_clarification=False,
    strict_out_of_scope=False
):
    """
    Decide whether a match should be answered, clarified or refused.

    Order of checks:
      1. An inactive FAQ is never used -> refused.
      2. An unverified FAQ is only usable when allow_unverified=True
         (development mode); production mode refuses it.
      3. Generic, intent-free questions -> refused, regardless of score.
      4. Questions containing concepts absent from the whole FAQ dataset
         (e.g. "fee", "salary", "website") -> refused. A loosely related
         FAQ must not be used to answer something the dataset does not
         cover.
      5. A problem report that the matched FAQ does not troubleshoot
         ("my job application is not working" vs an FAQ about applying)
         -> unclear: ask what exactly is failing instead of guessing.
      6. A full keyword-phrase match (every content word of a curated
         keyword phrase appears in the question) -> answered, provided
         the document channel also reached the unclear floor.
      7. Otherwise the similarity thresholds decide:
         >= 0.50 answered, >= 0.25 unclear, else refused.

    The extra arguments are optional so existing callers of
    make_decision(score, status, allow_unverified, question=...) keep
    working unchanged.

    Returns:
        "answered" | "unclear" | "refused"
    """

    # 1. Inactive FAQs must never be used
    if verification_status == "inactive":
        return "refused"

    # 2. Unverified sample FAQs are refused in production mode
    if verification_status != "verified" and not allow_unverified:
        return "refused"

    # 3. Generic questions are refused before any score is considered
    if question:
        normalized_question = preprocess_text(question)

        if normalized_question in GENERIC_QUESTIONS:
            return "refused"

    # 4. Out-of-scope concepts: the FAQ set has no information about them
    if unsupported_terms:
        return "refused"

    # 5. A malfunction report needs a troubleshooting FAQ. Without one,
    #    clarification is the only honest response.
    if needs_clarification:
        return "unclear"

    # 6. Strong keyword-phrase evidence for a FAQ that already has at
    #    least weak document support.
    if phrase_evidence and similarity_score >= UNCLEAR_THRESHOLD:
        return "answered"

    # 7. Similarity thresholds
    if similarity_score >= ANSWER_THRESHOLD:
        return "answered"

    elif similarity_score >= UNCLEAR_THRESHOLD:
        # The full engine sets strict_out_of_scope=True: weak similarity
        # without a clarification signal means the FAQs do not cover the
        # question, so it is refused rather than vaguely "unclear". The
        # default (False) preserves make_decision's standalone contract.
        return "unclear" if not strict_out_of_scope else "refused"

    else:
        return "refused"
