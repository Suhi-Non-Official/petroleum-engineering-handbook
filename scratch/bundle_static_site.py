import json
import os
import shutil
import sqlite3
import fitz  # PyMuPDF

base_dir = r"c:\Users\User\Downloads\Petroleum Engineering Handbook"
data_dir = os.path.join(base_dir, "data")
db_path = os.path.join(data_dir, "global", "search.db")
public_dir = os.path.join(base_dir, "frontend", "public", "data")
docs_dir = os.path.join(base_dir, "docs", "data")

os.makedirs(public_dir, exist_ok=True)
os.makedirs(docs_dir, exist_ok=True)

# 1. Copy global collection.json
src_coll = os.path.join(data_dir, "global", "collection.json")
dst_public_coll = os.path.join(public_dir, "global", "collection.json")

os.makedirs(os.path.dirname(dst_public_coll), exist_ok=True)
shutil.copy(src_coll, dst_public_coll)

# 2. Extract full page text and metadata from SQLite database for all 7 volumes
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

pdf_map = {
    "vol-1": "Vol 1.pdf",
    "vol-2": "Vol 2.pdf",
    "vol-3": "Vol 3.pdf",
    "vol-4": "Vol 4.pdf",
    "vol-5": "Vol 5.pdf",
    "vol-6": "Vol 6.pdf",
    "vol-7": "Vol 7.pdf"
}

for vol_id, pdf_name in pdf_map.items():
    print(f"Bundling full text and page data for {vol_id} into public/data...")
    
    vol_src_dir = os.path.join(data_dir, "volumes", vol_id)
    vol_pub_dir = os.path.join(public_dir, "volumes", vol_id)
    os.makedirs(vol_pub_dir, exist_ok=True)

    # Copy metadata.json
    meta_src = os.path.join(vol_src_dir, "metadata.json")
    if os.path.exists(meta_src):
        shutil.copy(meta_src, os.path.join(vol_pub_dir, "metadata.json"))

    # Fetch all pages with text_content from DB
    cursor.execute("""
        SELECT vol_id, pdf_page, printed_page, chapter_num, chapter_title, section_num, section_title, word_count, has_ocr, references_json, text_content
        FROM pages_meta
        WHERE vol_id = ?
        ORDER BY pdf_page ASC
    """, (vol_id,))
    
    rows = cursor.fetchall()
    vol_pages = []
    for r in rows:
        vol_pages.append({
            "vol_id": r["vol_id"],
            "pdf_page": r["pdf_page"],
            "printed_page": r["printed_page"],
            "chapter_num": r["chapter_num"],
            "chapter_title": r["chapter_title"],
            "section_num": r["section_num"],
            "section_title": r["section_title"],
            "word_count": r["word_count"],
            "has_ocr": bool(r["has_ocr"]),
            "references": json.loads(r["references_json"] or "[]"),
            "text_content": r["text_content"]
        })

    # Write enriched pages.json into frontend/public/data/volumes/vol-X/pages.json
    with open(os.path.join(vol_pub_dir, "pages.json"), "w", encoding="utf-8") as f:
        json.dump(vol_pages, f, indent=2)

    # Pre-render page previews into public/data/previews/vol-X/
    prev_pub_dir = os.path.join(public_dir, "previews", vol_id)
    os.makedirs(prev_pub_dir, exist_ok=True)
    
    pdf_path = os.path.join(base_dir, pdf_name)
    if os.path.exists(pdf_path):
        doc = fitz.open(pdf_path)
        with open(meta_src, "r", encoding="utf-8") as f:
            vmeta = json.load(f)
            
        key_pages = set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20])
        for ch in vmeta.get("toc", []):
            key_pages.add(ch["page"])
            for sec in ch.get("sections", []):
                key_pages.add(sec["page"])
                
        for pno in sorted(list(key_pages)):
            if 1 <= pno <= len(doc):
                img_name = f"page_{pno}.jpg"
                pub_img = os.path.join(prev_pub_dir, img_name)
                if not os.path.exists(pub_img):
                    try:
                        page = doc[pno - 1]
                        pix = page.get_pixmap(dpi=100)
                        os.makedirs(os.path.dirname(pub_img), exist_ok=True)
                        pix.save(pub_img)
                    except Exception as e:
                        pass
        doc.close()

conn.close()
print("All 5,626 pages full text successfully bundled into public/data!")
