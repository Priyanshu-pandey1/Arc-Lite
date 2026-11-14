
from ai_engine.engine import FAQAssistant

assistant = FAQAssistant(allow_unverified=True)

test_cases = [
    {
        "question": "Hello, I hope you are doing well. I forgot my password. Can you please help me?",
        "expected_category": "Account",
        "expected_status": "answered"
    },
    {
        "question": "Hey, I just wanted to know where I can find job opportunities on ArchintX.",
        "expected_category": "Jobs",
        "expected_status": "answered"
    },
    {
        "question": "Good morning! I completed my course and want to know how I can download my certificate.",
        "expected_category": "Certificates",
        "expected_status": "answered"
    },
    {
        "question": "Hello, how are you? Can you tell me the capital of France?",
        "expected_category": None,
        "expected_status": "refused"
    }
]

passed = 0

print("\nIRRELEVANT EXTRA WORDS TEST\n")

for test in test_cases:

    result = assistant.answer_question(test["question"])

    success = (
        result["status"] == test["expected_status"]
        and result["category"] == test["expected_category"]
    )

    if success:
        passed += 1

    print("Question:", test["question"])
    print("Expected:", test["expected_status"], test["expected_category"])
    print("Actual:", result["status"], result["category"])
    print("Similarity:", result["similarity_score"])
    print("Result:", "PASS" if success else "FAIL")
    print("-" * 50)

print("\nTotal Tests:", len(test_cases))
print("Passed:", passed)
print("Failed:", len(test_cases) - passed)
print("Pass Rate:", round(passed / len(test_cases) * 100, 2), "%")
