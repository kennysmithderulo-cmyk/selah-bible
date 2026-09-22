#!/usr/bin/env python3
"""Selah backend: bookmarks, last-read position, and full-text search. Port 8000."""
import json
import os
import re
import sqlite3
import threading
import time
import unicodedata
import urllib.request
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = "/home/user/workspace/selah-data"
os.makedirs(DATA_DIR, exist_ok=True)
API = "https://bible.helloao.org"
ALLOWED_TR = {
    "BSB", "eng_kjv", "ENGWEBP", "eng_asv", "eng_net", "eng_bbe", "eng_ylt", "eng_dby",
    "twi_asa", "twi_aka", "ewe_bib", "hau_bib", "yor_bib", "swh_onmm",
    "fra_lsg", "spa_r09", "por_blj", "deu_l12",
}

db = sqlite3.connect(os.path.join(DATA_DIR, "selah.db"), check_same_thread=False)
db.execute("PRAGMA journal_mode=WAL")
db.executescript(
    """
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor TEXT NOT NULL, tr TEXT NOT NULL, book TEXT NOT NULL, book_name TEXT,
      chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT,
      created_at REAL NOT NULL,
      UNIQUE(visitor, tr, book, chapter, verse)
    );
    CREATE TABLE IF NOT EXISTS positions (
      visitor TEXT PRIMARY KEY, tr TEXT, book TEXT, chapter INTEGER, verse INTEGER,
      narrator TEXT, updated_at REAL
    );
    """
)
db_lock = threading.Lock()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def visitor(req: Request) -> str:
    return req.headers.get("x-visitor-id") or "local-dev"


# ---------------- Bookmarks ----------------
class BookmarkIn(BaseModel):
    tr: str
    book: str
    book_name: Optional[str] = None
    chapter: int
    verse: int
    text: Optional[str] = None


def row_to_bm(r):
    return {"id": r[0], "tr": r[1], "book": r[2], "book_name": r[3], "chapter": r[4],
            "verse": r[5], "text": r[6], "created_at": r[7]}


@app.get("/api/bookmarks")
def list_bookmarks(req: Request):
    rows = db.execute(
        "SELECT id,tr,book,book_name,chapter,verse,text,created_at FROM bookmarks WHERE visitor=? ORDER BY created_at DESC",
        [visitor(req)],
    ).fetchall()
    return [row_to_bm(r) for r in rows]


@app.post("/api/bookmarks", status_code=201)
def add_bookmark(bm: BookmarkIn, req: Request):
    v = visitor(req)
    with db_lock:
        db.execute(
            "INSERT OR IGNORE INTO bookmarks (visitor,tr,book,book_name,chapter,verse,text,created_at) VALUES (?,?,?,?,?,?,?,?)",
            [v, bm.tr, bm.book, bm.book_name, bm.chapter, bm.verse, (bm.text or "")[:2000], time.time()],
        )
        db.commit()
    r = db.execute(
        "SELECT id,tr,book,book_name,chapter,verse,text,created_at FROM bookmarks WHERE visitor=? AND tr=? AND book=? AND chapter=? AND verse=?",
        [v, bm.tr, bm.book, bm.chapter, bm.verse],
    ).fetchone()
    return row_to_bm(r)


@app.delete("/api/bookmarks/{bid}")
def delete_bookmark(bid: int, req: Request):
    with db_lock:
        db.execute("DELETE FROM bookmarks WHERE id=? AND visitor=?", [bid, visitor(req)])
        db.commit()
    return {"deleted": bid}


# ---------------- Position ----------------
class PositionIn(BaseModel):
    tr: str
    book: str
    chapter: int
    verse: int = 0
    narrator: Optional[str] = None


@app.get("/api/position")
def get_position(req: Request):
    r = db.execute("SELECT tr,book,chapter,verse,narrator,updated_at FROM positions WHERE visitor=?", [visitor(req)]).fetchone()
    if not r:
        return None
    return {"tr": r[0], "book": r[1], "chapter": r[2], "verse": r[3], "narrator": r[4], "updated_at": r[5]}


@app.put("/api/position")
def put_position(p: PositionIn, req: Request):
    with db_lock:
        db.execute(
            "INSERT INTO positions (visitor,tr,book,chapter,verse,narrator,updated_at) VALUES (?,?,?,?,?,?,?) "
            "ON CONFLICT(visitor) DO UPDATE SET tr=excluded.tr, book=excluded.book, chapter=excluded.chapter, "
            "verse=excluded.verse, narrator=excluded.narrator, updated_at=excluded.updated_at",
            [visitor(req), p.tr, p.book, p.chapter, p.verse, p.narrator, time.time()],
        )
        db.commit()
    return {"ok": True}


# ---------------- Search ----------------
_index = {}  # tr -> list of (book_id, book_name, order, chapter, verse, text, norm_text)
_index_lock = threading.Lock()


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace("\u2019", "'").replace("\u2018", "'").replace("\u02bc", "'")
    return s


def verse_text(content):
    parts = []
    for c in content:
        if isinstance(c, str):
            parts.append(c)
        elif isinstance(c, dict) and c.get("text"):
            parts.append(c["text"])
    t = re.sub(r"\s+", " ", " ".join(parts)).strip()
    return re.sub(r" ([\u201d\u2019.,;:!?)])", r"\1", t)


def load_index(tr: str):
    if tr in _index:
        return _index[tr]
    with _index_lock:
        if tr in _index:
            return _index[tr]
        path = os.path.join(DATA_DIR, f"{tr}.json")
        if not os.path.exists(path):
            req = urllib.request.Request(f"{API}/api/{tr}/complete.json", headers={"User-Agent": "Selah/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                raw = r.read()
            with open(path + ".tmp", "wb") as f:
                f.write(raw)
            os.replace(path + ".tmp", path)
        with open(path, "rb") as f:
            d = json.load(f)
        rows = []
        for b in d["books"]:
            name = b.get("commonName") or b.get("name")
            for ch in b["chapters"]:
                chap = ch["chapter"]
                for item in chap["content"]:
                    if item.get("type") == "verse":
                        t = verse_text(item["content"])
                        rows.append((b["id"], name, b["order"], chap["number"], item["number"], t, norm(t)))
        _index[tr] = rows
        return rows


def parse_query(q: str):
    """Returns (phrases, words). Quoted segments are exact phrases; others are words that must all appear."""
    phrases = [norm(p).strip() for p in re.findall(r'"([^"]+)"', q) if p.strip()]
    rest = re.sub(r'"[^"]*"', " ", q)
    words = [norm(w) for w in re.findall(r"[^\s\"]+", rest)]
    words = [re.sub(r"^[^\w']+|[^\w']+$", "", w) for w in words]
    return phrases, [w for w in words if w]


@app.get("/api/search")
def search(tr: str, q: str, scope: str = "all", book: Optional[str] = None, offset: int = 0, limit: int = 50):
    if tr not in ALLOWED_TR:
        raise HTTPException(400, "Unsupported translation")
    q = q.strip()[:200]
    if len(q) < 2:
        return {"total": 0, "results": [], "books": [], "terms": []}
    try:
        rows = load_index(tr)
    except Exception as e:  # network failure etc.
        raise HTTPException(502, f"Could not load translation: {e}")
    phrases, words = parse_query(q)
    if not phrases and not words:
        return {"total": 0, "results": [], "books": [], "terms": []}
    pats = [re.compile(r"(?<![\w])" + re.escape(p) + r"(?![\w])") for p in phrases]
    # Whole-word match; allow simple suffixes (love -> loves, loved) when word is 3+ chars
    for w in words:
        suffix = r"\w{0,3}" if len(w) >= 3 else ""
        pats.append(re.compile(r"(?<![\w])" + re.escape(w) + suffix + r"(?![\w])"))
    matches = []
    per_book = {}
    for r in rows:
        o = r[2]
        if scope == "ot" and o >= 40:
            continue
        if scope == "nt" and o < 40:
            continue
        nt = r[6]
        if all(p.search(nt) for p in pats):
            per_book.setdefault(r[0], [r[1], r[2], 0])[2] += 1
            if book and r[0] != book:
                continue
            matches.append(r)
    total = len(matches)
    page = matches[offset: offset + max(1, min(limit, 100))]
    return {
        "total": total,
        "overall": sum(v[2] for v in per_book.values()),
        "results": [{"book": r[0], "book_name": r[1], "chapter": r[3], "verse": r[4], "text": r[5]} for r in page],
        "books": [{"book": k, "book_name": v[0], "count": v[2]} for k, v in sorted(per_book.items(), key=lambda kv: kv[1][1])],
        "terms": phrases + words,
    }


@app.get("/api/health")
def health():
    return {"ok": True}


def _warm():
    try:
        load_index("BSB")
    except Exception:
        pass


threading.Thread(target=_warm, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
