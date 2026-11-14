from ai_engine.response_builder import build_response


# Test cases
test_cases = [
    {
        "faq": {
            "id": 1,
            "question": "How can I access my certificate?",
            "answer": "You can check your certificate through the relevant certificate section.",
            "category": "Certificates",
            "verification_status": "verified"
        },
        "similarity_score": 0.90
    },
    {
        "faq": {
            "id": 2,
            "question": "Where can I find courses?",
            "answer": "Sample course answer.",
            "category": "Courses",
            "verification_status": "verified"
        },
        "similarity_score": 0.35
    },
    {
        "faq": {
            "id": 3,
            "question": "How can I access my certificate?",
            "answer": "Unverified sample answer.",
            "category": "Certificates",
            "verification_status": "unverified_sample"
        },
        "similarity_score": 0.90
    }
]


# Test each case
for matching_result in test_cases:

    response = build_response(matching_result)

    print("\nGenerated Response:")
    print(response)
    print("-" * 60)