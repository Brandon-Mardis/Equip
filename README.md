<h1 align="center">Equip</h1>

<p align="center">
  <img src="assets/Hero.png" alt="Equip" width="400" />
</p>

<p align="center">
  <a href="https://equip-nu.vercel.app">
    <img src="https://img.shields.io/badge/Live_Demo-Visit_Site-4A9EFF?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
</p>

---

## Features

- **Asset Tracking** — Manage laptops, monitors, docking stations, and peripherals
- **Employee Assignment** — Assign equipment and track who has what
- **Request System** — Handle repair and replacement requests with approvals
- **Multi-Site Support** — Organize assets across HQ and remote offices
- **Role-Based Access** — Admin and employee views with different permissions

---

## Screenshots

<p align="center">
  <img src="assets/Welcome.png" alt="Welcome Screen" width="49%" />
  <img src="assets/Dashboard.png" alt="Dashboard" width="49%" />
</p>

---

## Built With

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

---

<details>
<summary><strong>For Developers</strong></summary>

### Run Locally

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

### Demo Access

Use the "Demo as Admin" or "Demo as Employee" buttons - no login needed.

- **Admin**: View all assets, add inventory, approve requests
- **Employee**: View assigned equipment, submit requests

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo for automatic deployments.

</details>

---

## License

MIT © Brandon Mardis
