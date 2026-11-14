
from ai_engine.faq_repository import load_faqs_from_database

faqs = load_faqs_from_database()

print("Database FAQ loading successful!")
print("Total FAQs:", len(faqs))

for faq in faqs:
    print(
        faq["id"],
        "|",
        faq["category"],
        "|",
        faq["question"],
        "|",
        faq["verification_status"]
    )
