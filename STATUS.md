# ResQ — Project Status

## Overall Progress: **~85%**

---

## ✅ Fully Built

### Frontend (React + Vite + TypeScript + TailwindCSS)

| Feature | Details |
|---------|---------|
| Landing page | Role selection (Patient, Ambulance, Hospital, Admin) with user info form & admin login |
| Patient Portal | Report emergency form (name, age, severity, description, phone, email, location), track status with real-time ambulance tracking on Leaflet map, ETA, progress bar, driver call, nearby hospitals |
| Ambulance Portal | Vehicle status toggle (available/en_route/busy), current dispatch with StatusTimeline (5-step workflow), fleet overview |
| Hospital Portal | Dashboard (metric cards, incoming table, alerts, capacity), incoming cases, bed management, ward map (60-bed grid), ICU tracker (12 beds), staff on call, availability update, notifications, settings |
| User Portal | Map-based emergency reporting with click-to-place marker, real-time emergency markers |
| Admin Portal | Command dashboard (4 metric cards), live map (all resources + route lines), emergencies CRUD with severity/status filters, hospitals/ambulances views, demand forecast chart, hotspot map (KMeans clusters), reports (trend bar, severity breakdown), user management, system settings |
| Admin Dashboard | Standalone overview with metrics, emergencies table, alerts feed |
| Map Page | Full-screen Leaflet map with hospitals, ambulances, emergencies; layer toggles; click-to-report; route lines |
| Real-time updates | Socket.IO client with room-based subscriptions (tracking, all emergencies, per-ambulance) |
| Auth | JWT login/register/logout via AuthContext |
| Theme | Light/dark mode via ThemeContext |
| Notifications | Toast system + in-app notification listeners |
| PWA | Service worker (Workbox), manifest, icons, offline support |
| Shared UI | DataTable, MetricCard, StatusTimeline, ConfirmationModal, AlertItem, EmptyState, Skeleton, Sparkline, OfflineBanner, ResQLogo |
| Fallback data | Demo hospitals & ambulances when backend is unreachable |

### Backend (FastAPI + Python)

| Feature | Details |
|---------|---------|
| REST API | Full CRUD for `/hospitals`, `/ambulances`, `/emergencies` |
| Auth | JWT-based (register, login, me), bcrypt hashing |
| AI Severity Prediction | Keyword matching + scikit-learn LogisticRegression model |
| Resource Recommendation | Haversine distance scoring for hospitals (bed ratio + ICU bonus + distance penalty) and nearest ambulances |
| Dispatch | Assign ambulance/hospital to emergency with real-time tracking simulation (threaded, 10-min trip, WebSocket updates every 10s) |
| Socket.IO Events | `tracking_update`, `emergency_update`, `ambulance_update` with room-based pub/sub |
| Hotspot Prediction | KMeans clustering on emergency coordinates |
| Analytics | Summary counts (pending/dispatched/resolved/critical/high) |
| Notifications | SMS (Twilio), Email (SMTP), Push (FCM), In-app — all with mock fallback when unconfigured |
| Seed data | 8 hospitals, 7 ambulances, 8 emergencies across India |
| Database | SQLAlchemy ORM, PostgreSQL (with SQLAlchemy connection pooling) |
| Pydantic Schemas | Full request/response validation |

---

## 🚧 Partially Built / Needs Attention

| Feature | Status | Details |
|---------|--------|---------|
| **Tests** | ❌ Not started | No test files found (unit, integration, or e2e) |
| **Docker** | ❌ Not started | No Dockerfile or docker-compose.yml |
| **CI/CD** | ❌ Not started | No GitHub Actions or other pipeline |
| **Database Migrations** | ⚠️ Alembic in deps, not configured | `alembic` in requirements.txt but no `migrations/` directory |
| **Phone/Email fields** | ⚠️ Backend model has them, PatientPortal form includes them | `phone` field validated as 10-digit, `email` optional |
| **Push notifications** | ⚠️ Backend service has FCM code (mocked), frontend has push token field | Not wired up end-to-end |
| **Offline support** | ⚠️ Service worker exists, OfflineBanner component exists | Not deeply tested |
| **Admin auth** | ✅ Login form exists, AuthContext works | Default admin: `admin` / `admin123` |
| **Production build** | ✅ tsc + vite build configured | Not verified in production deployment |

---

## 🧭 Recommended Next Steps

1. **Add tests** — pytest for backend (fastapi.TestClient), vitest/playwright for frontend
2. **Dockerize** — Dockerfile for frontend (nginx) + backend (uvicorn) + docker-compose with PostgreSQL
3. **Configure production services** — Twilio SMS, SMTP email, FCM push via environment variables
4. **Database migrations** — Initialize Alembic and create migration scripts
5. **CI/CD pipeline** — GitHub Actions for lint → test → build → deploy
6. **End-to-end testing** — Playwright for critical flows (report → dispatch → track)
