"""Archive images for the photo-collage style: searches Wikimedia Commons and downloads only public-domain / CC0 files, keeping
title, author, licence and page URL so the description can credit them. No generative models: these are real archive files."""
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
UA = "videomaker/0.2 (open-source reel tool; https://github.com/yefry08/cropgpt)"
FREE = re.compile(r"public domain|^pd\b|^pd-|cc0|no restrictions|no known copyright", re.I)


def _get(url, timeout=60):
    """GET with the polite User-Agent Wikimedia asks for, backing off on rate limits."""
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or attempt == 5:
                raise
            time.sleep(int(e.headers.get("retry-after") or 0) or 10 * (attempt + 1))


def _clean(html):
    return re.sub(r"<[^>]+>", "", html or "").strip()


def search(query, n=8, width=1200):
    """Free-licence bitmap results for `query`: dicts with title, url (thumbnail), page, license, author."""
    q = {"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrsearch": f"{query} filetype:bitmap",
         "gsrlimit": max(n * 3, 15), "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": width}
    d = json.loads(_get(API + "?" + urllib.parse.urlencode(q)))
    out = []
    for p in sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0)):
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {}); lic = _clean(m.get("LicenseShortName", {}).get("value"))
        if not FREE.search(lic) or ii.get("width", 0) < 500:
            continue
        out.append({"title": p["title"].removeprefix("File:"), "url": ii.get("thumburl") or ii["url"], "page": ii["descriptionurl"],
                    "license": lic, "author": _clean(m.get("Artist", {}).get("value"))[:80] or "desconocido"})
        if len(out) >= n:
            break
    return out


def download(item, folder, name):
    """Save `item` (from search) as folder/images/<name>.jpg and return the credit record stored in project['images']."""
    dest = Path(folder) / "images"; dest.mkdir(parents=True, exist_ok=True)
    path = dest / f"{name}.jpg"; path.write_bytes(_get(item["url"]))
    return {"file": path.name, **{k: item[k] for k in ("title", "page", "license", "author")}}


# Library of Congress collections with no known restrictions on publication (FSA/OWI, Detroit Publishing, National Photo Co.,
# Harris & Ewing, Bain News Service).
LOC_FREE = {"fsa": "FSA/OWI", "det": "Detroit Publishing Co.", "npcc": "National Photo Company", "hec": "Harris & Ewing", "ggbain": "Bain News Service"}


def search_loc(query, n=8):
    """Library of Congress photos from collections with no known restrictions: same record shape as search()."""
    q = {"q": query, "fo": "json", "c": max(n * 4, 20)}
    d = json.loads(_get("https://www.loc.gov/pictures/search/?" + urllib.parse.urlencode(q)))
    out = []
    for r in d.get("results", []):
        full = (r.get("image") or {}).get("full") or ""; m = re.search(r"/pnp/([a-z]+)/", full)
        if not m or m.group(1) not in LOC_FREE:
            continue
        out.append({"title": r.get("title", "")[:160], "url": re.sub(r"r\.jpg$", "v.jpg", full),   # v.jpg: 1024 px
                    "page": (r.get("links") or {}).get("item", ""),
                    "license": "Library of Congress, sin restricciones conocidas", "author": LOC_FREE[m.group(1)]})
        if len(out) >= n:
            break
    return out
