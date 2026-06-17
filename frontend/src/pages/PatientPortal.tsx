import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import ResQLogo from "../components/ui/ResQLogo"
import { createEmergency, fetchEmergencies, fetchHospitals } from "../services/api"
import { joinTracking, leaveTracking } from "../services/socket"
import { onTrackingUpdate } from "../services/notifications"
import type { Emergency, EmergencyFormData, TrackingInfo } from "../types"
import StatusTimeline from "../components/ui/StatusTimeline"
import EmptyState from "../components/ui/EmptyState"

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

function NearbyHospitalsCard({ lat, lng, hospitals }: { lat: number; lng: number; hospitals: any[] }) {
  const sorted = [...hospitals]
    .map(h => ({
      ...h,
      distance: Math.sqrt(
        Math.pow(h.latitude - lat, 2) + Math.pow(h.longitude - lng, 2)
      ) * 111
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)

  return (
    <div className="card">
      <span className="text-section-label text-tertiary">Nearby hospitals</span>
      <div className="mt-3 space-y-2">
        {sorted.map((h: any) => (
          <div key={h.id}
            className="flex items-center justify-between py-2 border-b border-border dark:border-border-dark last:border-0">
            <div>
              <p className="text-body text-primary">{h.name}</p>
              <p className="text-caption text-tertiary">
                {h.distance.toFixed(1)} km away
              </p>
            </div>
            <span className={`micro-tag ${
              h.available_beds > 10 ? "micro-tag-ok" :
              h.available_beds > 0  ? "micro-tag-warning" :
                                       "micro-tag-critical"
            }`}>
              {h.available_beds} beds free
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrackMap({ tracking }: { tracking: TrackingInfo | null }) {
  if (!tracking) return null
  const routePositions: [number, number][] = tracking.route.map(p => [p.lat, p.lng])

  return (
    <div className="rounded-xl overflow-hidden border border-border dark:border-border-dark" style={{ height: 280 }}>
      <MapContainer center={[tracking.emergency_lat, tracking.emergency_lng]} zoom={13} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [age, setAge] = useState("")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [hospitalsList, setHospitalsList] = useState<Emergency["id"] extends never ? any[] : any[]>([])

  const load = useCallback(async () => {
    try {
      setEmergencies(await fetchEmergencies())
      setHospitalsList(await fetchHospitals())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i) }, [load])

  // WebSocket-based real-time tracking
  useEffect(() => {
    if (tab !== "track" || !submitted) {
      if (submitted) leaveTracking(submitted)
      setTracking(null)
      return
    }

    joinTracking(submitted)

    const cleanup = onTrackingUpdate((data) => {
      if (data.emergency_id === submitted) {
        setTracking({
          ambulance_lat: data.ambulance_lat,
          ambulance_lng: data.ambulance_lng,
          ambulance_vehicle_id: data.ambulance_vehicle_id,
          driver_name: data.driver_name,
          driver_phone: data.driver_phone,
          status: data.status,
          eta_seconds: data.eta_seconds,
          progress_pct: data.progress_pct,
          route: data.route,
          emergency_lat: data.emergency_lat,
          emergency_lng: data.emergency_lng,
        })
      }
    })

    return () => {
      cleanup()
      leaveTracking(submitted)
    }
  }, [tab, submitted])

  const getLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude) },
      () => { setLat(20.5937); setLng(78.9629) }
    )
  }

  useEffect(() => { getLocation() }, [])

  const isValidPhone = (v: string) => /^[0-9]{10}$/.test(v.trim())
  const isValidAge = (v: string) => {
    const n = Number(v)
    return v.trim() !== "" && !isNaN(n) && n > 0 && n <= 120
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Required"
    if (!desc.trim()) errs.desc = "Required"
    if (lat === null || lng === null) errs.location = "Location not available"

    if (!phone.trim()) {
      errs.phone = "Phone number is required"
    } else if (!isValidPhone(phone)) {
      errs.phone = "Enter a valid 10-digit phone number"
    }

    if (!age || !isValidAge(age)) {
      errs.age = "Enter a valid age"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || lat === null || lng === null) return
    try {
      const data: EmergencyFormData & { phone?: string; email?: string } = {
        patient_name: name, description: desc, latitude: lat, longitude: lng, severity,
        phone: phone || undefined,
        email: email || undefined,
      }
      const created = await createEmergency(data as any)
      setSubmitted(created.id)
      setName(""); setDesc(""); setSeverity("medium"); setPhone(""); setEmail("")
      setShowSuccess(true)
      setTab("track")
      load()
    } catch {
      const fallbackId = Date.now()
      const fallback: Emergency = {
        id: fallbackId, patient_name: name, description: desc,
        latitude: lat, longitude: lng, severity,
        status: "pending", created_at: new Date().toISOString(),
      } as Emergency
      setEmergencies(prev => [fallback, ...prev])
      setSubmitted(fallbackId)
      setName(""); setDesc(""); setSeverity("medium"); setPhone(""); setEmail("")
      setShowSuccess(true)
      setTab("track")
    }
  }

  const myEmergencies = submitted ? emergencies.filter(e => e.id === submitted) : []

  const PATIENT_STEPS = [
    { key: "pending", label: "Report received" },
    { key: "dispatched", label: "Ambulance dispatched" },
    { key: "resolved", label: "Arrived / resolved" },
  ]

  return (
    <div className="min-h-screen bg-page dark:bg-[#0F1117] pb-20">
      <header className="sticky top-0 z-10 bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark px-4 h-[52px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-secondary hover:text-primary hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors"
            aria-label="Back to role selection"
            title="Back to role selection">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <ResQLogo size={22} />
            <span className="text-[15px] font-medium text-primary">ResQ</span>
          </div>
        </div>
        <span className="text-caption text-tertiary">Patient</span>
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
              <button onClick={() => setShowSuccess(false)}
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
            <h1 className="text-page-title text-primary ">Report Emergency</h1>
            <p className="text-caption text-tertiary ">Fill in the details below to request help.</p>

            <div>
              <label className="text-section-label text-tertiary ">Patient Name</label>
              <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })) }}
                className={`mt-1.5 w-full h-[44px] rounded border bg-surface2 dark:bg-surface2-dark px-3 text-body text-primary  focus:border-secondary transition-colors ${errors.name ? "border-status-red" : "border-border dark:border-border-dark"}`}
                placeholder="Full name" />
              {errors.name && <p className="text-caption text-status-red mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-section-label text-tertiary ">Age</label>
              <input type="number" value={age} onChange={e => { setAge(e.target.value); setErrors(p => ({ ...p, age: "" })) }}
                className={`mt-1.5 w-full h-[44px] rounded border bg-surface2 dark:bg-surface2-dark px-3 text-body text-primary  focus:border-secondary transition-colors ${errors.age ? "border-status-red" : "border-border dark:border-border-dark"}`}
                placeholder="Enter age" min="1" max="120" />
              {errors.age && <p className="text-caption text-status-red mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="text-section-label text-tertiary ">Severity</label>
              <div className="flex gap-2 mt-1.5">
                {severities.map(s => (
                  <button key={s.value} onClick={() => setSeverity(s.value as EmergencyFormData["severity"])}
                    className={`min-tap flex-1 rounded text-caption transition-all duration-150 ${
                      severity === s.value
                        ? `${s.dot} text-white`
                        : "border border-border dark:border-border-dark text-secondary "
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-section-label text-tertiary ">Description</label>
              <textarea value={desc} onChange={e => { setDesc(e.target.value); setErrors(p => ({ ...p, desc: "" })) }}
                rows={4}
                className={`mt-1.5 w-full rounded border bg-surface2 dark:bg-surface2-dark px-3 py-2 text-body text-primary  focus:border-secondary transition-colors ${errors.desc ? "border-status-red" : "border-border dark:border-border-dark"}`}
                placeholder="Describe the situation..." />
              {errors.desc && <p className="text-caption text-status-red mt-1">{errors.desc}</p>}
            </div>

            <div>
              <label className="text-section-label text-tertiary ">Phone number *</label>
              <input value={phone} onChange={e => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10)
                setPhone(digitsOnly)
                setErrors(p => ({ ...p, phone: "" }))
              }}
                className={`mt-1.5 w-full h-[44px] rounded border bg-surface2 dark:bg-surface2-dark px-3 text-body text-primary  focus:border-secondary transition-colors ${errors.phone ? "border-status-red" : "border-border dark:border-border-dark"}`}
                placeholder="10-digit mobile number" type="tel" maxLength={10} />
              {errors.phone && <p className="text-caption text-status-red mt-1">{errors.phone}</p>}
              <p className="text-caption text-tertiary mt-1">Required for SMS dispatch updates</p>
            </div>

            <div>
              <label className="text-section-label text-tertiary ">Email (optional)</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                className="mt-1.5 w-full h-[44px] rounded border border-border dark:border-border-dark bg-surface2 dark:bg-surface2-dark px-3 text-body text-primary "
                placeholder="patient@example.com" type="email" />
            </div>

            <div className="flex items-center justify-between text-caption text-tertiary ">
              <span>{lat && lng ? `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}` : "📍 Detecting location..."}</span>
              <button onClick={getLocation} className="text-accent  underline">Refresh</button>
            </div>
            {errors.location && <p className="text-caption text-status-red">{errors.location}</p>}

            <button onClick={handleSubmit}
              className="w-full rounded-xl bg-[#C0392B] text-white text-[16px] font-semibold py-5 mt-2 hover:bg-[#A93226] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-red-900/20">
              🚨 Request Emergency Help
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-page-title text-primary ">Track Status</h1>
              {tracking && tracking.status === "dispatched" && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-green animate-pulse-ring" />
                  <span className="text-[13px] font-medium tabular-nums text-status-green">{formatEta(tracking.eta_seconds)}</span>
                </div>
              )}
            </div>

            {myEmergencies.length === 0 ? (
              <EmptyState heading="No emergencies yet" subtext="Submit a report above to track it here" />
            ) : (
              <>
                {tracking && (tracking.status === "dispatched" || tracking.status === "resolved") && (
                  <TrackMap tracking={tracking} />
                )}

                {tracking && tracking.status === "dispatched" && (
                  <div className="card flex items-center justify-between">
                    <div>
                      <p className="text-section-label text-tertiary">
                        Your ambulance driver
                      </p>
                      <p className="text-body font-medium text-primary mt-1">
                        {tracking.driver_name || "Driver"} ·{" "}
                        {tracking.ambulance_vehicle_id || "Unit"}
                      </p>
                    </div>
                    {tracking.driver_phone && (
                      <a href={`tel:${tracking.driver_phone}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green text-white text-caption font-medium hover:opacity-85 transition-opacity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        Call driver
                      </a>
                    )}
                  </div>
                )}

                {tracking && (
                  <NearbyHospitalsCard
                    lat={tracking.emergency_lat}
                    lng={tracking.emergency_lng}
                    hospitals={hospitalsList}
                  />
                )}

                <div className="card space-y-4">
                  <h2 className="text-[15px] font-medium text-primary ">Status</h2>

                  {tracking && tracking.status === "dispatched" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-surface2 dark:bg-surface2-dark rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full bg-status-green transition-all duration-500" style={{ width: `${tracking.progress_pct}%` }} />
                        </div>
                        <span className="text-caption tabular-nums text-secondary  w-10 text-right">{tracking.progress_pct}%</span>
                      </div>
                      <p className="text-caption text-tertiary ">
                        {tracking.ambulance_vehicle_id || "Ambulance"} is on the way
                      </p>
                    </div>
                  )}

                  <StatusTimeline steps={PATIENT_STEPS} currentKey={tracking?.status ?? "pending"} />
                </div>

                {myEmergencies.map(e => (
                  <div key={e.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-body font-medium text-primary ">{e.patient_name}</p>
                        <p className="text-caption text-tertiary  mt-1">{e.description}</p>
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
              tab === t ? "text-accent " : "text-tertiary "
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
