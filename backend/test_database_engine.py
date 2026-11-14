
from ai_engine.engine import FAQAssistant

# Load FAQs directly from Neon
assistant = FAQAssistant(
    use_database=True,
    allow_unverified=True
)

print("AI engine connected to Neon!")
print("FAQs loaded:", len(assistant.faqs))

questions = [
    "Where can I find job opportunities?",
    "How can I reset my password?",
    "How can I download my certificate?",
    "What is the capital of France?"
]

for question in questions:
    result = assistant.answer_question(question)

    print("\nQuestion:", question)
    print("Status:", result["status"])
    print("Answer:", result["answer"])
    print("Category:", result["category"])
    print("FAQ ID:", result["faq_id"])
