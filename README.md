# ORVX-Client

React (Vite) frontend for ORVX — a football development platform where
players track attribute progression through coach-approved drills, join
clubs, and compete in league and knockout competitions.

## Stack

React 19, Vite, React Router, Axios, Tailwind CSS v4.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
```

Runs on `http://localhost:5173` by default and expects the ORVX-Server
API reachable at `VITE_API_BASE_URL` (e.g. `http://localhost:5000/api`).

## Scripts

| Command         | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the Vite dev server        |
| `npm run build` | Production build into `dist/`    |
| `npm run lint`  | Lint with oxlint                 |

## Project structure

```
src/
├── api/            # Axios client + endpoint modules grouped by resource
│   ├── client.js       # single axios instance, injects Bearer token
│   └── auth.js         # login / register / getCurrentUser
├── components/
│   ├── auth/           # route guards (RequireAuth, role guards later)
│   ├── layout/         # page shells (AuthCard, …)
│   └── ui/             # reusable primitives (Button, TextField, …)
├── context/        # AuthContext + AuthProvider
├── hooks/          # useAuth and other shared hooks
├── pages/          # one screen per file (Login, Register, Home, …)
└── App.jsx         # all route definitions
```

## Authentication

The frontend keeps the session in `localStorage` (`orvx_token`,
`orvx_user`) and attaches `Authorization: Bearer <token>` to every request
via the Axios client. Route access is gated by `RequireAuth`.

### API contract the frontend expects

| Method | Path             | Body                              | 2xx response        |
| ------ | ---------------- | --------------------------------- | ------------------- |
| POST   | `/auth/register` | `{ name, email, password, role }` | `{ token, user }`   |
| POST   | `/auth/login`    | `{ email, password }`             | `{ token, user }`   |
| GET    | `/auth/me`       | —                                 | `{ user }`          |

`user` is `{ id, name, email, role }` where `role` is
`player` | `coach` | `admin`. Errors return `{ message }` with a 4xx status.

See the root [CLAUDE.md](../CLAUDE.md) and `.claude/skills/react-frontend`
for the conventions this project follows.
