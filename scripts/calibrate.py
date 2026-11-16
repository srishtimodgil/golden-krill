#!/usr/bin/env python3
"""
Rarity sanity check using wordfreq's Zipf frequency (≈ log10 of uses per billion words).

Flags answers whose tier looks off:
  * "too common for its tier":  rated Rare / Deep Cut / Golden Krill but very frequent in English
  * "too rare for Plankton":    rated Plankton but barely used in English

wordfreq is only a hint. It knows words, not trivia: multi-word names and proper nouns
are scored by their rarest word, and many valid answers are common words used
in another sense (e.g. "Swiss", "Jack"). Review the list by hand; never auto-retier.

Usage:
  python3 -m venv .venv && .venv/bin/pip install wordfreq
  .venv/bin/python scripts/calibrate.py                 # whole bank
  .venv/bin/python scripts/calibrate.py data/batches/b01 # only some batch files
  .venv/bin/python scripts/calibrate.py --csv > flags.csv
"""
import json
import sys
import unicodedata
from pathlib import Path

try:
    from wordfreq import zipf_frequency
except ImportError:
    sys.exit("wordfreq missing. Run:  python3 -m venv .venv && .venv/bin/pip install wordfreq")

# Thresholds (Zipf): 7 = "the", 5 = "coffee", 4 = "espresso", 3 = "ramekin", 2 = "spurtle"
COMMON_FOR_RARE = 4.6       # Rare+ answers above this look suspiciously common
COMMON_FOR_DEEP = 4.0       # Deep Cut / Golden Krill above this look suspiciously common
RARE_FOR_PLANKTON = 2.6     # Plankton answers below this look suspiciously obscure


def plain(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def zipf(text: str) -> float:
    """Phrase frequency ≈ its rarest word (wordfreq has no phrase stats)."""
    words = [w for w in plain(text).replace("-", " ").split() if w.isalpha() and len(w) > 1]
    if not words:
        return 0.0
    whole = zipf_frequency(plain(text), "en")
    rarest = min(zipf_frequency(w, "en") for w in words)
    return max(whole, rarest) if len(words) == 1 else rarest


def load(paths):
    files = []
    for p in paths:
        p = Path(p)
        files += sorted(p.rglob("*.json")) if p.is_dir() else [p]
    for f in files:
        data = json.loads(f.read_text())
        for prompt in data if isinstance(data, list) else []:
            yield prompt


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    as_csv = "--csv" in sys.argv
    flags = []
    for p in load(args or ["data/questions.json"]):
        for a in p["answers"]:
            z = zipf(a["text"])
            t = a["tier"]
            why = None
            many_words = len(a["text"].split()) >= 3  # titles/names of common words: wordfreq can't judge
            if many_words and t != "Plankton":
                continue
            if t in ("Deep Cut", "Golden Krill") and z >= COMMON_FOR_DEEP:
                why = "too common for its tier"
            elif t == "Rare" and z >= COMMON_FOR_RARE:
                why = "too common for its tier"
            elif t == "Plankton" and 0 < z < RARE_FOR_PLANKTON:
                why = "too rare for Plankton"
            if why:
                flags.append((p["id"], a["text"], t, round(z, 2), why))

    if as_csv:
        print("prompt,answer,tier,zipf,flag")
        for f in flags:
            print(",".join(f'"{x}"' if isinstance(x, str) else str(x) for x in f))
        return
    print(f"{len(flags)} answer(s) flagged for review\n")
    cur = None
    for pid, text, tier, z, why in flags:
        if pid != cur:
            print(f"\n[{pid}]")
            cur = pid
        print(f"  {text:<34} {tier:<13} zipf {z:<5} {why}")


if __name__ == "__main__":
    main()
