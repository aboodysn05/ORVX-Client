# ORVX-Client

React (Vite) frontend for ORVX — a football development platform where
players track attribute progression through coach-approved drills, join
clubs, and compete in league and knockout competitions.

## Stack

React, Vite, React Router, Axios

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
```

Runs on `http://localhost:5173` by default and expects the ORVX-Server
API (see the backend repo) reachable at `VITE_API_BASE_URL`.

See the root [CLAUDE.md](../CLAUDE.md) and `.claude/skills/react-frontend`
for component, routing, and API-call conventions this project follows.
