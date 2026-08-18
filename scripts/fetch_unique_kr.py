"""One-time: from each unique's poedbUrl (already in uniques.csv), scrape the
Korean name (og:title) AND item image (og:image) from poedb /kr/.

Outputs:
  src/data/unique-translations.json   {en_name: ko_name}
  src/data/unique-images.json         {en_name: "img/uniques/<slug>.webp"}
  public/img/uniques/<slug>.webp      downloaded item art

Usage: python scripts/fetch_unique_kr.py [limit]
Politeness: capped concurrency + small delay. Run once, commit outputs.
"""
import csv, json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

OG_TITLE = re.compile(r'<meta property="og:title" content="([^"]+)"')
OG_IMAGE = re.compile(r'<meta property="og:image" content="([^"]+)"')
UA = {"User-Agent": "Mozilla/5.0 (poe-ssf-filter data build; one-time)"}
IMG_DIR = "public/img/uniques"

def get(url, binary=False, timeout=20):
    req = urllib.request.Request(url, headers=UA)
    data = urllib.request.urlopen(req, timeout=timeout).read()
    return data if binary else data.decode("utf-8", "replace")

def scrape(en_name, us_url):
    kr_url = us_url.replace("/us/", "/kr/")
    slug = us_url.rstrip("/").split("/")[-1]
    for attempt in range(3):
        try:
            html = get(kr_url)
            ko = (OG_TITLE.search(html) or [None, None])[1]
            img = (OG_IMAGE.search(html) or [None, None])[1]
            ext = os.path.splitext(img)[1] if img else ".webp"
            saved = None
            if img:
                path = f"{IMG_DIR}/{slug}{ext}"
                if not os.path.exists(path):
                    try:
                        with open(path, "wb") as f:
                            f.write(get(img, binary=True))
                    except Exception:
                        path = None
                saved = f"img/uniques/{slug}{ext}" if path else None
            time.sleep(0.15)
            return en_name, ko, saved
        except Exception:
            time.sleep(0.6 * (attempt + 1))
    return en_name, None, None

def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    os.makedirs(IMG_DIR, exist_ok=True)
    rows = list(csv.DictReader(open("uniques.csv", encoding="utf-8")))
    seen, jobs = set(), []
    for r in rows:
        url, name = r["poedbUrl"], r["name"]
        if url and url not in seen:
            seen.add(url); jobs.append((name, url))
    if limit:
        jobs = jobs[:limit]

    names, images, miss_name, miss_img = {}, {}, [], []
    with ThreadPoolExecutor(max_workers=6) as ex:
        for i, (en, ko, img) in enumerate(ex.map(lambda a: scrape(*a), jobs), 1):
            if ko and re.search(r"[가-힣]", ko):
                names[en] = ko
            else:
                miss_name.append(en)
            if img:
                images[en] = img
            else:
                miss_img.append(en)
            if i % 100 == 0:
                print(f"  {i}/{len(jobs)} …", file=sys.stderr)

    if not limit:
        json.dump(dict(sorted(names.items())),
                  open("src/data/unique-translations.json", "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        json.dump(dict(sorted(images.items())),
                  open("src/data/unique-images.json", "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
    print(f"done: names {len(names)} (miss {len(miss_name)}), images {len(images)} (miss {len(miss_img)})")
    if miss_name[:8]:
        print("name miss sample:", miss_name[:8])
    if miss_img[:8]:
        print("image miss sample:", miss_img[:8])

if __name__ == "__main__":
    main()
