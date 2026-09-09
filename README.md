# OVRX — Web Client

The React single-page application for **OVRX**, a football-development
platform that turns real-world training into verified, measurable progress.
This repository is the **frontend only**; the REST API it talks to lives in
a separate repository, **OVRX-Server**.

---

## Table of contents

- [What is OVRX?](#what-is-ovrx)
- [How it works](#how-it-works)
- [Roles and what each one can do](#roles-and-what-each-one-can-do)
- [User requirements](#user-requirements)
- [Technologies](#technologies)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Application routes](#application-routes)
- [Authentication and API contract](#authentication-and-api-contract)
- [Building for production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## What is OVRX?

OVRX is a development platform for grassroots and academy footballers. A
player completes a self-assessment to generate a FIFA-style **player card**
with six position-aware attributes and an overall rating. From then on, the
only way the numbers move is through **coach-verified training**: the player
records a drill, uploads the clip, and a licensed reviewer approves or
returns it. Approved work credits attribute points; missed blocks let the
rating drift back down.

On top of the individual progression sits a **club and competition layer** —
players are signed to one of eight official clubs, coaches manage their
roster, and admins run a league season and a knockout cup whose results feed
back into player form.

The product name is **OVRX**. This client repository is published on GitHub
as `ORVX-Client` and the API as `ORVX-Server` — the slugs keep an older
spelling, but the platform itself is OVRX everywhere it is shown to users.

---

## How it works

```
Register ──▶ Player self-assessment ──▶ Player card created
                                             │
                                             ▼
                        Build a training session from assigned drills
                                             │
                                             ▼
                            Complete the workout, upload video proof
                                             │
                                             ▼
                 ┌───────────────────────────────────────────────┐
                 │  Review routing (decided by the server)        │
                 │  • No club yet  ──▶ Platform Evaluator         │
                 │  • Signed to a club ──▶ that club's head coach │
                 └───────────────────────────────────────────────┘
                                             │
                              approve ◀──────┴──────▶ return with notes
                                 │
                                 ▼
              Attribute points credited · overall & tier recomputed
                                 │
                                 ▼
        Released free agents can apply to a club · coaches sign them
                                 │
                                 ▼
                 Admin runs the league & cup · results update form
```

Key rules the UI enforces or reflects:

- The **player card is created once**. There is no "edit card" flow — the
  only way to change it after the baseline is coach-verified training.
- A player holds **at most one open club application** at a time.
- The player **never chooses their reviewer**. Routing is automatic: the
  Platform Evaluator handles baseline sessions and anyone without a club;
  a signed player's proof always goes to their own club's head coach.
- A club roster is capped (16 players); the league has a fixed number of
  matchdays and the cup has semi-finals and a final.

---

## Roles and what each one can do

| Role | Entry point | Capabilities in this client |
| ---- | ----------- | --------------------------- |
| **Player** | `/register` as a player | Complete the assessment, build & run training sessions, upload video proof, view the player card and attribute radar, apply to / withdraw from a club, browse drills and league tables. |
| **Coach** | `/register` as a coach → `/coach/gateway` | Submit a coaching application (club name, licence, experience). Once an admin approves it: manage the club profile, sign/release players in the squad manager, and review the training submissions of players on that roster. |
| **Platform Evaluator** | A coach account flagged as evaluator | A dedicated console (`/coach/evaluator`) for reviewing baseline sessions and the sessions of players who are not on any club roster, including video playback, per-drill boost breakdown, and a verified attribute card. |
| **Admin** | An admin account | Overview dashboard, coach-application requests queue, club allocation (provision into the 8 slots / archive / restore), drill catalogue CRUD, and the competition engine (fixtures, results with goalscorers, standings, bracket). |

---

## User requirements

**To run or develop this client**

- **Node.js** ≥ 20.19 (LTS recommended; the project is developed on Node 24).
- **npm** ≥ 10 (bundled with modern Node).
- A running instance of **OVRX-Server** reachable over HTTP, and its base
  URL configured via `VITE_API_BASE_URL`. The server in turn needs
  **PostgreSQL**. See the OVRX-Server README for its setup.
- A modern evergreen browser (Chrome, Edge, Firefox, or Safari — current
  versions). The app is a client-rendered SPA and requires JavaScript and
  `localStorage`.

**To use the deployed app as an end user**

- An account created through the in-app registration form, choosing a role
  of **player** or **coach** (admin and evaluator accounts are provisioned
  by an operator).
- For players: the ability to record short training clips on a phone and
  upload a link/file reference.
- Coach accounts are inactive until an admin approves the coaching
  application.

---

## Technologies

| Area | Choice | Notes |
| ---- | ------ | ----- |
| UI library | **React 19** | Function components and hooks only. |
| Build tool / dev server | **Vite 8** | ES modules, fast HMR. |
| Routing | **React Router 7** (`react-router-dom`) | All routes declared in `src/App.jsx`. |
| HTTP client | **Axios** | One shared instance in `src/api/client.js` with a Bearer-token request interceptor and an error-shape normalizer. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) plus hand-written CSS per screen in `src/styles/` | Each page translates a design canvas into one dedicated stylesheet. |
| Linting | **oxlint** | `npm run lint`. |
| State | React Context (`AuthProvider`) + local hooks | No Redux/MobX; server data is fetched per screen, with a small stale-while-revalidate cache for coach-application status. |
| Session storage | `localStorage` (`orvx_token`, `orvx_user`) | Read by the Axios interceptor on every request. |

There is **no direct database access** from the frontend and no view logic
on the server — the boundary is a JSON REST API only.

---

## Getting started

### 1. Clone the repository

```bash
git clone git@github.com:aboodysn05/ORVX-Client.git
cd ORVX-Client
```

(or with HTTPS: `git clone https://github.com/aboodysn05/ORVX-Client.git`)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

```bash
cp .env.example .env
```

Then open `.env` and point `VITE_API_BASE_URL` at your running API. For a
local backend the default is already correct:

```
VITE_API_BASE_URL=http://localhost:5001/api
VITE_USE_MOCK_AUTH=false
```

### 4. Start the OVRX-Server API

In a separate terminal, from your clone of the **OVRX-Server** repo:

```bash
npm install
npm run migrate        # create the schema
npm run seed:clean     # fresh database: one admin + one evaluator, no demo data
npm run dev            # API on http://localhost:5001
```

### 5. Start the client

```bash
npm run dev
```

Open **http://localhost:5173**. The dev server has hot-module reload, so
saved changes appear instantly.

### 6. Create an account

- Go to `/register`, pick **Player**, and complete the assessment to see the
  full player experience.
- Pick **Coach** to see the onboarding gateway (the account stays pending
  until an admin approves it).
- Sign in as the seeded admin (credentials are printed by
  `npm run seed:clean` on the server) to approve coaches, provision clubs,
  and run competitions.

---

## Environment variables

All client env vars are read at **build time** and must be prefixed with
`VITE_`. Define them in `.env` (git-ignored) — never hardcode the API URL.

| Variable | Required | Default | Purpose |
| -------- | -------- | ------- | ------- |
| `VITE_API_BASE_URL` | Yes | `http://localhost:5001/api` | Base URL for every API request. Include the `/api` path segment. |
| `VITE_USE_MOCK_AUTH` | No | `false` | Set to `true` to develop UI with **no backend at all** — `src/api/authMock.js` fakes `/auth`. Leave `false` for normal use. |

> Port 5000 is avoided because macOS's AirPlay Receiver binds it; the
> backend uses 5001.

---

## Available scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Start the Vite dev server on port 5173 with HMR. |
| `npm run build` | Type-agnostic production build into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally to sanity-check a production build. |
| `npm run lint` | Lint the codebase with oxlint. |

---

## Project structure

```
src/
├── main.jsx                # React root; mounts <App/> inside <AuthProvider/>
├── App.jsx                 # every route definition
├── index.css               # Tailwind entry + global resets
│
├── api/                    # one module per backend resource; all use client.js
│   ├── client.js               # shared Axios instance (Bearer + error normalizer)
│   ├── auth.js  authMock.js     # login / register / me  (+ offline mock)
│   ├── players.js  drills.js  sessions.js  review.js
│   ├── clubs.js  coaches.js  competitions.js  admin.js
│
├── context/               # AuthContext + AuthProvider (session in localStorage)
├── hooks/                 # useAuth, usePlayerAssessment, useSessionBuilder,
│                          #   useActiveWorkout, useSubmitProof, usePlayerDashboard,
│                          #   useCoachApplication, useActiveSessionStatus
│
├── components/
│   ├── auth/                  # LoginForm, RegisterForm, PasswordField,
│   │                          #   RequireAuth, RequireApprovedCoach
│   ├── layout/                # SiteNav, PlayerNav, CoachNav, AdminNav/AdminShell,
│   │                          #   PageShell, SiteFooter
│   ├── assessment/            # multi-step assessment stepper + player-card preview
│   ├── dashboard/             # identity card, attributes radar, eligibility,
│   │                          #   coach column, club application hub
│   ├── submit/                # video proof panel, reviewer routing, success modal
│   └── ui/                    # small primitives (Button, ArrowIcon)
│
├── pages/                 # one screen per file (see route table below)
├── styles/                # one stylesheet per screen, translated from the designs
└── utils/                # attributes, player card / profile helpers, redirects
```

Conventions (also in the repo's `.claude/skills/react-frontend`):

- Function components + hooks; no class components.
- API calls go through `src/api/*` modules, never `axios` directly in a
  component.
- The API base URL is only ever read from `import.meta.env.VITE_API_BASE_URL`.
- Each screen owns a dedicated stylesheet in `src/styles/`.

---

## Application routes

| Path | Access | Screen |
| ---- | ------ | ------ |
| `/` | Public | Landing / hero page (live drill count, clubs, league table) |
| `/drills` | Public | Drill catalogue with category & level filters |
| `/leagues` | Public | League table, top scorers, cup bracket, fixtures & results |
| `/about` | Public | About the platform |
| `/login`, `/register` | Public | Auth screen (sign in / create account) |
| `/assessment` | Auth | One-time player self-assessment → player card |
| `/dashboard` | Auth | Role-aware dashboard (redirects players/coaches/admins) |
| `/train` | Auth | Session builder — pick drills, sets and reps |
| `/workout` | Auth | Active workout HUD — tick off sets |
| `/submit-proof` | Auth | Upload video proof; shows the auto-assigned reviewer |
| `/settings` | Auth | Account settings (name, password) |
| `/coach/gateway` | Auth (coach) | Coaching application + pending status |
| `/coach/club` | Approved coach | Club profile |
| `/coach/squad` | Approved coach | Squad manager — sign / release / set position |
| `/coach/review` | Approved coach | Review queue for the club's roster |
| `/coach/evaluator` | Evaluator | Platform Evaluator console (baseline + free-agent reviews) |
| `/admin` | Admin | Overview dashboard |
| `/admin/requests` | Admin | Coach-application requests queue |
| `/admin/clubs` | Admin | Club allocation — provision / archive / restore |
| `/admin/drills` | Admin | Drill catalogue CRUD |
| `/admin/leagues` | Admin | Competition engine — fixtures, results, standings, bracket |
| `*` | — | Redirects to `/` |

`RequireAuth` gates any authenticated route; `RequireApprovedCoach`
additionally checks that the coaching application has been approved.

---

## Authentication and API contract

The client stores the session in `localStorage` under `orvx_token` and
`orvx_user`, and the Axios instance attaches `Authorization: Bearer <token>`
to every request. On sign-out the keys are cleared and the
coach-application cache is invalidated.

The backend's error handler returns `{ error: { message, code } }`; the
client's response interceptor copies `error.message` up to a flat
`data.message` so every form can read the same field.

Minimum auth endpoints the client expects from OVRX-Server:

| Method | Path | Body | 2xx response |
| ------ | ---- | ---- | ------------ |
| `POST` | `/auth/register` | `{ name, email, password, role }` | `{ token, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `{ token, user }` |
| `GET`  | `/auth/me` | — | `{ user }` |
| `PATCH`| `/auth/me` | `{ name?, password? }` | `{ user }` |

`user` is `{ id, name, email, role }` with `role` one of
`player | coach | admin`. The rest of the surface (players, drills,
sessions, review, clubs, coaches, competitions, admin) is documented in the
OVRX-Server repository.

---

## Building for production

```bash
npm run build      # outputs static assets to dist/
npm run preview     # optional: serve dist/ locally at http://localhost:4173
```

`dist/` is a fully static bundle — deploy it to any static host (Netlify,
Vercel, GitHub Pages, S3 + CloudFront, nginx). Because env vars are inlined
at build time, set `VITE_API_BASE_URL` in the deploy environment **before**
running `npm run build`. Configure the host to serve `index.html` for
unknown paths (SPA fallback) so client-side routing works on refresh.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| ------- | ------------------ |
| Every request fails with a network error | `VITE_API_BASE_URL` is wrong or the API isn't running. Restart `npm run dev` after editing `.env` — Vite only reads env at startup. |
| Login works but reloads log you out | `localStorage` blocked (private window / strict browser settings). |
| Coach account can't reach `/coach/club` | The coaching application hasn't been approved by an admin yet. |
| League / clubs pages are empty | Fresh database — an admin must provision clubs and run fixtures first. |
| CORS errors in the console | Enable the client origin in the OVRX-Server CORS config. |
| Port 5173 already in use | Another Vite process is running, or pass `--port` to `npm run dev`. |

---

## License

MIT © 2026 Abdullah Yaseen. See [LICENSE](LICENSE).
