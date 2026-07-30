import fitz  # PyMuPDF
import json
import os
import sqlite3
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from calculators import convert_units, calculate_darcy_liquid, calculate_hydrostatic_pressure, calculate_productivity_index, calculate_api_gravity

app = FastAPI(
    title="Petroleum Engineering Handbook API",
    description="Backend API for 7-Volume Petroleum Engineering Reference Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = r"c:\Users\User\Downloads\Petroleum Engineering Handbook"
DATA_DIR = os.path.join(BASE_DIR, "data")
GLOBAL_DIR = os.path.join(DATA_DIR, "global")
VOLUMES_DIR = os.path.join(DATA_DIR, "volumes")
PREVIEWS_DIR = os.path.join(DATA_DIR, "previews")
DB_PATH = os.path.join(GLOBAL_DIR, "search.db")
USER_STATE_PATH = os.path.join(GLOBAL_DIR, "user_state.json")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# User state storage helper
def load_user_state():
    if os.path.exists(USER_STATE_PATH):
        with open(USER_STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "bookmarks": [],
        "notes": [],
        "history": []
    }

def save_user_state(state):
    with open(USER_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

@app.get("/")
def read_root():
    return {"message": "Petroleum Engineering Handbook 7-Volume API is running."}

@app.get("/api/collection")
def get_collection():
    coll_path = os.path.join(GLOBAL_DIR, "collection.json")
    if not os.path.exists(coll_path):
        raise HTTPException(status_code=404, detail="Collection data not found. Run ingest pipeline first.")
    with open(coll_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/volume/{vol_id}")
def get_volume(vol_id: str):
    vol_meta_path = os.path.join(VOLUMES_DIR, vol_id, "metadata.json")
    if not os.path.exists(vol_meta_path):
        raise HTTPException(status_code=404, detail=f"Volume '{vol_id}' not found.")
    with open(vol_meta_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/page/{vol_id}/{pdf_page}")
def get_page(vol_id: str, pdf_page: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT vol_id, pdf_page, printed_page, chapter_num, chapter_title, section_num, section_title, word_count, has_ocr, has_figures, has_tables, has_equations, text_content, references_json
        FROM pages_meta
        WHERE vol_id = ? AND pdf_page = ?
    """, (vol_id, pdf_page))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Page {pdf_page} in {vol_id} not found.")
    
    res = dict(row)
    res["references"] = json.loads(res.get("references_json") or "[]")
    return res

@app.get("/api/page-image/{vol_id}/{pdf_page}")
def get_page_image(vol_id: str, pdf_page: int):
    # Check pre-rendered thumbnail first
    img_path = os.path.join(PREVIEWS_DIR, vol_id, f"page_{pdf_page}.jpg")
    if os.path.exists(img_path):
        return FileResponse(img_path, media_type="image/jpeg")

    # Render on demand using PyMuPDF
    pdf_filename_map = {
        "vol-1": "Vol 1.pdf",
        "vol-2": "Vol 2.pdf",
        "vol-3": "Vol 3.pdf",
        "vol-4": "Vol 4.pdf",
        "vol-5": "Vol 5.pdf",
        "vol-6": "Vol 6.pdf",
        "vol-7": "Vol 7.pdf"
    }
    
    pdf_filename = pdf_filename_map.get(vol_id)
    if not pdf_filename:
        raise HTTPException(status_code=404, detail="Volume not found.")
        
    full_pdf_path = os.path.join(BASE_DIR, pdf_filename)
    if not os.path.exists(full_pdf_path):
        raise HTTPException(status_code=404, detail="PDF source file missing.")

    try:
        doc = fitz.open(full_pdf_path)
        if pdf_page < 1 or pdf_page > len(doc):
            doc.close()
            raise HTTPException(status_code=400, detail="Page number out of range.")
            
        page = doc[pdf_page - 1]
        pix = page.get_pixmap(dpi=120)
        img_bytes = pix.tobytes("jpeg")
        doc.close()
        return Response(content=img_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
def search_handbook(
    q: str = Query(..., min_length=2, description="Search query string"),
    vol_id: Optional[str] = None,
    limit: int = 50
):
    conn = get_db_connection()
    cursor = conn.cursor()
    sanitized_q = q.replace('"', '""')
    
    if vol_id and vol_id != "all":
        sql = """
            SELECT vol_id, pdf_page, printed_page, chapter_num, chapter_title, section_num, section_title, snippet(pages_fts, 7, '<mark>', '</mark>', '...', 25) AS snippet
            FROM pages_fts
            WHERE pages_fts MATCH ? AND vol_id = ?
            LIMIT ?
        """
        cursor.execute(sql, (f'"{sanitized_q}" OR {sanitized_q}', vol_id, limit))
    else:
        sql = """
            SELECT vol_id, pdf_page, printed_page, chapter_num, chapter_title, section_num, section_title, snippet(pages_fts, 7, '<mark>', '</mark>', '...', 25) AS snippet
            FROM pages_fts
            WHERE pages_fts MATCH ?
            LIMIT ?
        """
        cursor.execute(sql, (f'"{sanitized_q}" OR {sanitized_q}', limit))

    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "vol_id": r["vol_id"],
            "pdf_page": r["pdf_page"],
            "printed_page": r["printed_page"],
            "chapter_num": r["chapter_num"],
            "chapter_title": r["chapter_title"],
            "section_num": r["section_num"],
            "section_title": r["section_title"],
            "snippet": r["snippet"]
        })

    return {"query": q, "count": len(results), "results": results}

# Unit Converter Route
class UnitConvertRequest(BaseModel):
    value: float
    category: str
    from_unit: str
    to_unit: str

@app.post("/api/tools/convert")
def convert_unit_api(req: UnitConvertRequest):
    try:
        return convert_units(req.value, req.category, req.from_unit, req.to_unit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Calculator Route
class CalculateRequest(BaseModel):
    calc_type: str
    params: Dict

@app.post("/api/tools/calculate")
def calculate_api(req: CalculateRequest):
    try:
        p = req.params
        if req.calc_type == "darcy_liquid":
            return calculate_darcy_liquid(
                k_md=float(p.get("k_md", 100)),
                h_ft=float(p.get("h_ft", 50)),
                p_diff_psi=float(p.get("p_diff_psi", 500)),
                mu_cp=float(p.get("mu_cp", 1.5)),
                b_vol=float(p.get("b_vol", 1.2)),
                r_w_ft=float(p.get("r_w_ft", 0.33)),
                r_e_ft=float(p.get("r_e_ft", 660))
            )
        elif req.calc_type == "hydrostatic":
            return calculate_hydrostatic_pressure(
                mud_weight_ppg=float(p.get("mud_weight_ppg", 10.0)),
                tvd_ft=float(p.get("tvd_ft", 10000))
            )
        elif req.calc_type == "productivity_index":
            return calculate_productivity_index(
                q_stbd=float(p.get("q_stbd", 500)),
                p_res_psi=float(p.get("p_res_psi", 3000)),
                p_wf_psi=float(p.get("p_wf_psi", 2200))
            )
        elif req.calc_type == "api_gravity":
            return calculate_api_gravity(
                sg_water_1=float(p.get("sg_water_1", 0.85))
            )
        else:
            raise HTTPException(status_code=400, detail=f"Calculator type '{req.calc_type}' not supported.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# User Personalization APIs with Delete functionality
@app.get("/api/user/state")
def get_user_state_api():
    return load_user_state()

@app.post("/api/user/bookmark")
def add_bookmark(bookmark: Dict):
    state = load_user_state()
    # Add unique ID if not present
    bookmark["id"] = bookmark.get("id", f"bm_{int(os.urandom(4).hex(), 16)}")
    state["bookmarks"].append(bookmark)
    save_user_state(state)
    return {"status": "success", "bookmarks": state["bookmarks"]}

@app.delete("/api/user/bookmark/{bm_id}")
def delete_bookmark(bm_id: str):
    state = load_user_state()
    state["bookmarks"] = [b for b in state["bookmarks"] if b.get("id") != bm_id and str(b.get("pdf_page")) != bm_id]
    save_user_state(state)
    return {"status": "success", "bookmarks": state["bookmarks"]}

@app.post("/api/user/note")
def add_note(note: Dict):
    state = load_user_state()
    note["id"] = note.get("id", f"note_{int(os.urandom(4).hex(), 16)}")
    state["notes"].append(note)
    save_user_state(state)
    return {"status": "success", "notes": state["notes"]}

@app.delete("/api/user/note/{note_id}")
def delete_note(note_id: str):
    state = load_user_state()
    state["notes"] = [n for n in state["notes"] if n.get("id") != note_id]
    save_user_state(state)
    return {"status": "success", "notes": state["notes"]}

@app.post("/api/user/history")
def add_history(history_item: Dict):
    state = load_user_state()
    state["history"] = [h for h in state["history"] if not (h.get("vol_id") == history_item.get("vol_id") and h.get("pdf_page") == history_item.get("pdf_page"))]
    state["history"].insert(0, history_item)
    state["history"] = state["history"][:50]
    save_user_state(state)
    return {"status": "success", "history": state["history"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
