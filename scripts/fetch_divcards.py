"""One-time: scrape the divination-card list (EN + KO name, stack size, reward
item + rarity + influence variant) from poedb's index pages and write
src/data/div-cards.json as a list of {en, ko, stack, cls, reward, rewardKo}.

Names/rewards come from /us/Divination_Cards (EN, exact in-game BaseType used in
the filter) joined on the URL slug with /kr/Divination_Cards (KO). Card rows are
identified by a `DivinationCards` marker in the icon anchor's data-hover.

`cls` is the reward item's rarity span class (uniqueitem/currencyitem/…), a rough
value hint in the UI — NOT a market price. `reward` is the reward item name with
its influence/variant prefixed (e.g. "Shaper Shield"): the variant comes from a
`<span class="default">…Item</span>` qualifier (labels ending in ':' are skipped).
Disabled (removed-from-game) cards are dropped entirely.

Usage: python scripts/fetch_divcards.py   (run once, commit the JSON)
"""
import json, re, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (poe-ssf-filter data build; one-time)"}
STACK = re.compile(r"<span class='colourDefault'>\s*\d+\s*/\s*(\d+)")
RARITY = "uniqueitem|currencyitem|rareitem|magicitem|gemitem|whiteitem|divination|prophecyitem"
ITEM = re.compile(r'<span class="(%s)">([^<]+)</span>' % RARITY)
DEFSPAN = re.compile(r'<span class="default">([^<]+)</span>')
DISABLED = re.compile(r'<div class="explicitMod">Disabled</div>')


def fetch(loc):
    req = urllib.request.Request(f"https://poedb.tw/{loc}/Divination_Cards", headers=UA)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def text_names(html):
    d = {}
    for slug, name in re.findall(r'href="([A-Za-z0-9_%\']+)">([^<]+)</a>', html):
        d.setdefault(slug, name.strip())
    return d


def blocks(html, card_slugs):
    """slug -> (full-window, explicitMod-inner-html) for each card."""
    d = {}
    for m in re.finditer(r'href="([A-Za-z0-9_%\']+)">[^<]+</a><div>', html):
        slug = m.group(1)
        if slug not in card_slugs or slug in d:
            continue
        win = html[m.start():m.start() + 700]
        ex = re.search(r'<div class="explicitMod">(.*?)</div>', win, re.S)
        d[slug] = (win, ex.group(1) if ex else "")
    return d


def reward_of(ex, item_suffix):
    """(rarity-class, 'Variant Item Name') from an explicitMod block."""
    it = ITEM.search(ex)
    if not it:
        return "", ""
    name = it.group(2).strip()
    variant = ""
    for t in DEFSPAN.findall(ex):
        t = t.strip()
        if t and not t.endswith(":"):  # skip labels like "Item Level:"
            variant = re.sub(re.escape(item_suffix) + r"$", "", t).strip()
            break
    return it.group(1), (f"{variant} {name}" if variant else name)


def main():
    us, kr = fetch("us"), fetch("kr")
    card_slugs = set(re.findall(r'data-hover="[^"]*DivinationCards[^"]*"[^>]*href="([^"]+)"', us))
    en_name, ko_name = text_names(us), text_names(kr)
    us_b, kr_b = blocks(us, card_slugs), blocks(kr, card_slugs)
    out, dropped = [], 0
    for slug in sorted(card_slugs):
        en = en_name.get(slug)
        if not en:  # non-card rows (Stacked Deck, etc.) have no text anchor
            continue
        win, ex = us_b.get(slug, ("", ""))
        if DISABLED.search(win):  # removed-from-game card — never drops
            dropped += 1
            continue
        cls, reward = reward_of(ex, " Item")
        _, reward_ko = reward_of(kr_b.get(slug, ("", ""))[1], " 아이템")
        st = STACK.search(win)
        out.append({"en": en, "ko": ko_name.get(slug, en),
                    "stack": int(st.group(1)) if st else None,
                    "cls": cls, "reward": reward, "rewardKo": reward_ko or reward})
    json.dump(out, open("src/data/div-cards.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"wrote {len(out)} cards (dropped {dropped} disabled)")


if __name__ == "__main__":
    main()
