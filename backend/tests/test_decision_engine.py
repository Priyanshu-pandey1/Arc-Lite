
from ai_engine.decision_engine import make_decision


test_cases = [
    {
        "score": 0.90,
        "status": "verified",
        "allow_unverified": False,
        "question": "How do I get my certificate?",
        "expected": "answered"
    },
    {
        "score": 0.35,
        "status": "verified",
        "allow_unverified": False,
        "question": "How can I get help?",
        "expected": "unclear"
    },
    {
        "score": 0.08,
        "status": "verified",
        "allow_unverified": False,
        "question": "Random question",
        "expected": "refused"
    },
    {
        "score": 0.90,
        "status": "unverified_sample",
        "allow_unverified": False,
        "question": "How do I get my certificate?",
        "expected": "refused"
    },
    {
        "score": 0.90,
        "status": "inactive",
        "allow_unverified": True,
        "question": "How do I get my certificate?",
        "expected": "refused"
    },
    {
        "score": 0.90,
        "status": "unverified_sample",
        "allow_unverified": True,
        "question": "Can you help me?",
        "expected": "refused"
    }
]


print("\nDECISION ENGINE TESTING\n")

passed = 0

for test in test_cases:

    result = make_decision(
        test["score"],
        test["status"],
        test["allow_unverified"],
        question=test["question"]
    )

    success = result == test["expected"]

    if success:
        passed += 1

    print("Question:", test["question"])
    print("Expected:", test["expected"])
    print("Actual:", result)
    print("Result:", "PASS" if success else "FAIL")
    print("-" * 40)


print("\nTotal Tests:", len(test_cases))
print("Passed:", passed)
print("Failed:", len(test_cases) - passed)
