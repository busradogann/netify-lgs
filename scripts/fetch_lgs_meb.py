#!/usr/bin/env python3
"""
LGS Taban Puanları Veri Çekici (2023-2026)

Kaynak: basarisiralamalari.com (MEB verilerini derleyen güvenilir kaynak)
Doğrulama: İstanbul MEB API (istanbul.meb.gov.tr) ile cross-check edildi.

Kullanım:
  export NEXT_PUBLIC_SUPABASE_URL=...
  export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  python3 scripts/fetch_lgs_meb.py [--dry-run] [--province adana]
"""

import sys
sys.path.insert(0, '/Users/busradogan/Library/Python/3.9/lib/python/site-packages')

import requests
from bs4 import BeautifulSoup
from supabase import create_client
import json
import os
import re
import time
import argparse

BASE_URL = "https://www.basarisiralamalari.com"

SCHOOL_TYPE_MAP = {
    "fen lisesi": "fen",
    "fen bilimleri": "fen",
    "sosyal bilimler": "sosyal",
    "imam hatip": "imam_hatip",
    "mesleki ve teknik": "meslek",
    "anadolu teknik": "meslek",
    "çok programlı": "meslek",
    "anadolu lisesi": "anadolu",
    "anadolu": "anadolu",
}

# Adana sample showed this mapping works
CITY_NAME_MAP = {
    "ADANA": "Adana", "ADIYAMAN": "Adıyaman", "AFYONKARAHİSAR": "Afyonkarahisar",
    "AĞRI": "Ağrı", "AKSARAY": "Aksaray", "AMASYA": "Amasya", "ANKARA": "Ankara",
    "ANTALYA": "Antalya", "ARDAHAN": "Ardahan", "ARTVİN": "Artvin", "AYDIN": "Aydın",
    "BALIKESİR": "Balıkesir", "BARTIN": "Bartın", "BATMAN": "Batman", "BAYBURT": "Bayburt",
    "BİLECİK": "Bilecik", "BİNGÖL": "Bingöl", "BİTLİS": "Bitlis", "BOLU": "Bolu",
    "BURDUR": "Burdur", "BURSA": "Bursa", "ÇANAKKALE": "Çanakkale", "ÇANKIRI": "Çankırı",
    "ÇORUM": "Çorum", "DENİZLİ": "Denizli", "DİYARBAKIR": "Diyarbakır", "DÜZCE": "Düzce",
    "EDİRNE": "Edirne", "ELAZIĞ": "Elazığ", "ERZİNCAN": "Erzincan", "ERZURUM": "Erzurum",
    "ESKİŞEHİR": "Eskişehir", "GAZİANTEP": "Gaziantep", "GİRESUN": "Giresun",
    "GÜMÜŞHANE": "Gümüşhane", "HAKKARİ": "Hakkari", "HATAY": "Hatay", "IĞDIR": "Iğdır",
    "ISPARTA": "Isparta", "İSTANBUL": "İstanbul", "İZMİR": "İzmir",
    "KAHRAMANMARAŞ": "Kahramanmaraş", "KARABÜK": "Karabük", "KARAMAN": "Karaman",
    "KARS": "Kars", "KASTAMONU": "Kastamonu", "KAYSERİ": "Kayseri",
    "KIRIKKALE": "Kırıkkale", "KIRKLARELİ": "Kırklareli", "KIRŞEHİR": "Kırşehir",
    "KİLİS": "Kilis", "KOCAELİ": "Kocaeli", "KONYA": "Konya", "KÜTAHYA": "Kütahya",
    "MALATYA": "Malatya", "MANİSA": "Manisa", "MARDİN": "Mardin", "MERSİN": "Mersin",
    "MUĞLA": "Muğla", "MUŞ": "Muş", "NEVŞEHİR": "Nevşehir", "NİĞDE": "Niğde",
    "ORDU": "Ordu", "OSMANİYE": "Osmaniye", "RİZE": "Rize", "SAKARYA": "Sakarya",
    "SAMSUN": "Samsun", "SİİRT": "Siirt", "SİNOP": "Sinop", "SİVAS": "Sivas",
    "ŞANLIURFA": "Şanlıurfa", "ŞIRNAK": "Şırnak", "TEKİRDAĞ": "Tekirdağ",
    "TOKAT": "Tokat", "TRABZON": "Trabzon", "TUNCELİ": "Tunceli", "UŞAK": "Uşak",
    "VAN": "Van", "YALOVA": "Yalova", "YOZGAT": "Yozgat", "ZONGULDAK": "Zonguldak",
}


def classify_school_type(name_parts: list[str]) -> str:
    combined = " ".join(name_parts).lower()
    for pattern, stype in SCHOOL_TYPE_MAP.items():
        if pattern in combined:
            return stype
    return "anadolu"


def parse_province_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        return []

    tbody = table.find("tbody")
    if not tbody:
        return []

    rows = tbody.find_all("tr")
    results = []

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 6:
            continue

        name_text = cells[0].get_text(strip=True)
        duration = cells[1].get_text(strip=True)
        years_text = cells[2].get_text(separator=" ", strip=True)
        quotas_text = cells[3].get_text(separator=" ", strip=True)
        scores_text = cells[4].get_text(separator=" ", strip=True)
        percentiles_text = cells[5].get_text(separator=" ", strip=True)

        # Parse name: "İL / İLÇE / Okul Adı / Program / Tür / Dil"
        parts = [p.strip() for p in name_text.split("/")]
        if len(parts) < 3:
            continue

        city_raw = parts[0].strip()
        district = parts[1].strip()
        school_name = parts[2].strip()
        program = parts[3].strip() if len(parts) > 3 else None
        school_type_hint = parts[4].strip() if len(parts) > 4 else ""
        language = parts[5].strip() if len(parts) > 5 else None

        city = CITY_NAME_MAP.get(city_raw, city_raw.title())
        school_type = classify_school_type(parts[2:])

        # Parse multi-year data
        years = re.findall(r"\d{4}", years_text)
        quotas = re.findall(r"[\d.]+", quotas_text.replace(".", ""))
        scores = re.findall(r"\d+[.,]\d+", scores_text)
        percentiles = re.findall(r"\d+[.,]\d+", percentiles_text)

        for i, year in enumerate(years):
            year_int = int(year)
            if year_int < 2023 or year_int > 2026:
                continue

            quota = int(quotas[i]) if i < len(quotas) else None
            score = (
                float(scores[i].replace(",", ".")) if i < len(scores) else None
            )
            percentile = (
                float(percentiles[i].replace(",", "."))
                if i < len(percentiles)
                else None
            )

            if score is None or score == 0:
                continue

            results.append(
                {
                    "city": city,
                    "district": district.title(),
                    "name": school_name,
                    "program": program,
                    "type": school_type,
                    "language": language,
                    "duration": duration,
                    "year": year_int,
                    "quota": quota,
                    "min_score": score,
                    "min_percentile": percentile,
                }
            )

    return results


def fetch_province_list() -> list[dict]:
    url_file = os.path.join(os.path.dirname(__file__), "province_urls.json")
    if os.path.exists(url_file):
        with open(url_file) as f:
            return json.load(f)

    resp = requests.get(f"{BASE_URL}/lise-taban-puanlari-ve-yuzdelik-dilimleri-lgs-meb/")
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    provinces = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "-liseleri-taban-puanlari" in href:
            slug = href.rstrip("/").split("/")[-1].replace("-liseleri-taban-puanlari", "")
            if slug not in seen:
                seen.add(slug)
                provinces.append({"slug": slug, "url": href})

    with open(url_file, "w") as f:
        json.dump(provinces, f, indent=2, ensure_ascii=False)

    return provinces


def fetch_all_data(province_filter=None) -> list[dict]:
    provinces = fetch_province_list()
    all_data = []

    if province_filter:
        provinces = [p for p in provinces if p["slug"] == province_filter]
        if not provinces:
            print(f"Province '{province_filter}' not found")
            return []

    for i, prov in enumerate(provinces):
        slug = prov["slug"]
        url = prov["url"]
        if not url.startswith("http"):
            url = BASE_URL + url

        print(f"[{i+1}/{len(provinces)}] {slug}...", end=" ", flush=True)

        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            print(f"ERROR: {e}")
            continue

        schools = parse_province_page(resp.text)
        all_data.extend(schools)
        print(f"{len(schools)} kayıt")

        if i < len(provinces) - 1:
            time.sleep(0.5)

    return all_data


def write_to_supabase(data: list[dict]):
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required")
        print("Run: source .env.local && python3 scripts/fetch_lgs_meb.py")
        sys.exit(1)

    supabase = create_client(url, key)

    # Group by unique school+program combination
    school_map = {}
    for row in data:
        key_str = f"{row['name']}||{row['city']}||{row['district']}||{row['program']}"
        if key_str not in school_map:
            school_map[key_str] = {
                "name": row["name"],
                "type": row["type"],
                "city": row["city"],
                "district": row["district"],
                "program": row["program"],
                "language": row["language"],
            }

    print(f"\nInserting {len(school_map)} schools...")
    school_list = list(school_map.values())
    inserted_schools = []
    batch_size = 100

    for i in range(0, len(school_list), batch_size):
        batch = school_list[i : i + batch_size]
        result = supabase.table("schools").insert(batch).execute()
        inserted_schools.extend(result.data)
        print(f"\r  Schools: {len(inserted_schools)}/{len(school_list)}", end="", flush=True)
    print()

    # Build ID lookup
    id_map = {}
    for s in inserted_schools:
        id_map[f"{s['name']}||{s['city']}||{s['district']}||{s['program']}"] = s["id"]

    # Build placement scores
    placements = []
    for row in data:
        school_id = id_map.get(f"{row['name']}||{row['city']}||{row['district']}||{row['program']}")
        if not school_id:
            continue
        placements.append(
            {
                "school_id": school_id,
                "year": row["year"],
                "quota": row["quota"],
                "placed": row["quota"],
                "min_score": row["min_score"],
                "min_ranking": None,
                "max_ranking": None,
            }
        )

    print(f"Inserting {len(placements)} placement scores...")
    inserted_count = 0
    for i in range(0, len(placements), batch_size):
        batch = placements[i : i + batch_size]
        supabase.table("placement_scores").insert(batch).execute()
        inserted_count += len(batch)
        print(f"\r  Scores: {inserted_count}/{len(placements)}", end="", flush=True)
    print()

    print(f"\nDone! {len(inserted_schools)} schools, {inserted_count} placement scores")


def main():
    parser = argparse.ArgumentParser(description="LGS taban puanları çekici")
    parser.add_argument("--dry-run", action="store_true", help="Sadece veriyi çek, DB'ye yazma")
    parser.add_argument("--province", type=str, help="Tek il çek (slug: istanbul, ankara vb.)")
    parser.add_argument("--output", type=str, default="scripts/lgs_all_data.json", help="JSON çıktı dosyası")
    args = parser.parse_args()

    print("=== LGS Taban Puanları Veri Çekici ===")
    print(f"Kaynak: basarisiralamalari.com (MEB verilerini derler)")
    print(f"Yıllar: 2023-2026 | Kapsam: 81 il\n")

    data = fetch_all_data(province_filter=args.province)

    if not data:
        print("No data fetched!")
        return

    # Stats
    years = {}
    cities = set()
    for row in data:
        years[row["year"]] = years.get(row["year"], 0) + 1
        cities.add(row["city"])

    print(f"\n=== İSTATİSTİKLER ===")
    print(f"Toplam kayıt: {len(data)}")
    print(f"İl sayısı: {len(cities)}")
    for y in sorted(years.keys()):
        print(f"  {y}: {years[y]} program")

    # Save JSON
    output_path = os.path.join(os.path.dirname(__file__), "..", args.output)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nJSON kaydedildi: {args.output}")

    if args.dry_run:
        print("\n--dry-run: DB'ye yazılmadı")
        return

    write_to_supabase(data)


if __name__ == "__main__":
    main()
