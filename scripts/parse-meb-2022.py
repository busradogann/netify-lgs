#!/usr/bin/env python3
"""Parse 2022 MEB LGS PDF and output JSON matching scrape-schools.mjs format."""
import sys
sys.path.insert(0, '/Users/busradogan/Library/Python/3.9/lib/python/site-packages')

import pdfplumber
import json
import re
import os

PDF_PATH = os.path.join(
    os.path.expanduser("~"),
    ".claude/projects/-Users-busradogan-repos-netify-lgs/"
    "5e90d5a1-cfef-435e-b7b7-c80409eefad8/tool-results/"
    "webfetch-1792587306101-iy0lrr.pdf"
)

OUT_PATH = os.path.join(os.path.dirname(__file__), "schools-2022.json")


def classify_type(type_str):
    t = type_str.lower()
    if "fen lisesi" in t:
        return "fen"
    if "sosyal bilimler" in t:
        return "sosyal"
    if "imam hatip" in t:
        return "imam_hatip"
    if "mesleki" in t or "teknik" in t or "meslek lisesi" in t:
        return "meslek"
    return "anadolu"


def parse_line(line):
    """Parse a data line from MEB PDF.
    Format: TERCIH_KODU IL ILCE OKUL_ADI TURU ALAN YABANCI_DILI TABAN_PUAN TABAN_YUZDE TAVAN_PUAN TAVAN_YUZDE
    """
    # Try to match the pattern: starts with a number (tercih kodu)
    m = re.match(r'^(\d+)\s+(.+)$', line.strip())
    if not m:
        return None

    rest = m.group(2)

    # Find score patterns at the end (numbers with comma as decimal)
    score_pattern = r'(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)$'
    sm = re.search(score_pattern, rest)
    if not sm:
        return None

    scores_start = sm.start()
    text_part = rest[:scores_start].strip()

    taban = float(sm.group(1).replace(',', '.'))
    taban_yuzde = float(sm.group(2).replace(',', '.'))
    tavan = float(sm.group(3).replace(',', '.'))
    tavan_yuzde = float(sm.group(4).replace(',', '.'))

    # Extract language (last word before scores)
    lang_pattern = r'(İngilizce|Almanca|Fransızca|Arapça)\s*$'
    lang_m = re.search(lang_pattern, text_part)
    language = lang_m.group(1) if lang_m else None
    if lang_m:
        text_part = text_part[:lang_m.start()].strip()

    # Now text_part should be: IL ILCE OKUL_ADI TURU ALAN
    # Split by known types
    type_patterns = [
        'Fen Lisesi',
        'Hazırlık Sınıfı Bulunan Sosyal Bilimler Lisesi',
        'Hazırlık Sınıfı Bulunmayan Sosyal Bilimler Lisesi',
        'Anadolu Lisesi',
        'Anadolu İmam Hatip Lisesi',
        'Hazırlık Sınıfı Bulunan Anadolu Lisesi',
        'Mesleki ve Teknik Anadolu Lisesi',
    ]

    school_type = None
    school_type_start = -1
    for tp in type_patterns:
        idx = text_part.find(tp)
        if idx != -1:
            school_type = tp
            school_type_start = idx
            break

    if school_type is None:
        return None

    location_and_name = text_part[:school_type_start].strip()
    program_area = text_part[school_type_start + len(school_type):].strip()

    # First two words are typically IL and ILCE
    words = location_and_name.split()
    if len(words) < 3:
        return None

    # IL is usually uppercase, find where city/district ends and name starts
    # Simple heuristic: first word is city, second is district, rest is name
    # But cities can be multi-word (e.g. AFYONKARAHİSAR)
    city = words[0]
    district = words[1]
    name = ' '.join(words[2:])

    return {
        "name": name,
        "program": school_type + (' ' + program_area if program_area else ''),
        "type": classify_type(school_type),
        "language": language,
        "city": city.title(),
        "district": district.title(),
        "quota": None,
        "score2022": taban,
        "tavan2022": tavan,
        "yuzde2022": taban_yuzde,
    }


def main():
    print(f"Opening {PDF_PATH}...")
    pdf = pdfplumber.open(PDF_PATH)
    print(f"Pages: {len(pdf.pages)}")

    all_rows = []
    errors = 0

    for page_num, page in enumerate(pdf.pages):
        text = page.extract_text()
        if not text:
            continue
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            # Skip header lines
            if any(h in line for h in ['TERCİH', 'TABAN', 'İL ', 'KODU', 'YÜZDELİK', 'Yılı']):
                continue
            parsed = parse_line(line)
            if parsed:
                all_rows.append(parsed)
            else:
                if line[0].isdigit():
                    errors += 1

    pdf.close()

    print(f"Parsed: {len(all_rows)} rows, {errors} unparsed lines")

    # Show some stats
    cities = set(r['city'] for r in all_rows)
    types = {}
    for r in all_rows:
        types[r['type']] = types.get(r['type'], 0) + 1
    print(f"Cities: {len(cities)}")
    print(f"Types: {types}")
    print(f"Sample: {all_rows[:3]}")

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_rows, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUT_PATH}")


if __name__ == '__main__':
    main()
