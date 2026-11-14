
import re
import string
from spellchecker import SpellChecker


# Initialize the English spellchecker
spell = SpellChecker(distance=2)

# Domain-specific terms that must never be "corrected" by the spellchecker.
# These are loaded explicitly because they may not appear in the FAQ dataset
# (e.g. "faq") but are still valid words in the context of this assistant.
DOMAIN_TERMS = {"archintx", "pdf", "faq"}


# The complete FAQ vocabulary (question words + keyword words). It is
# populated by configure_spellchecker() before any text is preprocessed.
# Two things use it:
#   * spell correction only corrects unknown words towards THIS vocabulary,
#     so valid-but-unsupported words ("fee", "website", "unenroll") are
#     never silently rewritten into a supported word;
#   * the matcher uses it to detect concepts the FAQs do not cover.
DOMAIN_VOCABULARY = set(DOMAIN_TERMS)

# Tracks whether the engine has loaded the FAQ vocabulary. Before that,
# preprocess_text() falls back to ordinary dictionary correction so the
# function still behaves sensibly when used stand-alone (for example in
# the preprocessing demo script). The engine always configures the FAQ
# vocabulary first, which enables the safer domain-only correction.
_FAQ_VOCABULARY_CONFIGURED = False


# Minimal grammar stopwords. Deliberately does NOT contain intent verbs such
# as "find", "get", "help", "access" or "search": those carry meaning in the
# FAQ keyword phrases and must survive tokenisation.
GRAMMAR_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "am", "do", "does", "did", "doing", "have", "has", "had", "having",
    "i", "me", "myself", "we", "us", "our", "ours", "ourselves",
    "you", "your", "yours", "yourself", "yourselves",
    "he", "him", "his", "himself", "she", "her", "hers", "herself",
    "it", "its", "itself", "they", "them", "theirs", "themselves",
    "what", "which", "who", "whom", "whose", "when", "where", "why", "how",
    "can", "could", "should", "would", "may", "might", "must", "shall",
    "will", "of", "in", "on", "at", "to", "for", "with", "about", "from",
    "by", "as", "into", "through", "during", "before", "after", "above",
    "below", "between", "without", "within", "upon", "onto", "via",
    "out", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "all", "any", "both", "each", "few",
    "more", "most", "other", "some", "such", "no", "nor", "only",
    "own", "same", "so", "than", "too", "very", "just", "and", "but", "if",
    "or", "because", "while", "also", "this", "that", "these", "those",
    "s", "t", "d", "ll", "m", "re", "ve", "y",
}

# Conversational boilerplate that says nothing about which FAQ is meant.
# Keeping this separate from GRAMMAR_STOPWORDS means phrase matching still
# sees words like "my" and "help" inside keyword phrases, while the
# unsupported-concept check ignores greetings and filler.
CONVERSATIONAL_FILLERS = {
    "hi", "hello", "hey", "greetings", "good", "morning", "afternoon",
    "evening", "night", "please", "pls", "thanks", "thank", "hope",
    "doing", "well", "want", "wanna", "know", "tell", "wonder",
    "wondering", "need", "like", "maybe", "sir", "madam", "ok", "okay",
    "yes", "yeah", "information", "info", "assist", "help", "question",
    "asking", "ask", "curious", "completed", "complete", "finish",
    "finished", "done", "recently", "currently", "excuse", "quick",
    "try", "trying", "tried", "guidance", "something", "wrong",
    "work", "works", "worked", "working", "necessary", "require",
}

# Common paraphrases for the same action. These are canonicalised before
# keyword-coverage and unsupported-concept checks so that, for example,
# "reach support" is understood as "contact support". Only well-known
# synonyms of supported actions belong here - never out-of-scope concepts
# such as fee/cost/cancel.
TOKEN_SYNONYMS = {
    "reach": "contact",
    "locate": "find",
    "acquire": "get",
    "obtain": "get",
    "look": "find",
    "make": "create",
    "begin": "start",
    "see": "view",
    "change": "update",
    "edit": "update",
    "modify": "update",
}


def _stem_token(word):
    """
    Very small, dependency-free normaliser for plural/verb endings.

    It is intentionally conservative: it only exists so that "course" and
    "courses", "job" and "jobs", or "enroll" and "enrolled" are treated as
    the same token by coverage checks. It is not a linguistic stemmer.
    """

    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"

    # "classes" -> "class", "messages" -> "message", but "courses" ->
    # "course" (handled by the generic trailing-s rule below).
    if len(word) > 4 and word.endswith(("sses", "ches", "shes", "xes", "zes")):
        return word[:-2]

    if len(word) > 3 and word.endswith("s") and not word.endswith(
        ("ss", "us", "is")
    ):
        return word[:-1]

    if len(word) > 5 and word.endswith("ing"):
        stem = word[:-3]
        if len(stem) > 2 and stem[-1] == stem[-2]:
            stem = stem[:-1]
        return stem

    if len(word) > 4 and word.endswith("ed"):
        stem = word[:-2]
        if len(stem) > 2 and stem[-1] == stem[-2]:
            stem = stem[:-1]
        return stem

    return word


def tokenize_content(text, remove_fillers=True):
    """
    Return the normalised, stemmed content tokens of ``text``.

    Grammar words (and, by default, conversational fillers) are removed.
    The result is used for keyword-phrase coverage and for detecting
    concepts the FAQ dataset does not contain.
    """

    normalized = preprocess_text(text)
    stopwords = set(GRAMMAR_STOPWORDS)

    if remove_fillers:
        stopwords |= CONVERSATIONAL_FILLERS

    tokens = []

    for word in normalized.split():
        if not word or word in stopwords:
            continue

        token = _stem_token(word)

        # Check fillers against the stem too: "wanted" stems to "want",
        # which is conversational filler even though the inflected word
        # itself is not in the list.
        if token in stopwords:
            continue

        tokens.append(TOKEN_SYNONYMS.get(token, token))

    return tokens


def configure_spellchecker(faqs):
    """
    Add FAQ-specific words to the spellchecker dictionary.

    Loading a word marks it as known, so the spellchecker will neither
    replace it with an incorrect "correction" nor damage already-correct
    domain vocabulary such as archintx, pdf, certificate, opportunities,
    enrollment or password. It also gives the spellchecker better
    candidates when it corrects genuine user typos.
    """

    vocab = set(DOMAIN_TERMS)

    for faq in faqs:
        # Split BOTH the question and every keyword phrase into single
        # words. Keywords such as "job opportunities" must be loaded as
        # "job" and "opportunities"; loading the phrase as one token
        # containing a space would never match a word during correction.
        tokens = faq["question"].split()
        for keyword in faq.get("keywords", []):
            tokens.extend(keyword.split())

        for token in tokens:
            cleaned = token.lower().strip(string.punctuation)
            if cleaned:
                vocab.add(cleaned)

    # Expose the vocabulary to the rest of the engine, then load it into
    # the spellchecker dictionary.
    DOMAIN_VOCABULARY.clear()
    DOMAIN_VOCABULARY.update(vocab)

    spell.word_frequency.load_words(vocab)

    global _FAQ_VOCABULARY_CONFIGURED
    _FAQ_VOCABULARY_CONFIGURED = True


# Phrases that describe a malfunction rather than a request for
# information. If one of these appears, the selected FAQ must actually be
# about troubleshooting; otherwise the honest answer is a clarification
# request, not instructions for an unrelated task.
PROBLEM_PATTERNS = (
    "not working", "not work", "doesnt work", "does not work",
    "isnt working", "stopped working", "broken", "not loading",
    "not opening", "wont open", "will not open", "not showing",
    "not visible", "not available", "error",
)

TROUBLESHOOTING_TERMS = (
    "problem", "issue", "help", "cannot", "unable", "error",
    "technical", "not opening", "not showing", "not working",
    "not available", "not visible",
)


def contains_problem_report(text):
    """True when the question reports something malfunctioning."""

    normalized = preprocess_text(text)
    return any(pattern in normalized for pattern in PROBLEM_PATTERNS)


def faq_handles_problems(faq):
    """True when the FAQ is written as troubleshooting/help content."""

    faq_text = " ".join(
        [faq.get("question", "")]
        + list(faq.get("keywords", []))
    )
    normalized = preprocess_text(faq_text)

    return any(term in normalized for term in TROUBLESHOOTING_TERMS)


# Category anchor nouns. If a question mentions an anchor from a
# different category than the selected FAQ, and that FAQ never mentions
# the anchor itself, the question is mixing intents
# ("a certificate to get a job") and must be clarified instead of
# answered from whichever keyword phrase happened to match.
CATEGORY_ANCHORS = {
    "course": "Courses",
    "certificate": "Certificates",
    "job": "Jobs",
    "account": "Account",
}

# Requirement/policy questions ("do I need...", "can I ... without...").
# These are only treated as ambiguous when they also mention a category
# anchor; otherwise normal requests such as "do I need to reset my
# password" would be misread as policy questions.
POLICY_PATTERNS = (
    re.compile(
        r"\bdo (i|we) need (a |an |the |my |any )?"
        r"(course|certificate|job|account)\b"
    ),
    re.compile(
        r"\bdo (i|we) need .* to "
        r"(get|apply|access|enroll|create|complete|register|find) "
        r".*\b(course|certificate|job|account)\b"
    ),
    re.compile(
        r"\bdo (i|we) have to .* "
        r"(get|apply|access|enroll|create|complete|register|find) "
        r".*\b(course|certificate|job|account)\b"
    ),
    re.compile(
        r"\b(course|certificate|job|account) (is |are )?"
        r"(required|necessary)\b"
    ),
    re.compile(
        r"\bis (a |an |the )?(course|certificate|job|account) "
        r"(required|necessary)\b"
    ),
    re.compile(
        r"\bare (courses|certificates|jobs|accounts) "
        r"(required|necessary)\b"
    ),
    re.compile(
        r"\bwithout (a |an |the |my |any )?"
        r"(course|certificate|job|account)\b"
    ),
)


# Vague words that make a question impossible to map to one FAQ without
# clarification. "help" is only vague when the question contains no
# category anchor ("I need help with my certificate" is specific enough
# to use the certificate FAQ).
ALWAYS_VAGUE = (
    "problem", "issue", "wrong", "something", "broken", "stuck",
    "confused", "not sure", "unsure",
)


def contains_vague_request(text, strong_intent=False):
    """
    True when a question is too vague to select one FAQ.

    ``strong_intent`` means a full FAQ keyword phrase already matched.
    In that case generic words such as "help" or a pronoun do not make
    the request vague ("...I forgot my password, can you help me?" still
    has a clear password intent). Truly vague words such as "problem" or
    "something is wrong" always require clarification.
    """

    normalized = preprocess_text(text)

    if any(term in normalized for term in ALWAYS_VAGUE):
        return True

    if strong_intent:
        return False

    anchors = question_anchors(text)

    if "help" in normalized and not anchors:
        return True

    if re.search(r"\b(it|this|that|them|these|those)\b", normalized) and not anchors:
        return True

    return False


def contains_policy_question(text):
    """True when the question asks whether something is required."""

    normalized = preprocess_text(text)
    return any(pattern.search(normalized) for pattern in POLICY_PATTERNS)


def question_anchors(text):
    """Category anchor tokens present in a question."""

    tokens = set(tokenize_content(text, remove_fillers=True))
    return {
        _stem_token(anchor)
        for anchor in CATEGORY_ANCHORS
        if _stem_token(anchor) in tokens
    }


def faq_tokens(faq):
    """All normalised content tokens used by a FAQ."""

    text = " ".join(
        [faq.get("question", "")]
        + list(faq.get("keywords", []))
    )
    return set(tokenize_content(text, remove_fillers=False))


def has_cross_category_conflict(question, faq):
    """
    True when the question names a category the selected FAQ does not
    mention. Example: a Jobs FAQ selected for "a certificate to get a
    job" never mentions "certificate", so the answer would silently
    ignore half of the question.
    """

    faq_vocab = faq_tokens(faq)
    faq_category = faq.get("category")

    for anchor in question_anchors(question):
        category = CATEGORY_ANCHORS[anchor]

        if category != faq_category and anchor not in faq_vocab:
            return True

    return False


def phrase_coverage(phrase_tokens, query_tokens):
    """
    Fraction of a keyword phrase's content tokens present in the question.

    A value of 1.0 means the question mentions every meaningful word of
    the phrase (in any order), which is strong evidence that the FAQ the
    phrase belongs to is relevant. Partial overlaps are deliberately not
    treated as evidence - "create account" must not match a question
    that only says "create a website".
    """

    if not phrase_tokens:
        return 0.0

    query_tokens = set(query_tokens)
    matched = sum(1 for token in phrase_tokens if token in query_tokens)

    return matched / len(phrase_tokens)


def find_unsupported_terms(text):
    """
    Return content words in ``text`` that no FAQ question or keyword
    contains.

    These are concepts the FAQ dataset simply has no information about
    (for example "fee", "salary", "website" or "python"). Finding one is
    a strong signal that the question is out of scope and should be
    refused instead of being answered from a loosely related FAQ.
    """

    domain_stems = {
        _stem_token(word) for word in DOMAIN_VOCABULARY
    }

    return [
        token
        for token in tokenize_content(text)
        if token not in domain_stems
    ]


def _edit_distance(first, second):
    """
    Levenshtein distance with a small early exit. Used instead of the
    spellchecker's own distance helper, which is not a callable on this
    PySpellChecker version.
    """

    if first == second:
        return 0

    if abs(len(first) - len(second)) > 2:
        return 3

    previous = list(range(len(second) + 1))

    for i, first_char in enumerate(first, start=1):
        current = [i]

        for j, second_char in enumerate(second, start=1):
            insert = current[j - 1] + 1
            delete = previous[j] + 1
            replace = previous[j - 1] + (first_char != second_char)
            current.append(min(insert, delete, replace))

        previous = current

    return previous[-1]


def _correct_towards_domain(word):
    """
    Correct an unknown word ONLY if it is a close misspelling of a word
    that actually appears in the FAQ vocabulary.

    Correcting towards the whole English dictionary is unsafe: it turns
    meaningful out-of-scope words such as "unenroll" into a supported
    word ("enroll") and can therefore create false answers. Restricting
    candidates to the FAQ vocabulary, requiring the same first letter and
    a small edit distance, preserves real typos while leaving genuinely
    unsupported concepts untouched.
    """

    def shared_prefix(candidate):
        length = 0
        for first, second in zip(word, candidate):
            if first != second:
                break
            length += 1
        return length

    best_candidate = None
    best_key = None

    for candidate in sorted(DOMAIN_VOCABULARY):
        if not candidate or candidate[0] != word[0]:
            continue

        if abs(len(candidate) - len(word)) > 2:
            continue

        distance = _edit_distance(word, candidate)

        if distance > 2:
            continue

        # Prefer the smallest edit distance; on ties prefer the candidate
        # that shares the longest prefix. This makes correction
        # deterministic: "acont" becomes "account", not "about".
        key = (distance, -shared_prefix(candidate))

        if best_key is None or key < best_key:
            best_key = key
            best_candidate = candidate

    return best_candidate or word


def preprocess_text(text):
    """
    Normalize text and correct spelling mistakes.

    Lowercases, removes punctuation, collapses whitespace and corrects
    genuine misspellings towards FAQ vocabulary only. Valid English words
    (including out-of-scope concepts such as "fee" or "website") are kept
    unchanged; if no safe correction is found the original word is kept.
    """

    if not isinstance(text, str):
        raise TypeError("Input must be a string.")

    # Convert to lowercase
    text = text.lower()

    # Remove punctuation
    text = text.translate(
        str.maketrans("", "", string.punctuation)
    )

    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Split into individual words
    words = text.split()

    # Correct spelling mistakes
    corrected_words = []

    for word in words:

        if word in spell:
            corrected_words.append(word)
        elif _FAQ_VOCABULARY_CONFIGURED:
            corrected_words.append(_correct_towards_domain(word))
        else:
            # Stand-alone use: behave like the original spellchecker.
            correction = spell.correction(word)
            corrected_words.append(correction if correction else word)

    return " ".join(corrected_words)
