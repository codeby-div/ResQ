# ResQ — AI Context File
# Paste this file as the first message of any AI session.
# Keep the "Current Task" section updated every session.

## What this project is
ResQ is a real-time emergency resource allocation system.
React frontend + FastAPI backend + PostgreSQL + Socket.IO.
Five actor types: citizen, ambulance_crew, hospital_staff, dispatcher, admin.

## Project state (update this as features complete)
| Area              | Status  | Notes                                      |
|-------------------|---------|--------------------------------------------|
| Backend CRUD      | ✅ Done  | hospitals, ambulances, users, emergency_requests |
| JWT Auth          | ✅ Done  | login, register, me, role-based protection |
| Recommendations   | ✅ Done  | haversine + capacity scoring               |
| Socket.IO         | ✅ Done  | tracking_update, emergency_update          |
| AI severity       | ✅ Done  | keyword + LogisticRegression               |
| KMeans hotspot    | ✅ Done  | /analytics/hotspots                        |
| All frontend portals | ✅ Done | Patient, Ambulance, Hospital, Admin, Map  |
| PWA               | ✅ Done  | service worker, manifest, offline banner   |
| Docker            | ✅ Done  | Dockerfile.backend, Dockerfile.frontend, docker-compose.yml |
| Alembic           | ✅ Done  | alembic/versions/0001_initial_schema.py    |
| Tests             | ✅ Done  | tests/unit/ + tests/integration/           |
| CI/CD             | ✅ Done  | .github/workflows/ci.yml                  |
| Notifications     | ⚠️ Mock  | Twilio/SMTP/FCM code exists, env vars needed |
| Deployment        | ⏳ Todo  | Render (backend) + Vercel (frontend)       |

## Folder → responsibility (never read the files, trust this map)
```
backend/
  app/
    api/v1/endpoints/   — thin route handlers, call CRUD, use Depends(get_db)
    core/               — config.py, database.py, exceptions.py, security.py, geo.py
    crud/               — all DB logic; raises typed exceptions from core/exceptions.py
    models/             — SQLAlchemy ORM (Mapped[] style); enums.py has all Enums
    schemas/            — Pydantic v2; pattern: *Create / *Update / *Read / *ListResponse
    main.py             — FastAPI app + all exception handlers (404/409/422/401/403)
  tests/
    conftest.py         — SQLite test DB, client fixture, register_user(), get_token()
    unit/               — per-resource tests (test_auth.py, test_hospitals.py, test_ambulances.py)
    integration/        — full lifecycle tests (test_emergency_lifecycle.py)
  alembic/versions/     — 0001_initial_schema.py creates all tables

frontend/
  src/
    api/                — axios modules: auth.js, hospitals.js, ambulances.js, emergencyRequests.js
    context/            — AuthContext, ThemeContext
    pages/              — PatientPortal, AmbulancePortal, HospitalPortal, AdminPortal, MapPage
    components/         — DataTable, MetricCard, StatusTimeline, ConfirmationModal, etc.
  public/               — PWA manifest, service worker, icons
```

## Conventions — follow these exactly, never invent new patterns
- **Backend errors**: raise a class from `core/exceptions.py`, never `HTTPException` directly.
  New error classes go in exceptions.py; register their handler in main.py.
- **New endpoint**: model → schema → crud function → endpoint.
  Route files are thin: one Depends(get_db), one crud call, return.
- **Auth**: `Depends(get_current_user)` for any authenticated endpoint.
  `Depends(require_role(UserRole.X, UserRole.Y))` to restrict by role.
- **Pagination**: all list endpoints return `{total, page, page_size, items}`.
  Use `pagination_params` dependency from `api/dependencies.py`.
- **Frontend API calls**: always go through `src/api/*.js` — never call axios directly from components.
- **Colors**: bg #0A0E14, surface #121922, surface2 #1A222E, line #2A3441,
  ink #E7ECF2, mute #8C99AC, accent #4F8CFF, ok #2BD99F, warn #FFB454, crit #FF5C62.
- **Fonts**: Space Grotesk (display), Inter (body), IBM Plex Mono (live data).
- **Status colors**: ok/warn/crit used identically on gauges, map pins, severity tags.

## Request lifecycle (state machine — do not change without updating ALLOWED_REQUEST_TRANSITIONS in enums.py)
requested → matched → dispatched → en_route → arrived → completed
Any state → cancelled

## Key env vars (never hardcode)
SECRET_KEY, POSTGRES_*, TWILIO_*, SMTP_*, FCM_SERVER_KEY, VITE_API_BASE_URL

## Current task — UPDATE THIS EVERY SESSION
**What we're doing now**: Setting up production deployment (Render + Vercel).
**Files to touch**: render.yaml (new), vercel.json (new), .github/workflows/ci.yml (update deploy step).
**Do NOT touch**: anything in app/models/, app/crud/, alembic/versions/ — those are stable.
**Last completed**: Docker + Alembic + Tests + CI/CD (Phase 1 of production readiness).
