import os
import shutil

base_dir = r"c:\Users\User\Downloads\Petroleum Engineering Handbook"
public_pdfs_dir = os.path.join(base_dir, "frontend", "public", "pdfs")
docs_pdfs_dir = os.path.join(base_dir, "docs", "pdfs")

os.makedirs(public_pdfs_dir, exist_ok=True)
os.makedirs(docs_pdfs_dir, exist_ok=True)

pdf_map = {
    "vol-1": "Vol 1.pdf",
    "vol-2": "Vol 2.pdf",
    "vol-3": "Vol 3.pdf",
    "vol-4": "Vol 4.pdf",
    "vol-5": "Vol 5.pdf",
    "vol-6": "Vol 6.pdf",
    "vol-7": "Vol 7.pdf"
}

for vol_id, pdf_filename in pdf_map.items():
    src_pdf = os.path.join(base_dir, pdf_filename)
    dst_pub_pdf = os.path.join(public_pdfs_dir, f"{vol_id}.pdf")
    dst_doc_pdf = os.path.join(docs_pdfs_dir, f"{vol_id}.pdf")
    
    if os.path.exists(src_pdf):
        print(f"Copying {pdf_filename} to web pdfs folder as {vol_id}.pdf...")
        if not os.path.exists(dst_pub_pdf):
            shutil.copy(src_pdf, dst_pub_pdf)
        if not os.path.exists(dst_doc_pdf):
            shutil.copy(src_pdf, dst_doc_pdf)

print("PDF files prepared successfully for web PDF viewer!")
