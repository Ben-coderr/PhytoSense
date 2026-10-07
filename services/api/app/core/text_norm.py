import re
import unicodedata

# Arabic unicode ranges for diacritics (tashkeel)
ARABIC_DIACRITICS = re.compile(r"[\u064B-\u065F\u0670\u06D6-\u06ED]")
# Tatweel (kashida)
ARABIC_TATWEEL = re.compile(r"\u0640")

def normalize_arabic(text: str) -> str:
    """
    Standardizes Arabic text for tolerant search and indexing:
    - Strips tashkeel (diacritics) and tatweel (kashida)
    - Normalizes alef forms: أ, إ, آ, ٱ -> ا
    - Normalizes alef maqsura: ى -> ي
    - Normalizes ta marbuta: ة -> ه
    """
    if not text:
        return ""

    # Remove diacritics and tatweel
    text = ARABIC_DIACRITICS.sub("", text)
    text = ARABIC_TATWEEL.sub("", text)

    # Normalize alef variants
    text = re.sub(r"[إأآٱ]", "ا", text)
    # Normalize alef maqsura to ya
    text = re.sub(r"ى", "ي", text)
    # Normalize ta marbuta to ha
    text = re.sub(r"ة", "ه", text)

    return text.strip().lower()

def normalize_latin(text: str) -> str:
    """
    Standardizes French and Latin botanical names:
    - Strips accents (diacritics)
    - Lowercases and trims
    """
    if not text:
        return ""

    # Normalize unicode to NFD and strip combining accents
    nfd = unicodedata.normalize("NFD", text)
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    # Clean redundant punctuation/quotes
    cleaned = re.sub(r"[\"\'\(\)\/\-\_]", " ", stripped)
    return " ".join(cleaned.split()).lower()

def normalize_query(text: str) -> str:
    """Detects whether text has Arabic characters and normalizes appropriately."""
    if not text:
        return ""
    # Check if string contains Arabic characters
    if re.search(r"[\u0600-\u06FF]", text):
        return normalize_arabic(text)
    return normalize_latin(text)
