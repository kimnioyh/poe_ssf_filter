"""One-time: scrape the divination-card list (EN + KO name, stack size, reward
item + rarity) from poedb's index pages and write src/data/div-cards.json as a
list of {en, ko, stack, cls, reward, rewardKo}.

Names/rewards come from /us/Divination_Cards (EN, exact in-game BaseType used in
the filter) joined on the URL slug with /kr/Divination_Cards (KO). Card rows are
identified by a `DivinationCards` marker in the icon anchor's data-hover. `cls`
is poedb's reward rarity span class (uniqueitem/currencyitem/…), used only as a
rough value hint in the UI — NOT a market price.

Usage: python scripts/fetch_divcards.py   (run once, commit the JSON)
"""
import json, re, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (poe-ssf-filter data build; one-time)"}
STACK = re.compile(r"<span class='colourDefault'>\s*\d+\s*/\s*(\d+)")
REWARD = re.compile(r'<div class="explicitMod"><span class="([^"]+)">([^<]*)</span>')


def fetch(loc):
    req = urllib.request.Request(f"https://poedb.tw/{loc}/Divination_Cards", headers=UA)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def text_names(html):
    d = {}
    for slug, name in re.findall(r'href="([A-Za-z0-9_%\']+)">([^<]+)</a>', html):
        d.setdefault(slug, name.strip())
    return d


def windows(html, card_slugs):
    """slug -> (stack, reward-rarity-class, reward-text) from the card's own block."""
    d = {}
    for m in re.finditer(r'href="([A-Za-z0-9_%\']+)">[^<]+</a><div>', html):
        slug = m.group(1)
        if slug not in card_slugs or slug in d:
            continue
        win = html[m.start():m.start() + 500]
        st, rw = STACK.search(win), REWARD.search(win)
        d[slug] = (int(st.group(1)) if st else None,
                   rw.group(1) if rw else "", rw.group(2).strip() if rw else "")
    return d


def main():
    us, kr = fetch("us"), fetch("kr")
    card_slugs = set(re.findall(r'data-hover="[^"]*DivinationCards[^"]*"[^>]*href="([^"]+)"', us))
    en_name, ko_name = text_names(us), text_names(kr)
    us_w, kr_w = windows(us, card_slugs), windows(kr, card_slugs)
    out = []
    for slug in sorted(card_slugs):
        en = en_name.get(slug)
        if not en:  # non-card rows (Stacked Deck, etc.) have no text anchor
            continue
        stack, cls, reward = us_w.get(slug, (None, "", ""))
        reward_ko = kr_w.get(slug, (None, "", ""))[2]
        out.append({"en": en, "ko": ko_name.get(slug, en), "stack": stack,
                    "cls": cls, "reward": reward, "rewardKo": reward_ko or reward})
    json.dump(out, open("src/data/div-cards.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"wrote {len(out)} cards")


if __name__ == "__main__":
    main()
