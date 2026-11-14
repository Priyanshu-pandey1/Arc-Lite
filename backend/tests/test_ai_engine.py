from ai_engine.engine import FAQAssistant


# Initialize the AI assistant
assistant = FAQAssistant(allow_unverified=True)


# Questions to test
test_questions = [
    "How do I get my certificate?",
    "Where can I find job opportunities?",
    "I forgot my password",
    "What is the capital of France?",
    ""
]


for question in test_questions:

    print("\nUser Question:", repr(question))

    try:
        response = assistant.answer_question(question)

        print("Status:", response["status"])
        print("Answer:", response["answer"])
        print("Category:", response["category"])
        print("Similarity:", response["similarity_score"])

    except ValueError as error:
        print("Input Error:", error)

    print("-" * 60)


# Verification status tests (production vs development mode)
# All sample FAQs are marked "unverified_sample", so production mode
# must refuse them while development mode may answer from them.

print("\nVERIFICATION MODE TESTS\n")

production_assistant = FAQAssistant(allow_unverified=False)
development_assistant = FAQAssistant(allow_unverified=True)

verification_cases = [
    {
        "assistant": production_assistant,
        "mode": "production",
        "question": "Where can I find job opportunities?",
        "expected_status": "refused"
    },
    {
        "assistant": production_assistant,
        "mode": "production",
        "question": "How do I reset my password?",
        "expected_status": "refused"
    },
    {
        "assistant": development_assistant,
        "mode": "development",
        "question": "Where can I find job opportunities?",
        "expected_status": "answered"
    }
]

verification_passed = 0

for test in verification_cases:

    response = test["assistant"].answer_question(test["question"])
    success = response["status"] == test["expected_status"]

    if success:
        verification_passed += 1

    print("Mode:", test["mode"])
    print("Question:", test["question"])
    print("Expected:", test["expected_status"])
    print("Actual:", response["status"])
    print("Result:", "PASS" if success else "FAIL")
    print("-" * 60)

print("\nVerification Passed:", verification_passed, "/", len(verification_cases))