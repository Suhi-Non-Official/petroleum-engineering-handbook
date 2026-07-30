import fitz  # PyMuPDF
import json
import os
import re
import sqlite3
import sys
import time

base_dir = r"c:\Users\User\Downloads\Petroleum Engineering Handbook"
data_dir = os.path.join(base_dir, "data")
global_dir = os.path.join(data_dir, "global")
volumes_dir = os.path.join(data_dir, "volumes")
previews_dir = os.path.join(data_dir, "previews")

os.makedirs(global_dir, exist_ok=True)
os.makedirs(volumes_dir, exist_ok=True)
os.makedirs(previews_dir, exist_ok=True)

pdf_files = [
    ("vol-1", "Vol 1.pdf", "Volume 1: General Engineering"),
    ("vol-2", "Vol 2.pdf", "Volume 2: Drilling Engineering"),
    ("vol-3", "Vol 3.pdf", "Volume 3: Facilities and Construction Engineering"),
    ("vol-4", "Vol 4.pdf", "Volume 4: Production Operations Engineering"),
    ("vol-5", "Vol 5.pdf", "Volume 5: Reservoir Engineering and Petrophysics"),
    ("vol-6", "Vol 6.pdf", "Volume 6: Emerging and Peripheral Technologies"),
    ("vol-7", "Vol 7.pdf", "Volume 7: Indexes and Standards")
]

# Set up SQLite FTS5 database
db_path = os.path.join(global_dir, "search.db")
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Enable FTS5
cursor.execute("""
CREATE TABLE IF NOT EXISTS pages_meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vol_id TEXT,
    pdf_page INTEGER,
    printed_page TEXT,
    chapter_num TEXT,
    chapter_title TEXT,
    section_num TEXT,
    section_title TEXT,
    word_count INTEGER,
    has_ocr INTEGER,
    has_figures INTEGER,
    has_tables INTEGER,
    has_equations INTEGER,
    text_content TEXT,
    references_json TEXT
);
""")

cursor.execute("""
CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
    vol_id UNINDEXED,
    pdf_page UNINDEXED,
    printed_page UNINDEXED,
    chapter_num,
    chapter_title,
    section_num,
    section_title,
    text_content,
    tokenize = 'porter unicode61'
);
""")

conn.commit()

# Reference regex patterns
ref_patterns = [
    ("section", re.compile(r'(?:Section|Sec\.)\s*(\d+[\.\-]\d+)', re.IGNORECASE)),
    ("chapter", re.compile(r'(?:Chapter|Ch\.)\s*(\d+)', re.IGNORECASE)),
    ("figure", re.compile(r'(?:Figure|Fig\.)\s*(\d+[\.\-]\d+)', re.IGNORECASE)),
    ("table", re.compile(r'(?:Table|Tab\.)\s*(\d+[\.\-]\d+)', re.IGNORECASE)),
    ("equation", re.compile(r'(?:Equation|Eq\.)\s*\(?(\d+[\.\-]\d+)\)?', re.IGNORECASE)),
    ("volume", re.compile(r'(?:Volume|Vol\.)\s*(\d+)', re.IGNORECASE))
]

collection_data = {
    "title": "Petroleum Engineering Handbook Collection",
    "total_volumes": 7,
    "volumes": []
}

cross_references = []

watermark_pattern = re.compile(r'ADVERTENCIA:.*', re.IGNORECASE)
email_pattern = re.compile(r'\S+@\S+\.\S+', re.IGNORECASE)

start_time = time.time()

for vol_id, filename, vol_title in pdf_files:
    pdf_path = os.path.join(base_dir, filename)
    print(f"=== Processing {vol_id}: {filename} ===")
    
    if not os.path.exists(pdf_path):
        print(f"Warning: {pdf_path} not found! Skipping...")
        continue

    doc = fitz.open(pdf_path)
    page_count = len(doc)
    
    # Process Table of Contents from PDF bookmarks
    toc_raw = doc.get_toc() # [level, title, pdf_page]
    
    vol_toc = []
    current_chapter = {"num": "", "title": "Front Matter", "page": 1, "sections": []}
    
    # Process TOC bookmarks into hierarchy
    for item in toc_raw:
        level, title, pg = item[0], item[1].strip(), item[2]
        
        # Check if title indicates chapter
        ch_match = re.match(r'^(?:Chapter\s+)?(\d+)\s*[\-\–\:]?\s*(.*)', title, re.IGNORECASE)
        if level == 1 or ch_match:
            ch_num = ch_match.group(1) if ch_match else str(len(vol_toc) + 1)
            ch_title = ch_match.group(2) if ch_match else title
            current_chapter = {
                "num": ch_num,
                "title": ch_title or title,
                "page": pg,
                "sections": []
            }
            vol_toc.append(current_chapter)
        elif level >= 2:
            sec_match = re.match(r'^(\d+\.\d+)\s*(.*)', title)
            sec_num = sec_match.group(1) if sec_match else ""
            sec_title = sec_match.group(2) if sec_match else title
            if vol_toc:
                vol_toc[-1]["sections"].append({
                    "num": sec_num,
                    "title": sec_title or title,
                    "page": pg
                })
            else:
                vol_toc.append({
                    "num": "1",
                    "title": "Introduction",
                    "page": 1,
                    "sections": [{"num": sec_num, "title": sec_title or title, "page": pg}]
                })

    vol_dir = os.path.join(volumes_dir, vol_id)
    os.makedirs(vol_dir, exist_ok=True)
    
    # Create page map lookup for chapter/section per page
    def get_page_context(p_idx):
        # 1-indexed p_idx
        ch_name = "General"
        ch_num = ""
        sec_name = ""
        sec_num = ""
        
        for ch in vol_toc:
            if p_idx >= ch["page"]:
                ch_name = ch["title"]
                ch_num = ch["num"]
                for sec in ch.get("sections", []):
                    if p_idx >= sec["page"]:
                        sec_name = sec["title"]
                        sec_num = sec["num"]
        return ch_num, ch_name, sec_num, sec_name

    pages_data = []
    total_words = 0
    ocr_pages_count = 0
    
    vol_preview_dir = os.path.join(previews_dir, vol_id)
    os.makedirs(vol_preview_dir, exist_ok=True)

    for i, page in enumerate(doc):
        pdf_page_num = i + 1
        text = page.get_text("text")
        
        # Clean watermarks
        text = watermark_pattern.sub('', text)
        text = email_pattern.sub('', text)
        
        words = text.split()
        w_count = len(words)
        total_words += w_count
        
        has_ocr = 0
        if w_count < 15 and len(page.get_images()) > 0:
            has_ocr = 1
            ocr_pages_count += 1
            
        ch_num, ch_title, sec_num, sec_title = get_page_context(pdf_page_num)
        
        # Printed page calculation (offset based on first chapter page)
        first_ch_pg = vol_toc[0]["page"] if vol_toc else 9
        if pdf_page_num >= first_ch_pg:
            printed_page = str(pdf_page_num - first_ch_pg + 1)
        else:
            printed_page = f"i-{pdf_page_num}"
            
        # Detect references on page
        page_refs = []
        for ref_type, pattern in ref_patterns:
            matches = pattern.findall(text)
            for m in matches:
                ref_item = {"type": ref_type, "target": m, "vol_id": vol_id, "source_page": pdf_page_num}
                page_refs.append(ref_item)
                cross_references.append(ref_item)
                
        has_figs = 1 if ("Fig." in text or "Figure" in text or len(page.get_images()) > 0) else 0
        has_tabs = 1 if ("Table" in text) else 0
        has_eqs = 1 if ("Eq." in text or "Equation" in text or "=" in text) else 0
        
        # Save page metadata in DB
        refs_json_str = json.dumps(page_refs)
        cursor.execute("""
            INSERT INTO pages_meta (vol_id, pdf_page, printed_page, chapter_num, chapter_title, section_num, section_title, word_count, has_ocr, has_figures, has_tables, has_equations, text_content, references_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (vol_id, pdf_page_num, printed_page, ch_num, ch_title, sec_num, sec_title, w_count, has_ocr, has_figs, has_tabs, has_eqs, text, refs_json_str))
        
        cursor.execute("""
            INSERT INTO pages_fts (vol_id, pdf_page, printed_page, chapter_num, chapter_title, section_num, section_title, text_content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (vol_id, pdf_page_num, printed_page, ch_num, ch_title, sec_num, sec_title, text))
        
        pages_data.append({
            "pdf_page": pdf_page_num,
            "printed_page": printed_page,
            "chapter_num": ch_num,
            "chapter_title": ch_title,
            "section_num": sec_num,
            "section_title": sec_title,
            "word_count": w_count,
            "has_ocr": bool(has_ocr),
            "references": page_refs
        })

        # Save first 5 pages and key chapter start pages as pre-rendered web preview images (72 DPI thumbnail)
        if pdf_page_num <= 5 or any(ch["page"] == pdf_page_num for ch in vol_toc):
            pix = page.get_pixmap(dpi=100)
            img_path = os.path.join(vol_preview_dir, f"page_{pdf_page_num}.jpg")
            pix.save(img_path)

    # Save volume specific JSON structure
    vol_meta = {
        "vol_id": vol_id,
        "title": vol_title,
        "filename": filename,
        "page_count": page_count,
        "total_words": total_words,
        "ocr_pages_count": ocr_pages_count,
        "toc": vol_toc
    }
    
    with open(os.path.join(vol_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(vol_meta, f, indent=2)
        
    with open(os.path.join(vol_dir, "pages.json"), "w", encoding="utf-8") as f:
        json.dump(pages_data, f, indent=2)

    collection_data["volumes"].append(vol_meta)
    doc.close()

conn.commit()

# Save collection metadata and cross references
with open(os.path.join(global_dir, "collection.json"), "w", encoding="utf-8") as f:
    json.dump(collection_data, f, indent=2)

with open(os.path.join(global_dir, "cross_references.json"), "w", encoding="utf-8") as f:
    json.dump(cross_references[:5000], f, indent=2) # store sample matrix

print(f"Ingestion finished successfully in {round(time.time() - start_time, 2)} seconds!")
conn.close()
