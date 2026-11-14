import json

with open("backend/data/faqs.json", "r", encoding="utf-8") as file:
    faqs = json.load(file)

print("Total FAQs:", len(faqs))

for faq in faqs:
    print(faq["id"], faq["category"], faq["question"])