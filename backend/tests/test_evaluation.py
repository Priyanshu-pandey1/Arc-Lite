
from ai_engine.engine import FAQAssistant

# Enable sample FAQs for development testing
assistant = FAQAssistant(allow_unverified=True)

# Evaluation dataset

test_cases = [
    # Direct questions
    {
        "question": "How do I get my certificate?",
        "expected_category": "Certificates",
        "expected_status": "answered"
    },
    {
        "question": "Where can I find job opportunities?",
        "expected_category": "Jobs",
        "expected_status": "answered"
    },
    {
        "question": "I forgot my password",
        "expected_category": "Account",
        "expected_status": "answered"
    },

    # Paraphrased questions
    {
        "question": "Where can I download my course certificate?",
        "expected_category": "Certificates",
        "expected_status": "answered"
    },
    {
        "question": "How can I discover available jobs?",
        "expected_category": "Jobs",
        "expected_status": "answered"
    },
    {
        "question": "How do I recover my account password?",
        "expected_category": "Account",
        "expected_status": "answered"
    },

    # Unrelated questions
    {
        "question": "What is the capital of France?",
        "expected_category": None,
        "expected_status": "refused"
    },
    {
        "question": "What is the weather today?",
        "expected_category": None,
        "expected_status": "refused"
    },
    # Spelling mistakes
    {
    "question": "How do I reset my pasword?",
    "expected_category": "Account",
    "expected_status": "answered"
    },
    {
    "question": "Where can I find job oppurtunities?",
    "expected_category": "Jobs",
    "expected_status": "answered"
    },
    # Short questions
    {
    "question": "My password?",
    "expected_category": "Account",
    "expected_status": "answered"
    },
    {
    "question": "Available jobs?",
    "expected_category": "Jobs",
    "expected_status": "answered"
    },
    # Ambiguous questions
    {
    "question": "Can you help me?",
    "expected_category": None,
    "expected_status": "refused"
    },
    {
    "question": "I need some information",
    "expected_category": None,
    "expected_status": "refused"
    },

    # A. Direct questions (additional)
    {
        "question": "How do I reset my password?",
        "expected_category": "Account",
        "expected_status": "answered"
    },
    {
        "question": "How can I access my certificate?",
        "expected_category": "Certificates",
        "expected_status": "answered"
    },

    # B. Paraphrased questions (additional)
    {
        "question": "How do I download my course certificate?",
        "expected_category": "Certificates",
        "expected_status": "answered"
    },
    {
        "question": "How can I recover my account password?",
        "expected_category": "Account",
        "expected_status": "answered"
    },

    # C. Short questions (additional)
    {
        "question": "My certificate?",
        "expected_category": "Certificates",
        "expected_status": "answered"
    },
    {
        "question": "Password reset?",
        "expected_category": "Account",
        "expected_status": "answered"
    },

    # D. Spelling mistakes (additional)
    {
        "question": "How do I get my certifcate?",
        "expected_category": "Certificates",
        "expected_status": "answered"
    },

    # E. Greetings and extra words (additional)
    {
        "question": "Hey, can you tell me where I can find job opportunities?",
        "expected_category": "Jobs",
        "expected_status": "answered"
    },
    {
        "question": "Hello, how do I reset my password?",
        "expected_category": "Account",
        "expected_status": "answered"
    },

    # F. Irrelevant questions (additional)
    {
        "question": "Who won the football match?",
        "expected_category": None,
        "expected_status": "refused"
    },

    # G. Ambiguous questions (additional)
    {
        "question": "I need some information.",
        "expected_category": None,
        "expected_status": "refused"
    }
]


correct = 0
total = len(test_cases)

print("\n========== AI ENGINE EVALUATION ==========\n")

for test in test_cases:

    question = test["question"]
    expected_status = test["expected_status"]
    expected_category = test["expected_category"]

    result = assistant.answer_question(question)

    status_correct = result["status"] == expected_status
    category_correct = result["category"] == expected_category

    passed = status_correct and category_correct

    if passed:
        correct += 1
    print("Similarity Score:", result["similarity_score"])
    print("Question:", question)
    print("Expected Status:", expected_status)
    print("Actual Status:", result["status"])
    print("Expected Category:", expected_category)
    print("Actual Category:", result["category"])
    print("Result:", "PASS" if passed else "FAIL")
    print("-" * 50)
    

print("\n========== EVALUATION SUMMARY ==========")
print("Total Tests:", total)
print("Passed:", correct)
print("Failed:", total - correct)
print("Pass Rate:", round((correct / total) * 100, 2), "%")
