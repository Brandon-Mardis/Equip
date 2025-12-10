import os
import uuid
from datetime import datetime, date
from contextlib import contextmanager
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

# CORS for local dev and Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database config - uses postgres in prod, falls back to in-memory for local dev

DATABASE_URL = os.environ.get("POSTGRES_URL", "")

# Vercel uses POSTGRES_URL but psycopg needs postgresql:// prefix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Check if we have a database connection
USE_DATABASE = bool(DATABASE_URL)

if USE_DATABASE:
    import psycopg

# Sample data for demo

SEED_ASSETS = [
    ("EQ-LAP-001", "Dell XPS 15", "Laptop", "Assigned", "HQ", "Sam Rivera", "2024-03-15"),
    ("EQ-LAP-002", "MacBook Pro 16\"", "Laptop", "Available", "HQ", None, "2024-01-20"),
    ("EQ-MON-042", "Dell UltraSharp 27\"", "Monitor", "Assigned", "HQ", "Sam Rivera", "2024-02-10"),
    ("EQ-MON-043", "LG 4K Monitor", "Monitor", "Maintenance", "New York", None, "2023-11-05"),
    ("EQ-DOC-018", "Dell WD19 Dock", "Docking Station", "Assigned", "HQ", "Sam Rivera", "2024-03-15"),
    ("EQ-LAP-003", "ThinkPad X1 Carbon", "Laptop", "Broken", "Remote", "Jordan Lee", "2023-08-22"),
    ("EQ-PER-089", "Logitech MX Master 3", "Peripheral", "Assigned", "HQ", "Sam Rivera", "2024-03-15"),
    ("EQ-MON-044", "Samsung 32\" Curved", "Monitor", "Available", "New York", None, "2024-04-01"),
    ("EQ-LAP-004", "HP EliteBook 840", "Laptop", "Assigned", "New York", "Alex Chen", "2024-02-28"),
    ("EQ-LAP-005", "Dell Latitude 5520", "Laptop", "Available", "HQ", None, "2024-05-10"),
    ("EQ-DOC-019", "Lenovo USB-C Dock", "Docking Station", "Available", "HQ", None, "2024-06-01"),
    ("EQ-PER-090", "Logitech MX Keys", "Peripheral", "Assigned", "HQ", "Alex Chen", "2024-02-28"),
]

SEED_REQUESTS = [
    ("New Equipment", None, "Need a second monitor for productivity", "Normal", "Pending", "Sam Rivera", "2025-01-08"),
    ("Repair", "ThinkPad X1 Carbon", "Screen flickering issue", "High", "Approved", "Jordan Lee", "2025-01-07"),
    ("Replace", "Logitech Keyboard", "Keys are worn out and sticky", "Low", "Completed", "Alex Chen", "2025-01-05"),
    ("New Equipment", None, "Requesting docking station for home office", "Normal", "Denied", "Taylor Kim", "2025-01-04"),
    ("Repair", "Dell Monitor", "Dead pixels appearing", "Normal", "Pending", "Sam Rivera", "2025-01-02"),
]

def create_seed_data():
    """Create seed data for a new session."""
    assets = []
    for i, a in enumerate(SEED_ASSETS, 1):
        assets.append({
            "id": i, "tag": a[0], "name": a[1], "category": a[2],
            "status": a[3], "site": a[4], "assignedTo": a[5], "purchaseDate": a[6]
        })
    requests = []
    for i, r in enumerate(SEED_REQUESTS, 1):
        requests.append({
            "id": i, "type": r[0], "asset": r[1], "description": r[2],
            "priority": r[3], "status": r[4], "user": r[5], "createdAt": r[6]
        })
    return {"assets": assets, "requests": requests, "next_asset_id": 13, "next_request_id": 6}

# In-memory session storage
memory_sessions = defaultdict(create_seed_data)

# Database helpers (only used when postgres is available)

if USE_DATABASE:
    @contextmanager
    def get_db():
        """Get database connection with auto-commit and cleanup."""
        conn = psycopg.connect(DATABASE_URL)
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init_db():
        """Create tables if they don't exist."""
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS sessions (
                        id UUID PRIMARY KEY,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS assets (
                        id SERIAL PRIMARY KEY,
                        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
                        tag TEXT NOT NULL,
                        name TEXT NOT NULL,
                        category TEXT NOT NULL,
                        status TEXT DEFAULT 'Available',
                        site TEXT NOT NULL,
                        assigned_to TEXT,
                        purchase_date DATE DEFAULT CURRENT_DATE
                    )
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS requests (
                        id SERIAL PRIMARY KEY,
                        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
                        type TEXT NOT NULL,
                        asset TEXT,
                        description TEXT NOT NULL,
                        priority TEXT DEFAULT 'Normal',
                        status TEXT DEFAULT 'Pending',
                        user_name TEXT NOT NULL,
                        created_at DATE DEFAULT CURRENT_DATE
                    )
                """)

    def seed_session_db(session_id: str):
        """Create a new session and populate with seed data (database mode)."""
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO sessions (id) VALUES (%s)", (session_id,))
                for asset in SEED_ASSETS:
                    cur.execute("""
                        INSERT INTO assets (session_id, tag, name, category, status, site, assigned_to, purchase_date)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (session_id, *asset))
                for req in SEED_REQUESTS:
                    cur.execute("""
                        INSERT INTO requests (session_id, type, asset, description, priority, status, user_name, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (session_id, *req))

    def ensure_session_db(session_id: str):
        """Ensure session exists in database, create with seed data if not."""
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM sessions WHERE id = %s", (session_id,))
                if not cur.fetchone():
                    seed_session_db(session_id)

# Request/response models

class AssetCreate(BaseModel):
    name: str
    category: str
    site: str
    notes: Optional[str] = None

class RequestCreate(BaseModel):
    type: str
    description: str
    priority: str
    user: str

class RequestUpdate(BaseModel):
    status: str


@app.on_event("startup")
def startup():
    if USE_DATABASE:
        init_db()
        print("✅ Connected to PostgreSQL database")
    else:
        print("⚠️  No POSTGRES_URL found, using in-memory storage (data resets on restart)")


def generate_asset_tag(category: str, session_id: str) -> str:
    prefix_map = {
        "Laptop": "LAP", "Monitor": "MON", "Docking Station": "DOC",
        "Peripheral": "PER", "Other": "OTH",
    }
    prefix = prefix_map.get(category, "OTH")
    
    if USE_DATABASE:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) FROM assets WHERE session_id = %s AND category = %s",
                    (session_id, category)
                )
                count = cur.fetchone()[0] + 1
    else:
        session = memory_sessions[session_id]
        count = len([a for a in session["assets"] if a["category"] == category]) + 1
    
    return f"EQ-{prefix}-{count:03d}"

# API routes

@app.get("/api/assets")
def get_assets(
    status: Optional[str] = None,
    user: Optional[str] = None,
    x_session_id: str = Header(...)
):
    if USE_DATABASE:
        ensure_session_db(x_session_id)
        with get_db() as conn:
            with conn.cursor() as cur:
                query = "SELECT id, tag, name, category, status, site, assigned_to, purchase_date FROM assets WHERE session_id = %s"
                params = [x_session_id]
                if status and status != "all":
                    query += " AND status = %s"
                    params.append(status)
                if user:
                    query += " AND assigned_to = %s"
                    params.append(user)
                cur.execute(query, params)
                rows = cur.fetchall()
        return [{"id": r[0], "tag": r[1], "name": r[2], "category": r[3], "status": r[4],
                 "site": r[5], "assignedTo": r[6], "purchaseDate": str(r[7]) if r[7] else None} for r in rows]
    else:
        # In-memory mode
        session = memory_sessions[x_session_id]
        result = session["assets"]
        if status and status != "all":
            result = [a for a in result if a["status"] == status]
        if user:
            result = [a for a in result if a["assignedTo"] == user]
        return result


@app.post("/api/assets")
def create_asset(asset: AssetCreate, x_session_id: str = Header(...)):
    tag = generate_asset_tag(asset.category, x_session_id)
    
    if USE_DATABASE:
        ensure_session_db(x_session_id)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO assets (session_id, tag, name, category, status, site, purchase_date)
                    VALUES (%s, %s, %s, %s, 'Available', %s, CURRENT_DATE)
                    RETURNING id, tag, name, category, status, site, assigned_to, purchase_date
                """, (x_session_id, tag, asset.name, asset.category, asset.site))
                r = cur.fetchone()
        return {"id": r[0], "tag": r[1], "name": r[2], "category": r[3], "status": r[4],
                "site": r[5], "assignedTo": r[6], "purchaseDate": str(r[7]) if r[7] else None}
    else:
        session = memory_sessions[x_session_id]
        new_asset = {
            "id": session["next_asset_id"], "tag": tag, "name": asset.name,
            "category": asset.category, "status": "Available", "site": asset.site,
            "assignedTo": None, "purchaseDate": date.today().isoformat()
        }
        session["assets"].append(new_asset)
        session["next_asset_id"] += 1
        return new_asset


@app.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: int, x_session_id: str = Header(...)):
    if USE_DATABASE:
        ensure_session_db(x_session_id)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM assets WHERE id = %s AND session_id = %s RETURNING id", (asset_id, x_session_id))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Asset not found")
        return {"message": "Asset deleted"}
    else:
        session = memory_sessions[x_session_id]
        for i, a in enumerate(session["assets"]):
            if a["id"] == asset_id:
                session["assets"].pop(i)
                return {"message": "Asset deleted"}
        raise HTTPException(status_code=404, detail="Asset not found")


@app.get("/api/requests")
def get_requests(
    status: Optional[str] = None,
    user: Optional[str] = None,
    x_session_id: str = Header(...)
):
    if USE_DATABASE:
        ensure_session_db(x_session_id)
        with get_db() as conn:
            with conn.cursor() as cur:
                query = "SELECT id, type, asset, description, priority, status, user_name, created_at FROM requests WHERE session_id = %s"
                params = [x_session_id]
                if status and status != "all":
                    query += " AND status = %s"
                    params.append(status)
                if user:
                    query += " AND user_name = %s"
                    params.append(user)
                cur.execute(query, params)
                rows = cur.fetchall()
        return [{"id": r[0], "type": r[1], "asset": r[2], "description": r[3], "priority": r[4],
                 "status": r[5], "user": r[6], "createdAt": str(r[7]) if r[7] else None} for r in rows]
    else:
        session = memory_sessions[x_session_id]
        result = session["requests"]
        if status and status != "all":
            result = [r for r in result if r["status"] == status]
        if user:
            result = [r for r in result if r["user"] == user]
        return result


@app.post("/api/requests")
def create_request(request: RequestCreate, x_session_id: str = Header(...)):
    if USE_DATABASE:
        ensure_session_db(x_session_id)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO requests (session_id, type, description, priority, status, user_name, created_at)
                    VALUES (%s, %s, %s, %s, 'Pending', %s, CURRENT_DATE)
                    RETURNING id, type, asset, description, priority, status, user_name, created_at
                """, (x_session_id, request.type, request.description, request.priority, request.user))
                r = cur.fetchone()
        return {"id": r[0], "type": r[1], "asset": r[2], "description": r[3], "priority": r[4],
                "status": r[5], "user": r[6], "createdAt": str(r[7]) if r[7] else None}
    else:
        session = memory_sessions[x_session_id]
        new_req = {
            "id": session["next_request_id"], "type": request.type, "asset": None,
            "description": request.description, "priority": request.priority,
            "status": "Pending", "user": request.user, "createdAt": date.today().isoformat()
        }
        session["requests"].append(new_req)
        session["next_request_id"] += 1
        return new_req


@app.patch("/api/requests/{request_id}")
def update_request(request_id: int, update: RequestUpdate, x_session_id: str = Header(...)):
    if USE_DATABASE:
        ensure_session_db(x_session_id)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE requests SET status = %s WHERE id = %s AND session_id = %s
                    RETURNING id, type, asset, description, priority, status, user_name, created_at
                """, (update.status, request_id, x_session_id))
                r = cur.fetchone()
                if not r:
                    raise HTTPException(status_code=404, detail="Request not found")
        return {"id": r[0], "type": r[1], "asset": r[2], "description": r[3], "priority": r[4],
                "status": r[5], "user": r[6], "createdAt": str(r[7]) if r[7] else None}
    else:
        session = memory_sessions[x_session_id]
        for req in session["requests"]:
            if req["id"] == request_id:
                req["status"] = update.status
                return req
        raise HTTPException(status_code=404, detail="Request not found")


@app.get("/api/stats")
def get_stats(x_session_id: str = Header(...)):
    if USE_DATABASE:
        ensure_session_db(x_session_id)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM assets WHERE session_id = %s", (x_session_id,))
                total = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM assets WHERE session_id = %s AND status = 'Assigned'", (x_session_id,))
                assigned = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM assets WHERE session_id = %s AND status = 'Available'", (x_session_id,))
                available = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM assets WHERE session_id = %s AND status = 'Maintenance'", (x_session_id,))
                maintenance = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM assets WHERE session_id = %s AND status = 'Broken'", (x_session_id,))
                broken = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM requests WHERE session_id = %s AND status = 'Pending'", (x_session_id,))
                pending = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM requests WHERE session_id = %s AND status = 'Approved'", (x_session_id,))
                approved = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM requests WHERE session_id = %s AND status = 'Denied'", (x_session_id,))
                denied = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM requests WHERE session_id = %s AND status = 'Completed'", (x_session_id,))
                completed = cur.fetchone()[0]
        return {"totalAssets": total, "assigned": assigned, "available": available, "maintenance": maintenance,
                "broken": broken, "pendingRequests": pending, "approvedRequests": approved,
                "deniedRequests": denied, "completedRequests": completed}
    else:
        session = memory_sessions[x_session_id]
        assets = session["assets"]
        reqs = session["requests"]
        return {
            "totalAssets": len(assets),
            "assigned": len([a for a in assets if a["status"] == "Assigned"]),
            "available": len([a for a in assets if a["status"] == "Available"]),
            "maintenance": len([a for a in assets if a["status"] == "Maintenance"]),
            "broken": len([a for a in assets if a["status"] == "Broken"]),
            "pendingRequests": len([r for r in reqs if r["status"] == "Pending"]),
            "approvedRequests": len([r for r in reqs if r["status"] == "Approved"]),
            "deniedRequests": len([r for r in reqs if r["status"] == "Denied"]),
            "completedRequests": len([r for r in reqs if r["status"] == "Completed"]),
        }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "database": USE_DATABASE, "timestamp": datetime.now().isoformat()}


@app.get("/api/cleanup")
def cleanup_old_sessions():
    """Delete sessions older than 24 hours. Called by Vercel cron daily."""
    if USE_DATABASE:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '24 hours' RETURNING id")
                deleted = cur.fetchall()
        return {"deleted_sessions": len(deleted), "timestamp": datetime.now().isoformat()}
    else:
        return {"message": "Cleanup not needed in memory mode", "timestamp": datetime.now().isoformat()}
