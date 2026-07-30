import json
import os
import shutil
import fitz  # PyMuPDF

base_dir = r"c:\Users\User\Downloads\Petroleum Engineering Handbook"
data_dir = os.path.join(base_dir, "data")
public_dir = os.path.join(base_dir, "frontend", "public", "data")
docs_dir = os.path.join(base_dir, "docs", "data")

os.makedirs(public_dir, exist_ok=True)
os.makedirs(docs_dir, exist_ok=True)

# Copy global collection.json
src_coll = os.path.join(data_dir, "global", "collection.json")
dst_public_coll = os.path.join(public_dir, "global", "collection.json")
dst_docs_coll = os.path.join(docs_dir, "global", "collection.json")

os.makedirs(os.path.dirname(dst_public_coll), exist_ok=True)
os.makedirs(os.path.dirname(dst_docs_coll), exist_ok=True)

shutil.copy(src_coll, dst_public_coll)
shutil.copy(src_coll, dst_docs_coll)

pdf_map = {
    "vol-1": "Vol 1.pdf",
    "vol-2": "Vol 2.pdf",
    "vol-3": "Vol 3.pdf",
    "vol-4": "Vol 4.pdf",
    "vol-5": "Vol 5.pdf",
    "vol-6": "Vol 6.pdf",
    "vol-7": "Vol 7.pdf"
}

# Export all volume metadata, page maps, and render high-res page images for web previews
for vol_id, pdf_name in pdf_map.items():
    print(f"Exporting static assets for {vol_id}...")
    vol_src_dir = os.path.join(data_dir, "volumes", vol_id)
    vol_pub_dir = os.path.join(public_dir, "volumes", vol_id)
    vol_doc_dir = os.path.join(docs_dir, "volumes", vol_id)
    
    os.makedirs(vol_pub_dir, exist_ok=True)
    os.makedirs(vol_doc_dir, exist_ok=True)
    
    # Copy metadata.json & pages.json
    for fname in ["metadata.json", "pages.json"]:
        fsrc = os.path.join(vol_src_dir, fname)
        if os.path.exists(fsrc):
            shutil.copy(fsrc, os.path.join(vol_pub_dir, fname))
            shutil.copy(fsrc, os.path.join(vol_doc_dir, fname))

    # Pre-render high resolution page images for first 30 pages and chapter start pages into previews/
    prev_pub_dir = os.path.join(public_dir, "previews", vol_id)
    prev_doc_dir = os.path.join(docs_dir, "previews", vol_id)
    os.makedirs(prev_pub_dir, exist_ok=True)
    os.makedirs(prev_doc_dir, exist_ok=True)
    
    pdf_path = os.path.join(base_dir, pdf_name)
    if os.path.exists(pdf_path):
        doc = fitz.open(pdf_path)
        with open(os.path.join(vol_src_dir, "metadata.json"), "r", encoding="utf-8") as f:
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
                doc_img = os.path.join(prev_doc_dir, img_name)
                if not os.path.exists(pub_img) or not os.path.exists(doc_img):
                    try:
                        page = doc[pno - 1]
                        pix = page.get_pixmap(dpi=100)
                        os.makedirs(os.path.dirname(pub_img), exist_ok=True)
                        os.makedirs(os.path.dirname(doc_img), exist_ok=True)
                        pix.save(pub_img)
                        pix.save(doc_img)
                    except Exception as e:
                        print(f"Warning page {pno}: {e}")
        doc.close()

print("Static data bundling complete successfully!")
