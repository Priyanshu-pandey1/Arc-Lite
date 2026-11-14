
"""
100-question mixed evaluation for the Arc Lite FAQ assistant.

The dataset is organised in the ten groups requested by the evaluation
brief. Every question has an expected status:

    answered - an existing FAQ genuinely covers the question
    unclear  - the question has a domain anchor but is too ambiguous to
               select one FAQ without clarification
    refused  - the FAQs contain no information that answers the question

Expected categories are only set for "answered" cases. For unsupported
questions the answer is expected to be refused; labelling them as
supported just to raise the pass rate would defeat the purpose of the
evaluation.

Run from the backend directory:

    python tests/test_random_questions.py
"""

import sys
from pathlib import Path

# Allow running this file directly: python tests/test_random_questions.py
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ai_engine.engine import FAQAssistant
from ai_engine.matcher import find_best_match


# ---------------------------------------------------------------------
# Evaluation dataset: 10 groups x 10 questions
# ---------------------------------------------------------------------

TEST_CASES = [

    # 1. Direct FAQ questions -----------------------------------------
    {"group": "Direct", "question": "How can I explore available courses?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Direct", "question": "How can I enroll in a course?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Direct", "question": "Where can I find my enrolled courses?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Direct", "question": "Can I access course materials online?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Direct", "question": "How can I access my certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Direct", "question": "How can I download my course completion certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Direct", "question": "Why is my certificate not available?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Direct", "question": "Where can I find job opportunities?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Direct", "question": "How can I apply for a job listed on the platform?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Direct", "question": "How can I create an account on ArchintX?",
     "expected_status": "answered", "expected_category": "Account"},

    # 2. Paraphrased FAQ questions ------------------------------------
    {"group": "Paraphrase", "question": "Where do I find learning opportunities?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Paraphrase", "question": "How do I sign up for a course?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Paraphrase", "question": "How can I see the courses I am enrolled in?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Paraphrase", "question": "Where can I get the study materials for my course?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Paraphrase", "question": "How do I recover access to a course I cannot open?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Paraphrase", "question": "How can I obtain my certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Paraphrase", "question": "How do I save a copy of my completion certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Paraphrase", "question": "My certificate is not showing up. What should I do?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Paraphrase", "question": "How do I find out the status of my job application?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Paraphrase", "question": "How can I update my personal information?",
     "expected_status": "answered", "expected_category": "Account"},

    # 3. Questions with spelling mistakes -----------------------------
    {"group": "Spelling", "question": "How do I reset my pasword?",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Spelling", "question": "Where can I find job oppurtunities?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Spelling", "question": "How do I get my certifcate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Spelling", "question": "How can I enrol in a course?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Spelling", "question": "How do I downlaod my certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Spelling", "question": "I forgott my password.",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Spelling", "question": "How do I access my acont?",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Spelling", "question": "Where can I find my enroled courses?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Spelling", "question": "How can I aply for a job?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Spelling", "question": "How do I upate my account details?",
     "expected_status": "answered", "expected_category": "Account"},

    # 4. Short questions ----------------------------------------------
    {"group": "Short", "question": "Available courses?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Short", "question": "Course enrollment?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Short", "question": "My courses?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Short", "question": "Course materials?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Short", "question": "My certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Short", "question": "Download certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Short", "question": "Job openings?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Short", "question": "Job application status?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Short", "question": "Password reset?",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Short", "question": "Update profile?",
     "expected_status": "answered", "expected_category": "Account"},

    # 5. Conversational questions -------------------------------------
    {"group": "Conversational", "question": "Hi, how do I reset my password?",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Conversational", "question": "Hey there, where can I find jobs?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Conversational", "question": "Good morning, I want to download my certificate.",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Conversational", "question": "Hello, could you tell me how to enroll in a course?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Conversational", "question": "I was wondering how I can update my account details.",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Conversational", "question": "Can you help me find available courses?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Conversational", "question": "Please tell me where to find job opportunities.",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Conversational", "question": "I need to know how to apply for a job.",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Conversational", "question": "Thanks! How do I access my certificate?",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Conversational", "question": "Could you show me my enrolled courses?",
     "expected_status": "answered", "expected_category": "Courses"},

    # 6. Questions with extra words or greetings ----------------------
    {"group": "Extra words", "question": "Hello, I hope you are doing well. I forgot my password. Can you please help me?",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Extra words", "question": "Hey, I just wanted to know where I can find job opportunities on ArchintX.",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Extra words", "question": "Good morning! I completed my course and want to know how I can download my certificate.",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Extra words", "question": "Hi there, I am new here and would like to know how to create an account.",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Extra words", "question": "Excuse me, could you please tell me how I can explore available courses?",
     "expected_status": "answered", "expected_category": "Courses"},
    {"group": "Extra words", "question": "Good evening, I need help with my certificate that is not available.",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Extra words", "question": "Hey, quick question: how do I check my job application status?",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Extra words", "question": "Hello! I am trying to apply for a job and need some guidance.",
     "expected_status": "answered", "expected_category": "Jobs"},
    {"group": "Extra words", "question": "Hi, I would like to update my account information.",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Extra words", "question": "Good afternoon, can you tell me where to find course materials?",
     "expected_status": "answered", "expected_category": "Courses"},

    # 7. ArchintX-related but unsupported -----------------------------
    {"group": "ArchintX unsupported", "question": "What is the course fee?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "How much does a course cost?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "What is the salary offered by ArchintX?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "Who is the CEO of ArchintX?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "What is the office address of ArchintX?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "Does ArchintX provide accommodation?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "What are the working hours at ArchintX?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "Can I get a course refund?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "When does the course start?",
     "expected_status": "refused", "expected_category": None},
    {"group": "ArchintX unsupported", "question": "How do I delete my account?",
     "expected_status": "refused", "expected_category": None},

    # 8. Completely unrelated general knowledge ----------------------
    {"group": "General knowledge", "question": "What is the capital of France?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "Who invented the telephone?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "What is the largest planet in the solar system?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "How does a refrigerator work?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "Who is the president of the United States?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "What is the meaning of life?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "Tell me a joke.",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "What is the weather today?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "Who won the FIFA World Cup in 2022?",
     "expected_status": "refused", "expected_category": None},
    {"group": "General knowledge", "question": "What is the tallest mountain in the world?",
     "expected_status": "refused", "expected_category": None},

    # 9. Programming and technical questions --------------------------
    {"group": "Programming", "question": "How do I reverse a string in Python?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "What is machine learning?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "Explain quantum computing.",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "How do I create a website?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "Write a SQL query to join two tables.",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "What is the difference between Java and JavaScript?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "How does blockchain work?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "Can you generate an image?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "How do I fix a memory leak in C++?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Programming", "question": "What is an API?",
     "expected_status": "refused", "expected_category": None},

    # 10. Ambiguous questions -----------------------------------------
    {"group": "Ambiguous", "question": "Can you help me?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Ambiguous", "question": "I need some information.",
     "expected_status": "refused", "expected_category": None},
    {"group": "Ambiguous", "question": "I need help with my certificate.",
     "expected_status": "answered", "expected_category": "Certificates"},
    {"group": "Ambiguous", "question": "I have a problem with my course.",
     "expected_status": "unclear", "expected_category": None},
    {"group": "Ambiguous", "question": "Something is wrong with my account.",
     "expected_status": "unclear", "expected_category": None},
    {"group": "Ambiguous", "question": "My job application is not working.",
     "expected_status": "unclear", "expected_category": None},
    {"group": "Ambiguous", "question": "How do I get help with my account?",
     "expected_status": "answered", "expected_category": "Account"},
    {"group": "Ambiguous", "question": "I cannot access it.",
     "expected_status": "unclear", "expected_category": None},
    {"group": "Ambiguous", "question": "What should I do next?",
     "expected_status": "refused", "expected_category": None},
    {"group": "Ambiguous", "question": "Can you tell me more?",
     "expected_status": "refused", "expected_category": None},
]


assert len(TEST_CASES) == 100, f"Expected 100 test cases, got {len(TEST_CASES)}"


def run_evaluation():
    assistant = FAQAssistant(allow_unverified=True)

    passed = 0
    failed = 0
    answered = 0
    unclear = 0
    refused = 0
    false_positives = 0
    false_negatives = 0
    category_mismatches = 0

    failures = []

    print("\n" + "=" * 78)
    print("100-QUESTION MIXED RANDOM EVALUATION")
    print("=" * 78)

    for index, case in enumerate(TEST_CASES, start=1):

        question = case["question"]
        expected_status = case["expected_status"]
        expected_category = case["expected_category"]

        response = assistant.answer_question(question)
        actual_status = response["status"]

        # Raw best candidate, for diagnostics only. It is not used to
        # decide the expected outcome.
        best = find_best_match(
            question,
            assistant.vectorizer,
            assistant.faq_vectors,
            assistant.faqs
        )

        candidate_id = best["faq"]["id"]
        candidate_category = best["faq"]["category"]

        if actual_status == "answered":
            answered += 1
        elif actual_status == "unclear":
            unclear += 1
        else:
            refused += 1

        status_correct = actual_status == expected_status
        category_correct = True

        if expected_status == "answered" and actual_status == "answered":
            category_correct = response.get("category") == expected_category

        test_passed = status_correct and category_correct

        if test_passed:
            passed += 1
        else:
            failed += 1
            failures.append(
                (index, question, expected_status, actual_status,
                 response.get("category"), expected_category)
            )

        if actual_status == "answered" and expected_status != "answered":
            false_positives += 1

        if expected_status == "answered" and actual_status != "answered":
            false_negatives += 1

        if status_correct and not category_correct:
            category_mismatches += 1

        print(f"\nTest {index:3}/100  [{case['group']}]")
        print(f"  Question:        {question}")
        print(f"  Expected status: {expected_status}"
              + (f" ({expected_category})" if expected_category else ""))
        print(f"  Actual status:   {actual_status}")
        print(f"  Similarity:      {response['similarity_score']:.4f}")
        print(f"  Matched FAQ:     {candidate_id} - {candidate_category}")
        print(f"  Result:          {'PASS' if test_passed else 'FAIL'}")

    total = len(TEST_CASES)
    pass_rate = (passed / total) * 100 if total else 0.0

    print("\n" + "=" * 78)
    print("EVALUATION SUMMARY")
    print("=" * 78)
    print(f"Total tests:          {total}")
    print(f"Passed:               {passed}")
    print(f"Failed:               {failed}")
    print(f"Overall pass rate:    {pass_rate:.2f}%")
    print(f"Answered count:       {answered}")
    print(f"Unclear count:        {unclear}")
    print(f"Refused count:        {refused}")
    print(f"False positives:      {false_positives}")
    print(f"False negatives:      {false_negatives}")
    print(f"Category mismatches:  {category_mismatches}")

    if failures:
        print("\nFailed cases:")
        for number, question, expected, actual, got_cat, want_cat in failures:
            print(f"  #{number}: {question!r}")
            print(f"      expected {expected}"
                  + (f" ({want_cat})" if want_cat else "")
                  + f", got {actual}"
                  + (f" ({got_cat})" if got_cat else ""))

    # -----------------------------------------------------------------
    # Production verification: every sample FAQ is unverified, so all
    # questions must be refused when allow_unverified=False. This proves
    # the evaluation mode cannot leak unverified answers into production.
    # -----------------------------------------------------------------
    print("\n" + "=" * 78)
    print("PRODUCTION VERIFICATION (allow_unverified=False)")
    print("=" * 78)

    production_assistant = FAQAssistant(allow_unverified=False)

    production_answered = 0
    production_unclear = 0
    production_refused = 0

    for case in TEST_CASES:
        response = production_assistant.answer_question(case["question"])

        if response["status"] == "answered":
            production_answered += 1
        elif response["status"] == "unclear":
            production_unclear += 1
        else:
            production_refused += 1

    print(f"Production answered:  {production_answered}")
    print(f"Production unclear:   {production_unclear}")
    print(f"Production refused:   {production_refused}")
    print(
        "Production check:     "
        + ("PASS - no unverified FAQ was used"
           if production_answered == 0 and production_unclear == 0
           else "FAIL - unverified FAQ leaked into production")
    )

    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "pass_rate": pass_rate,
        "answered": answered,
        "unclear": unclear,
        "refused": refused,
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "production_answered": production_answered,
        "production_unclear": production_unclear,
    }


if __name__ == "__main__":
    run_evaluation()
