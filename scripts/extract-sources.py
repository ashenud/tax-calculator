#!/usr/bin/env python3
"""Extract text from the primary-source PDFs in docs/sources/ into docs/sources/text/.

WHY THIS EXISTS: `tax-rule-verifier` works with Read and Grep. Without a text form
of the acts it cannot search them, and a verifier that cannot search the legislation
is decorative.

WHY pdfplumber AND NOT A HAND-ROLLED EXTRACTOR: the first version of this script was
dependency-free, parsing FlateDecode streams with zlib and pulling literal `( )`
strings. It silently dropped roughly a third of the Inland Revenue (Amendment) Act
No. 2 of 2025 — including, precisely, First Schedule paragraph 1 subparagraph (6),
the provision that sets the 15% maximum rate for individuals. The text it produced
read fluently and gave no sign anything was missing.

That is the failure mode to design against here. A lossy extractor does not announce
itself; it hands you a plausible half of a statute. Use a real PDF library.

THE PDF REMAINS AUTHORITATIVE. Even pdfplumber loses table geometry and ligatures.
Locate a provision in the text; read it in the PDF before quoting it as evidence.
See docs/sources/README.md.

Usage:
    python3 scripts/extract-sources.py            extract all
    python3 scripts/extract-sources.py --check    verify text present; exit 1 if not

Requires: pdfplumber  (pip install pdfplumber)
"""

import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit(
        "pdfplumber is not installed.\n"
        "  pip install pdfplumber\n"
        "Do not fall back to a hand-rolled extractor — see this file's docstring."
    )

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "docs" / "sources"
OUT_DIR = SRC_DIR / "text"

# Below this many characters per page, assume the page is a scan needing OCR.
MIN_CHARS_PER_PAGE = 200

HEADER = (
    "# Extracted from {pdf} with pdfplumber\n"
    "# NOT AUTHORITATIVE — the PDF is. Extraction loses table geometry and ligatures;\n"
    "# verify any quote against the PDF before relying on it.\n"
    "# Page markers below are load-bearing: cite the page you actually read.\n"
    "# Regenerate: python3 scripts/extract-sources.py\n\n"
)


def extract(path: Path) -> tuple[str, int, int]:
    """Return (text, page_count, pages_with_text).

    Uses layout=True so that statutory tables — rate ladders especially — keep
    enough column structure to be read rather than collapsing into a run-on line.
    Pages are marked so a citation can name the page it came from.
    """
    parts: list[str] = []
    pages_with_text = 0

    with pdfplumber.open(path) as pdf:
        page_count = len(pdf.pages)
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text(layout=True) or ""
            if len(text.strip()) >= MIN_CHARS_PER_PAGE:
                pages_with_text += 1
            parts.append(f"\n\n===== page {i} =====\n{text}")

    return "".join(parts), page_count, pages_with_text


def main() -> int:
    check = "--check" in sys.argv

    if not SRC_DIR.is_dir():
        print(f"No {SRC_DIR} — nothing to extract.")
        return 0

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pdfs = sorted(SRC_DIR.glob("*.pdf"))
    if not pdfs:
        print("No PDFs in docs/sources/.")
        return 0

    failed = 0
    print()

    for pdf_path in pdfs:
        out_path = OUT_DIR / f"{pdf_path.stem}.txt"
        try:
            text, pages, with_text = extract(pdf_path)
        except Exception as exc:  # noqa: BLE001 - report and continue
            print(f"  ERROR        {pdf_path.name}: {exc}")
            failed += 1
            continue

        scanned = pages > 0 and with_text < pages / 2

        if not check:
            out_path.write_text(HEADER.format(pdf=pdf_path.name) + text + "\n")

        status = "SCANNED?" if scanned else "ok      "
        print(
            f"  {status}     {pdf_path.name}  "
            f"({pages} pages, {with_text} with text, {len(text):,} chars)"
        )

        if scanned:
            print(
                "               most pages carry no extractable text — this is a scan "
                "and needs OCR before it can be cited"
            )
        if check and not out_path.exists():
            print(f"  MISSING      {pdf_path.name} — run without --check")
            failed += 1

    print(f"\n  {len(pdfs) - failed}/{len(pdfs)} processed into docs/sources/text/\n")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
