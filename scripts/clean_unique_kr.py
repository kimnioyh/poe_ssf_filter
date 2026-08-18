"""Post-process: poedb /kr/ og:title often appends the base name to the unique
name (e.g. "아라쿠 티키 산호 목걸이"). Strip the trailing KO base name using
base_translations.json + the unique's base(s) from uniques.csv.

Run once after fetch: python scripts/clean_unique_kr.py
"""
import csv, json

tr = json.load(open("src/data/unique-translations.json", encoding="utf-8"))
base_ko = json.load(open("src/data/base_translations.json", encoding="utf-8"))

name2bases: dict[str, set[str]] = {}
for r in csv.DictReader(open("uniques.csv", encoding="utf-8")):
    name2bases.setdefault(r["name"], set()).add(r["baseItem"])

stripped = 0
for name, ko in list(tr.items()):
    for b in name2bases.get(name, ()):
        kb = base_ko.get(b)
        if kb and ko.endswith(kb) and ko != kb:
            cleaned = ko[: -len(kb)].rstrip()
            if cleaned:
                tr[name] = cleaned
                stripped += 1
            break

json.dump(dict(sorted(tr.items())),
          open("src/data/unique-translations.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print(f"stripped base suffix from {stripped} names / {len(tr)} total")
