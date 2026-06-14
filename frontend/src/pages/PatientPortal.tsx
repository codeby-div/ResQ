import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { createEmergency, fetchEmergencies, fetchTracking } from "../services/api"
import type { Emergency, EmergencyFormData, TrackingInfo } from "../types"

const severities = [
  { value: "critical", label: "Critical", dot: "bg-status-red" },
  { value: "high", label: "High", dot: "bg-status-amber" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "low", label: "Low", dot: "bg-status-green" },
] as const

type Tab = "report" | "track"

const patientIcon = L.divIcon({
  html: '<div style="background:#C0392B;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.3)">!</div>',
  className: "", iconSize: [32, 32], iconAnchor: [16, 16],
})

const ambulanceIcon = L.divIcon({
  html: '<div style="background:#2D7A45;color:#fff;border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.3)">🚑</div>',
  className: "", iconSize: [30, 30], iconAnchor: [15, 15],
})

function MapUpdater({ tracking }: { tracking: TrackingInfo | null }) {
  const map = useMap()
  useEffect(() => {
    if (tracking && tracking.ambulance_lat && tracking.ambulance_lng) {
      const bounds = L.latLngBounds(
        [tracking.emergency_lat, tracking.emergency_lng],
        [tracking.ambulance_lat, tracking.ambulance_lng]
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [tracking, map])
  return null
}

function formatEta(seconds: number | null) {
  if (seconds === null || seconds === undefined) return "--"
  if (seconds <= 0) return "Arrived"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function TrackMap({ tracking }: { tracking: TrackingInfo | null }) {
  if (!tracking) return null
  const routePositions: [number, number][] = tracking.route.map(p => [p.lat, p.lng])

  return (
    <div className="rounded-xl overflow-hidden border border-border dark:border-border-dark" style={{ height: 280 }}>
      <MapContainer center={[tracking.emergency_lat, tracking.emergency_lng]} zoom={13} className="h-full w-full" zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater tracking={tracking} />

        <Marker position={[tracking.emergency_lat, tracking.emergency_lng]} icon={patientIcon}>
          <Popup>Your location</Popup>
        </Marker>

        {tracking.ambulance_lat && tracking.ambulance_lng && (
          <Marker position={[tracking.ambulance_lat, tracking.ambulance_lng]} icon={ambulanceIcon}>
            <Popup>{tracking.ambulance_vehicle_id || "Ambulance"}</Popup>
          </Marker>
        )}

        {routePositions.length > 1 && (
          <Polyline positions={routePositions} color="#2D7A45" weight={3} opacity={0.6} dashArray="8 4" />
        )}
      </MapContainer>
    </div>
  )
}

export default function PatientPortal() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("report")
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [tracking, setTracking] = useState<TrackingInfo | null>(null)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [severity, setSeverity] = useState<EmergencyFormData["severity"]>("medium")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const load = useCallback(async () => {
    try { setEmergencies(await fetchEmergencies()) } catch { /* ignore */ }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i) }, [load])

  // Poll tracking when viewing track tab with a submitted emergency
  useEffect(() => {
    if (tab !== "track" || !submitted) { setTracking(null); return }
    const poll = async () => {
      try { setTracking(await fetchTracking(submitted!)) } catch { /* ignore */ }
    }
    poll()
    const i = setInterval(poll, 3000)
    return () => clearInterval(i)
  }, [tab, submitted])

  const getLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude) },
      () => { setLat(20.5937); setLng(78.9629) }
    )
  }

  useEffect(() => { getLocation() }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Required"
    if (!desc.trim()) errs.desc = "Required"
    if (lat === null || lng === null) errs.location = "Location not available"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || lat === null || lng === null) return
    try {
      const data: EmergencyFormData = { patient_name: name, description: desc, latitude: lat, longitude: lng, severity }
      const created = await createEmergency(data)
      setSubmitted(created.id)
      setName(""); setDesc(""); setSeverity("medium")
      setShowSuccess(true)
      load()
    } catch { /* ignore */ }
  }

  const myEmergencies = submitted ? emergencies.filter(e => e.id === submitted) : []

  const statusSteps = [
    { key: "pending", label: "Report Received", done: tracking && tracking.status !== "pending" },
    { key: "dispatched", label: "Ambulance Dispatched", done: tracking && (tracking.status === "dispatched" || tracking.status === "resolved") },
    { key: "resolved", label: "Arrived / Resolved", done: tracking && tracking.status === "resolved" },
  ]

  return (
    <div className="min-h-screen bg-page dark:bg-[#0F1117] pb-20">
      <header className="sticky top-0 z-10 bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark px-4 h-[52px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="text-secondary hover:text-primary transition-colors text-sm mr-1" title="Back to role selection">&larr;</button>
          <span className="text-[18px] font-medium text-status-red">+</span>
          <span className="text-[15px] font-medium text-primary dark:text-primary-dark">ResQ</span>
        </div>
        <span className="text-caption text-tertiary dark:text-tertiary-dark">Patient</span>
      </header>

      <div className="p-4 space-y-4">
        {showSuccess && (
          <div className="fixed inset-0 bg-[#0F1117]/90 flex items-center justify-center z-50 p-6">
            <div className="bg-[#1A1D27] rounded-xl border border-[#22263A] p-8 max-w-sm w-full text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-900/30 border-2 border-green-700 flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D7A45" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 className="text-[17px] font-medium text-[#F0F1F3]">Record submitted successfully!</h2>
              <p className="text-[13px] text-[#5C6278]">Your emergency #{submitted} has been received. Help is on the way.</p>
              <button onClick={() => { setShowSuccess(false); setTab("track") }}
                className="w-full py-2.5 rounded-lg bg-[#C0392B] text-white text-[13px] font-medium hover:opacity-85 transition-opacity">
                Track Status
              </button>
              <button onClick={() => setShowSuccess(false)}
                className="w-full py-2 rounded-lg border border-[#22263A] text-[13px] text-[#5C6278] hover:text-[#F0F1F3] transition-colors">
                Report Another
              </button>
            </div>
          </div>
        )}

        {tab === "report" ? (
          <div className="card space-y-4">
            <h1 className="text-page-title text-primary dark:text-primary-dark">Report Emergency</h1>
            <p className="text-caption text-tertiary dark:text-tertiary-dark">Fill in the details below to request help.</p>

            <div>
              <label className="text-section-label text-tertiary dark:text-tertiary-dark">Patient Name</label>
              <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })) }}
                className={`mt-1.5 w-full h-[44px] rounded border bg-surface2 dark:bg-surface2-dark px-3 text-body text-primary dark:text-primary-dark focus:border-secondary transition-colors ${errors.name ? "border-status-red" : "border-border dark:border-border-dark"}`}
                placeholder="Full name" />
              {errors.name && <p className="text-caption text-status-red mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-section-label text-tertiary dark:text-tertiary-dark">Severity</label>
              <div className="flex gap-2 mt-1.5">
                {severities.map(s => (
                  <button key={s.value} onClick={() => setSeverity(s.value as EmergencyFormData["severity"])}
                    className={`min-tap flex-1 rounded text-caption transition-all duration-150 ${
                      severity === s.value
                        ? `${s.dot} text-white`
                        : "border border-border dark:border-border-dark text-secondary dark:text-secondary-dark"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-section-label text-tertiary dark:text-tertiary-dark">Description</label>
              <textarea value={desc} onChange={e => { setDesc(e.target.value); setErrors(p => ({ ...p, desc: "" })) }}
                rows={4}
                className={`mt-1.5 w-full rounded border bg-surface2 dark:bg-surface2-dark px-3 py-2 text-body text-primary dark:text-primary-dark focus:border-secondary transition-colors ${errors.desc ? "border-status-red" : "border-border dark:border-border-dark"}`}
                placeholder="Describe the situation..." />
              {errors.desc && <p className="text-caption text-status-red mt-1">{errors.desc}</p>}
            </div>

            <div className="flex items-center justify-between text-caption text-tertiary dark:text-tertiary-dark">
              <span>{lat && lng ? `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}` : "📍 Detecting location..."}</span>
              <button onClick={getLocation} className="text-accent dark:text-primary-dark underline">Refresh</button>
            </div>
            {errors.location && <p className="text-caption text-status-red">{errors.location}</p>}

            <button onClick={handleSubmit}
              className="w-full h-[44px] rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] text-body font-medium hover:opacity-85 active:scale-[0.98] transition-all duration-150">
              Submit Emergency
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-page-title text-primary dark:text-primary-dark">Track Status</h1>
              {tracking && tracking.status === "dispatched" && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-green animate-pulse-ring" />
                  <span className="text-[13px] font-medium tabular-nums text-status-green">{formatEta(tracking.eta_seconds)}</span>
                </div>
              )}
            </div>

            {myEmergencies.length === 0 ? (
              <div className="card py-8 text-center">
                <p className="text-caption text-tertiary dark:text-tertiary-dark">No emergencies yet</p>
                <p className="text-caption text-secondary dark:text-secondary-dark mt-1">Submit a report above to track it here</p>
              </div>
            ) : (
              <>
                {/* Live Map */}
                {tracking && (tracking.status === "dispatched" || tracking.status === "resolved") && (
                  <TrackMap tracking={tracking} />
                )}

                {/* Status Timeline */}
                <div className="card space-y-4">
                  <h2 className="text-[15px] font-medium text-primary dark:text-primary-dark">Status</h2>

                  {tracking && tracking.status === "dispatched" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-surface2 dark:bg-surface2-dark rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full bg-status-green transition-all duration-500" style={{ width: `${tracking.progress_pct}%` }} />
                        </div>
                        <span className="text-caption tabular-nums text-secondary dark:text-secondary-dark w-10 text-right">{tracking.progress_pct}%</span>
                      </div>
                      <p className="text-caption text-tertiary dark:text-tertiary-dark">
                        {tracking.ambulance_vehicle_id || "Ambulance"} is on the way
                      </p>
                    </div>
                  )}

                  {/* Vertical timeline steps */}
                  <div className="space-y-0">
                    {statusSteps.map((step, i) => (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center w-5">
                          <div className={`w-3 h-3 rounded-full border-2 mt-0.5 ${
                            step.done
                              ? "bg-status-green border-status-green"
                              : step.key === tracking?.status
                              ? "bg-status-amber border-status-amber animate-pulse-ring"
                              : "bg-surface2 dark:bg-surface2-dark border-border dark:border-border-dark"
                          }`} />
                          {i < statusSteps.length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[24px] ${
                              step.done ? "bg-status-green" : "bg-border dark:bg-border-dark"
                            }`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-[13px] ${
                            step.done ? "text-primary dark:text-primary-dark font-medium" :
                            step.key === tracking?.status ? "text-primary dark:text-primary-dark" :
                            "text-tertiary dark:text-tertiary-dark"
                          }`}>{step.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency info card */}
                {myEmergencies.map(e => (
                  <div key={e.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-body font-medium text-primary dark:text-primary-dark">{e.patient_name}</p>
                        <p className="text-caption text-tertiary dark:text-tertiary-dark mt-1">{e.description}</p>
                      </div>
                      <span className={`micro-tag ${
                        e.severity === "critical" ? "micro-tag-critical" :
                        e.severity === "high" ? "micro-tag-warning" : "micro-tag-ok"
                      }`}>{e.severity}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-border dark:border-border-dark flex" style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {(["report", "track"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-caption transition-colors duration-150 ${
              tab === t ? "text-accent dark:text-primary-dark" : "text-tertiary dark:text-tertiary-dark"
            }`}>
            {t === "report" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            )}
            {t === "report" ? "Report" : "Track"}
          </button>
        ))}
      </nav>
    </div>
  )
}
