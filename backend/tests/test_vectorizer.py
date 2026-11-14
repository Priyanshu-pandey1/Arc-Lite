
import json

from ai_engine.vectorizer import build_faq_vectors


# Load FAQ dataset
with open("data/faqs.json", "r", encoding="utf-8") as file:
    faqs = json.load(file)


# Build TF-IDF vectors
vectorizer, faq_vectors = build_faq_vectors(faqs)


# Display results
print("Total FAQs:", len(faqs))
print("Vector matrix shape:", faq_vectors.shape)

# A FeatureUnion has no vocabulary_ attribute of its own; each fitted
# sub-vectorizer inside it does. Report both channels.
word_transformer = dict(vectorizer.transformer_list)["word"]
char_transformer = dict(vectorizer.transformer_list)["char"]
word_vocab = len(word_transformer.vocabulary_)
char_vocab = len(char_transformer.vocabulary_)

print("Vocabulary size (word):", word_vocab)
print("Vocabulary size (char):", char_vocab)

print("\nSample vocabulary:")
print(list(word_transformer.vocabulary_.keys())[:15])
