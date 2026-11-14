from ai_engine.preprocessing import preprocess_text

questions = [
    "How do I reset my pasword?",
    "Where can I find job oppurtunities?",
    "I forgott my password",
    "HOW CAN I DOWNLOAD MY CERTIFICATE???",
]

for question in questions:
    print("Original:", question)
    print("Processed:", preprocess_text(question))
    print("-" * 50)