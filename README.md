# Equip

IT asset management system for tracking company equipment.

## What it does

- Track laptops, monitors, docking stations, peripherals
- Assign equipment to employees 
- Handle repair/replacement requests
- Multi-site support (HQ, remote offices)
- Role-based access (admin vs employee views)

## Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router

**Backend:**
- Python FastAPI (Vercel Serverless)
- In-memory data store (demo-ready)

## Run locally

```bash
# Install dependencies
npm install
pip install fastapi uvicorn

# Start API (terminal 1)
python -m uvicorn api.index:app --reload --port 8000

# Start frontend (terminal 2)
npm run dev
```

Open http://localhost:5173

## Demo

Use the "Demo as Admin" or "Demo as Employee" buttons - no login needed.

**Admin features:**
- View all assets and requests
- Add new assets to inventory
- Approve or deny equipment requests

**Employee features:**
- View assigned equipment
- Submit new equipment requests

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

Built by Brandon Mardis

