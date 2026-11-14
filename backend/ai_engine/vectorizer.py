
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion

from ai_engine.preprocessing import (
    configure_spellchecker,
    preprocess_text,
    tokenize_content,
)


def build_faq_vectors(faqs):
    """
    Convert FAQ questions and keywords into combined word-level and
    character-level TF-IDF vectors.

    The FAQ document is the question plus all keyword phrases. Because
    such documents are long, a short paraphrase can score poorly against
    them even when it matches a keyword exactly (document-length
    dilution). To counter that, a word-level vector is also built for
    every individual keyword phrase and attached to the returned
    vectorizer as ``phrase_vectors`` / ``phrase_owners`` so the matcher
    can run a separate phrase-matching channel.

    Returns:
        (vectorizer, faq_vectors)

    Side effects:
        Configures the spellchecker with the FAQ vocabulary first, so no
        FAQ text (or later user question) has its domain words damaged
        by spell correction during vectorization.
    """

    # Protect domain vocabulary BEFORE any preprocessing happens, so
    # terms like "ArchintX" or "PDF" survive spell correction intact.
    configure_spellchecker(faqs)

    faq_texts = []

    for faq in faqs:
        text = faq["question"] + " " + " ".join(faq.get("keywords", []))
        faq_texts.append(text)

    word_vectorizer = TfidfVectorizer(
        preprocessor=preprocess_text,
        lowercase=False,
        analyzer="word",
        ngram_range=(1, 2)
    )

    char_vectorizer = TfidfVectorizer(
        preprocessor=preprocess_text,
        lowercase=False,
        analyzer="char_wb",
        ngram_range=(2, 5)
    )

    # Equal channel weights. Measured evidence: the combined cosine is a
    # weighted average of the word and character channel scores, and the
    # word channel scores LOWER on paraphrased/short questions, so
    # weighting it higher (e.g. word=2.0) dragged paraphrase similarity
    # down and failed more evaluation cases. Do not re-weight without
    # re-running the evaluation suite.
    vectorizer = FeatureUnion(
    [
        ("word", word_vectorizer),
        ("char", char_vectorizer)
    ],
    transformer_weights={
        "word": 1.0,
        "char": 1.0
    }
    )

    faq_vectors = vectorizer.fit_transform(faq_texts)

    # ---- keyword-phrase channel -------------------------------------
    # One vector per keyword phrase, kept in the same fitted IDF space
    # as the FAQ documents so both channels produce comparable cosine
    # scores. phrase_owners[i] is the index of the FAQ that owns
    # phrase i.
    phrase_texts = []
    phrase_owners = []

    for index, faq in enumerate(faqs):
        # The FAQ's own question is also a valid phrase pattern: a user
        # asking (almost) the same question should not be penalised just
        # because the document-level vector is diluted by keywords.
        # Keyword phrases are added first so they win ties.
        for keyword in faq.get("keywords", []):
            phrase_texts.append(keyword)
            phrase_owners.append(index)

        phrase_texts.append(faq["question"])
        phrase_owners.append(index)

    if phrase_texts:
        phrase_vectors = word_vectorizer.transform(phrase_texts)

        # Content tokens for every phrase. The matcher uses these to make
        # sure a phrase only counts as evidence when ALL of its meaningful
        # words appear in the question. Precomputing avoids re-tokenising
        # the whole keyword list on every request.
        phrase_tokens = [
            tokenize_content(phrase, remove_fillers=False)
            for phrase in phrase_texts
        ]
    else:
        # No keywords in the dataset: the matcher falls back to
        # document-level matching only.
        phrase_vectors = None
        phrase_tokens = []

    vectorizer.phrase_vectors = phrase_vectors
    vectorizer.phrase_owners = phrase_owners
    vectorizer.phrase_texts = phrase_texts
    vectorizer.phrase_tokens = phrase_tokens

    return vectorizer, faq_vectors
