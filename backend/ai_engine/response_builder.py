from ai_engine.decision_engine import make_decision


OUT_OF_SCOPE_MESSAGE = (
    "That question is outside the ArchintX FAQs I can currently answer. "
    "I can only help with questions about courses, certificates, jobs, "
    "and account-related topics."
)


def build_response(matching_result, allow_unverified=False):
    """
    Build a structured response using the FAQ match and decision.

    The decision engine decides between "answered", "unclear" and
    "refused" (considering verification status, generic questions,
    out-of-scope concepts, phrase evidence and the similarity thresholds),
    and this function maps that decision onto the response contract:

        {
            "status": "answered",
            "answer": "FAQ answer",
            "category": "Jobs",
            "similarity_score": 0.75,
            "faq_id": 11
        }

    Unclear questions get a clarification prompt. Refused questions get
    the fixed out-of-scope message: the assistant never uses general
    knowledge or invents an answer. An answer is never invented - it
    always comes from the matched FAQ itself.
    """

    # Extract matching FAQ and similarity score
    faq = matching_result["faq"]
    similarity_score = matching_result["similarity_score"]

    # Check whether the FAQ can be used
    verification_status = faq.get("verification_status", "unverified_sample")

    # Get the decision
    decision = make_decision(
        similarity_score,
        verification_status,
        allow_unverified,
        question=matching_result.get("question"),
        phrase_evidence=matching_result.get("phrase_evidence", False),
        unsupported_terms=matching_result.get("unsupported_terms"),
        needs_clarification=matching_result.get("needs_clarification", False),
        strict_out_of_scope=True
    )

    # Build response based on the decision
    if decision == "answered":

        return {
            "status": "answered",
            "answer": faq["answer"],
            "category": faq["category"],
            "similarity_score": round(similarity_score, 4),
            "faq_id": faq["id"]
        }

    elif decision == "unclear":

        return {
            "status": "unclear",
            "answer": "I'm not completely sure I understood your question. Could you rephrase it?",
            "category": None,
            "similarity_score": round(similarity_score, 4),
            "faq_id": None
        }

    else:

        return {
            "status": "refused",
            "answer": OUT_OF_SCOPE_MESSAGE,
            "category": None,
            "similarity_score": round(similarity_score, 4),
            "faq_id": None
        }
