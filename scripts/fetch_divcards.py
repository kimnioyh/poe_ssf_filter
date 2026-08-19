"""One-time: scrape the full divination-card list (EN + KO) from poedb's
index pages and write src/data/div-cards.json as {en_name: ko_name}.

EN names come from /us/Divination_Cards (exact in-game BaseType, used in the
filter); KO names from /kr/Divination_Cards, joined on the URL slug. Card rows
are identified by a `DivinationCards` marker in the icon anchor's data-hover.

Usage: python scripts/fetch_divcards.py   (run once, commit the JSON)
"""
import json, re, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (poe-ssf-filter data build; one-time)"}


def fetch(loc):
    req = urllib.request.Request(f"https://poedb.tw/{loc}/Divination_Cards", headers=UA)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def text_names(html):
    d = {}
    for slug, name in re.findall(r'href="([A-Za-z0-9_%\']+)">([^<]+)</a>', html):
        d.setdefault(slug, name.strip())
    return d


def main():
    us, kr = fetch("us"), fetch("kr")
    card_slugs = set(re.findall(r'data-hover="[^"]*DivinationCards[^"]*"[^>]*href="([^"]+)"', us))
    en_all, ko_all = text_names(us), text_names(kr)
    out = {}
    for slug in sorted(card_slugs):
        en = en_all.get(slug)
        if not en:  # non-card rows (Stacked Deck, etc.) have no text anchor
            continue
        ko = ko_all.get(slug)
        out[en] = ko if (ko and re.search(r"[가-힣]", ko)) else en
    json.dump(out, open("src/data/div-cards.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2, sort_keys=True)
    print(f"wrote {len(out)} cards")


if __name__ == "__main__":
    main()
