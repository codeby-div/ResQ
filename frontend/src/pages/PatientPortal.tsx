import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { createEmergency, fetchEmergencies } from "../services/api"
import type { Emergency, EmergencyFormData } from "../types"

const severities = [
  { value: "critical", label: "Critical", dot: "bg-status-red" },
  { value: "high", label: "High", dot: "bg-status-amber" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "low", label: "Low", dot: "bg-status-green" },
] as const

type Tab = "report" | "track"

export default function PatientPortal() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("report")
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [severity, setSeverity] = useState<EmergencyFormData["severity"]>("medium")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try { setEmergencies(await fetchEmergencies()) } catch { /* ignore */ }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i) }, [load])

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

  const [showSuccess, setShowSuccess] = useState(false)

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

      <div className="p-4 space-y-4">{showSuccess && (
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
          <div className="card space-y-3">
            <h1 className="text-page-title text-primary dark:text-primary-dark">Track Status</h1>
            {myEmergencies.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-caption text-tertiary dark:text-tertiary-dark">No emergencies yet</p>
                <p className="text-metric-label text-secondary dark:text-secondary-dark mt-1">Submit a report above to track it here</p>
              </div>
            ) : (
              myEmergencies.map(e => (
                <div key={e.id} className="border border-border dark:border-border-dark rounded-card p-4">
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
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      e.status === "resolved" ? "bg-status-green" :
                      e.status === "dispatched" ? "bg-hospital" : "bg-status-amber"
                    }`} />
                    <span className="text-caption text-secondary dark:text-secondary-dark capitalize">{e.status}</span>
                  </div>
                </div>
              ))
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
