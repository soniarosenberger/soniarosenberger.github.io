"""Field notes: publish posts from the "Published" folder in Google Drive.

Each folder in Published is a post: the folder name is the title, a Google Doc (or .txt)
inside is the text, and the photos and videos are the media. A line "@ Some Place" in the
text sets the location; otherwise it comes from the media's GPS (city and country only).
Folders that change are rebuilt; folders taken out of Published are unpublished.

  python field_notes.py               uses GDRIVE_SA_KEY (service account json)
  python field_notes.py --local DIR   reads post folders from DIR instead (for testing)
"""
import datetime as dt
import hashlib
import html
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener
from timezonefinder import TimezoneFinder

register_heif_opener()

SITE = Path(__file__).resolve().parents[2]
DATA = SITE / "field-notes" / "posts.json"
PAGE = SITE / "field-notes.html"
HOME_TZ = "America/Vancouver"
PHOTO_EDGE = 1600
VIDEO_EDGE = 1280
VIDEO_MAX = 90 * 1024 * 1024          # github refuses files over 100 MB
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

PHOTO = re.compile(r"\.(jpe?g|png|heic|heif|webp|gif)$", re.I)
VIDEO = re.compile(r"\.(mov|mp4|m4v|webm|avi|3gp)$", re.I)
TEXT = re.compile(r"\.(txt|md)$", re.I)
DOC = "application/vnd.google-apps.document"
FOLDER = "application/vnd.google-apps.folder"


# ---- sources ----

class Drive:
    def __init__(self, key):
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        creds = service_account.Credentials.from_service_account_info(
            json.loads(key), scopes=["https://www.googleapis.com/auth/drive.readonly"])
        self.api = build("drive", "v3", credentials=creds, cache_discovery=False)

    def _list(self, q, fields):
        out, token = [], None
        while True:
            r = self.api.files().list(q=q, fields=f"nextPageToken, files({fields})", pageSize=200,
                                      pageToken=token, supportsAllDrives=True,
                                      includeItemsFromAllDrives=True).execute()
            out += r.get("files", [])
            token = r.get("nextPageToken")
            if not token:
                return out

    def posts(self):
        pub = self._list(f"name = 'Published' and mimeType = '{FOLDER}' and trashed = false", "id")
        if len(pub) != 1:
            sys.exit(f"expected one 'Published' folder shared with the bot, found {len(pub)}")
        folders = self._list(f"'{pub[0]['id']}' in parents and mimeType = '{FOLDER}' and trashed = false",
                             "id, name, createdTime")
        for f in folders:
            f["files"] = self._list(f"'{f['id']}' in parents and trashed = false",
                                    "id, name, mimeType, modifiedTime, size")
        return folders

    def text(self, f):
        if f["mimeType"] == DOC:
            data = self.api.files().export(fileId=f["id"], mimeType="text/plain").execute()
        else:
            data = self.api.files().get_media(fileId=f["id"]).execute()
        return data.decode("utf-8-sig", "replace")

    def download(self, f, path):
        from googleapiclient.http import MediaIoBaseDownload
        with open(path, "wb") as out:
            dl = MediaIoBaseDownload(out, self.api.files().get_media(fileId=f["id"]), chunksize=32 << 20)
            done = False
            while not done:
                _, done = dl.next_chunk()


class Local:
    """a folder of post folders, for testing"""
    def __init__(self, root):
        self.root = Path(root)

    def posts(self):
        out = []
        for d in sorted(p for p in self.root.iterdir() if p.is_dir()):
            made = (d / ".created").read_text().strip() if (d / ".created").exists() else \
                dt.datetime.fromtimestamp(d.stat().st_mtime, dt.timezone.utc).isoformat()
            files = [{"id": str(p), "name": p.name, "mimeType": "text/plain" if TEXT.search(p.name) else "",
                      "modifiedTime": str(p.stat().st_mtime), "size": str(p.stat().st_size)}
                     for p in sorted(d.iterdir()) if not p.name.startswith(".")]
            out.append({"id": "local:" + d.name, "name": d.name, "createdTime": made, "files": files})
        return out

    def text(self, f):
        return Path(f["id"]).read_text(encoding="utf-8-sig")

    def download(self, f, path):
        shutil.copy(f["id"], path)


# ---- media ----

def photo_gps(img):
    try:
        g = img.getexif().get_ifd(0x8825)
        def deg(v, ref):
            d = float(v[0]) + float(v[1]) / 60 + float(v[2]) / 3600
            return -d if ref in ("S", "W") else d
        return deg(g[2], g[1]), deg(g[4], g[3])
    except Exception:
        return None


def save_photo(src, dest):
    img = Image.open(src)
    gps = photo_gps(img)
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((PHOTO_EDGE, PHOTO_EDGE), Image.LANCZOS)
    img.save(dest, "JPEG", quality=82, progressive=True, optimize=True)   # no exif kept
    return img.size, gps


def probe(src):
    """duration (s), gps and hdr-ness of a video, from ffmpeg's own report"""
    err = subprocess.run([FFMPEG, "-hide_banner", "-i", str(src)], capture_output=True, text=True).stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    secs = int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3]) if dur else 0
    loc = re.search(r"location(?:\.ISO6709)?\s*:\s*([+-][\d.]+)([+-][\d.]+)", err)
    hdr = bool(re.search(r"Video:.*(arib-std-b67|smpte2084)", err))
    return secs, ((float(loc[1]), float(loc[2])) if loc else None), hdr


def save_video(src, dest, poster):
    if not shutil.which(FFMPEG):
        subprocess.run("sudo apt-get -qq update && sudo apt-get -qq install -y ffmpeg > /dev/null",
                       shell=True, check=True)
    secs, gps, hdr = probe(src)
    scale = f"scale='if(gt(iw,ih),min({VIDEO_EDGE},iw),-2)':'if(gt(iw,ih),-2,min({VIDEO_EDGE},ih))'"
    if hdr:   # iphone hdr: tone map to plain sdr, or it looks washed out
        scale = ("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,"
                 "zscale=t=bt709:m=bt709:r=tv," + scale)
    scale += ",format=yuv420p"
    def encode(rate):
        v = ["-b:v", f"{rate}k", "-maxrate", f"{rate}k", "-bufsize", f"{2 * rate}k"] if rate else \
            ["-crf", "27", "-maxrate", "2500k", "-bufsize", "5000k"]
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(src), "-map", "0:v:0", "-map", "0:a:0?",
                        "-vf", scale, "-c:v", "libx264", "-preset", "medium", "-profile:v", "high", *v,
                        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                        "-c:a", "aac", "-b:a", "128k", "-map_metadata", "-1", "-map_chapters", "-1",
                        "-movflags", "+faststart", str(dest)], check=True)
    encode(None)
    if dest.stat().st_size > VIDEO_MAX and secs:
        encode(max(300, int(VIDEO_MAX * 8 / 1000 / secs * 0.95) - 128))
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-ss", str(min(0.5, secs / 2)), "-i", str(dest),
                    "-frames:v", "1", "-q:v", "4", str(poster)], check=True)
    size = Image.open(poster).size
    return size, gps


# ---- place and time ----

def place_name(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"format": "jsonv2", "lat": f"{lat:.4f}", "lon": f"{lon:.4f}", "zoom": 10, "accept-language": "en"})
    req = urllib.request.Request(url, headers={"User-Agent": "soniarosenberger.com field notes"})
    try:
        a = json.load(urllib.request.urlopen(req, timeout=20)).get("address", {})
    except Exception as e:
        print("  reverse geocode failed:", e)
        return ""
    town = next((a[k] for k in ("city", "town", "village", "hamlet", "municipality", "county") if a.get(k)), "")
    region = a.get("state") if a.get("country_code") in ("ca", "us", "au") else a.get("country")
    return ", ".join(x for x in (town, region) if x)


def find_place(name):
    """coordinates of a typed place, for its time zone"""
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"format": "jsonv2", "q": name, "limit": 1})
    req = urllib.request.Request(url, headers={"User-Agent": "soniarosenberger.com field notes"})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=20))
        return (float(r[0]["lat"]), float(r[0]["lon"])) if r else None
    except Exception as e:
        print("  place lookup failed:", e)
        return None


def local_time(created, gps):
    when = dt.datetime.fromisoformat(created.replace("Z", "+00:00"))
    tz = TimezoneFinder().timezone_at(lat=gps[0], lng=gps[1]) if gps else None
    return when.astimezone(ZoneInfo(tz or HOME_TZ))


# ---- posts ----

def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:50] or "note"


def fingerprint(folder):
    key = folder["name"] + "|" + "|".join(sorted(f"{f['id']}:{f.get('modifiedTime')}:{f.get('size')}"
                                                 for f in folder["files"]))
    return hashlib.sha1(key.encode()).hexdigest()


def build(src, folder, slug):
    files = sorted(folder["files"], key=lambda f: f["name"].lower())
    texts = [f for f in files if f["mimeType"] == DOC or TEXT.search(f["name"])]
    media = [f for f in files if PHOTO.search(f["name"]) or VIDEO.search(f["name"])]
    text = src.text(texts[0]).replace("\r\n", "\n").strip() if texts else ""
    place = ""
    m = re.search(r"^\s*@\s*(.+?)\s*$", text, re.M)
    if m:
        place = m[1]
        text = (text[:m.start()] + text[m.end():]).strip()

    out = SITE / "field-notes" / slug
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    items, gps = [], None
    with tempfile.TemporaryDirectory() as tmp:
        for i, f in enumerate(media, 1):
            raw = Path(tmp) / f"raw{i}{Path(f['name']).suffix.lower()}"
            src.download(f, raw)
            try:
                if PHOTO.search(f["name"]):
                    (w, h), g = save_photo(raw, out / f"{i}.jpg")
                    items.append({"type": "photo", "src": f"field-notes/{slug}/{i}.jpg", "w": w, "h": h})
                else:
                    (w, h), g = save_video(raw, out / f"{i}.mp4", out / f"{i}.jpg")
                    items.append({"type": "video", "src": f"field-notes/{slug}/{i}.mp4",
                                  "poster": f"field-notes/{slug}/{i}.jpg", "w": w, "h": h})
            except Exception as e:
                print(f"  skipped {f['name']}: {e}")
                continue
            gps = gps or g
            raw.unlink()
    if not place and gps:
        place = place_name(*gps)
    elif place:
        gps = find_place(place) or gps
    when = local_time(folder["createdTime"], gps)
    return {"id": folder["id"], "slug": slug, "title": folder["name"].strip(), "time": when.isoformat(),
            "place": place, "text": text, "media": items, "fingerprint": fingerprint(folder)}


def paragraphs(text):
    url = re.compile(r"(https?://[^\s<]+[^\s<.,;:!?)\]'\"])")
    out = []
    for para in re.split(r"\n\s*\n", text.strip()):
        if para.strip():
            lines = [url.sub(r'<a href="\1" target="_blank" rel="noopener">\1</a>', html.escape(l, quote=False))
                     for l in para.strip().split("\n")]
            out.append("<p>" + "<br>\n          ".join(lines) + "</p>")
    return out


def render(post):
    when = dt.datetime.fromisoformat(post["time"])
    stamp = f"{when:%B} {when.day}, {when.year} · {when.hour % 12 or 12}:{when:%M} {'am' if when.hour < 12 else 'pm'}"
    meta = f'<time datetime="{post["time"]}">{stamp}</time>'
    if post["place"]:
        meta += " · " + html.escape(post["place"])
    parts = [f'    <article class="note" id="{post["slug"]}">',
             f'      <h2 class="note-title">{html.escape(post["title"])}</h2>',
             f'      <p class="note-meta">{meta}</p>']
    body = paragraphs(post["text"])
    if body:
        parts.append('      <div class="note-text">\n        ' + "\n        ".join(body) + "\n      </div>")
    if post["media"]:
        many = " is-many" if len(post["media"]) > 1 else ""
        parts.append(f'      <div class="note-media{many}">')
        for m in post["media"]:
            if m["type"] == "photo":
                parts.append(f'        <img src="{m["src"]}" width="{m["w"]}" height="{m["h"]}" loading="lazy" alt="">')
            else:
                parts.append(f'        <video src="{m["src"]}" poster="{m["poster"]}" width="{m["w"]}" height="{m["h"]}"'
                             f' controls playsinline preload="none"></video>')
        parts.append("      </div>")
    parts.append("    </article>")
    return "\n".join(parts)


def write_page(posts):
    page = PAGE.read_text(encoding="utf-8")
    inner = "\n".join(render(p) for p in posts) if posts else '    <p class="page-placeholder">coming soon</p>'
    page = re.sub(r"<!-- notes -->.*?<!-- /notes -->",
                  lambda m: f"<!-- notes -->\n{inner}\n    <!-- /notes -->", page, flags=re.S)
    PAGE.write_text(page, encoding="utf-8")


def main():
    if "--local" in sys.argv:
        src = Local(sys.argv[sys.argv.index("--local") + 1])
    elif os.environ.get("GDRIVE_SA_KEY"):
        src = Drive(os.environ["GDRIVE_SA_KEY"])
    else:
        print("no GDRIVE_SA_KEY, nothing to do")
        return
    posts = {p["id"]: p for p in (json.loads(DATA.read_text()) if DATA.exists() else [])}
    folders = src.posts()
    live = {f["id"] for f in folders}
    changed = False

    for pid in [p for p in posts if p not in live]:
        print("unpublished:", posts[pid]["title"])
        shutil.rmtree(SITE / "field-notes" / posts[pid]["slug"], ignore_errors=True)
        del posts[pid]
        changed = True

    taken = {p["slug"] for p in posts.values()}
    for f in sorted(folders, key=lambda f: f["createdTime"]):
        old = posts.get(f["id"])
        if old and old["fingerprint"] == fingerprint(f):
            continue
        if not f["files"]:
            continue                                  # still empty: wait for something in it
        if old:
            slug = old["slug"]
        else:
            base = f"{f['createdTime'][:10]}-{slugify(f['name'])}"
            slug, n = base, 2
            while slug in taken:
                slug, n = f"{base}-{n}", n + 1
            taken.add(slug)
        print("updated:" if old else "published:", f["name"])
        posts[f["id"]] = build(src, f, slug)
        changed = True

    ordered = sorted(posts.values(), key=lambda p: p["time"], reverse=True)
    if changed or "--render" in sys.argv:
        DATA.parent.mkdir(exist_ok=True)
        DATA.write_text(json.dumps(ordered, indent=1, ensure_ascii=False) + "\n")
        write_page(ordered)
    print(f"{len(ordered)} posts" + ("" if changed else ", no changes"))


if __name__ == "__main__":
    main()
