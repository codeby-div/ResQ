import { useState } from "react"
import type { EmergencyFormData } from "../types"

interface Props {
  lat: number
  lng: number
  onSubmit: (data: EmergencyFormData) => void
  onClose: () => void
}

const severities = [
  { value: "low", label: "Low", color: "bg-status-green" },
  { value: "medium", label: "Medium", color: "bg-status-amber" },
  { value: "high", label: "High", color: "bg-status-amber" },
  { value: "critical", label: "Critical", color: "bg-status-red" },
] as const

export default function EmergencyForm({ lat, lng, onSubmit, onClose }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<EmergencyFormData["severity"]>("medium")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Patient name is required"
    if (name.trim().length < 2) errs.name = "Name must be at least 2 characters"
    if (!description.trim()) errs.description = "Description is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    onSubmit({ patient_name: name, description, latitude: lat, longitude: lng, severity })
    setConfirmOpen(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-2xl w-full max-w-2xl animate-fade-in">
          <div className="p-6 border-b border-border dark:border-border-dark">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-primary dark:text-primary-dark">New Emergency Report</h2>
              <button onClick={onClose} className="text-tertiary dark:text-tertiary-dark hover:text-primary dark:hover:text-primary-dark transition-colors" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Patient Name</label>
                  <input
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: "" })) }}
                    className={`mt-1.5 block w-full rounded border px-3 py-2 text-sm bg-white dark:bg-surface-dark text-primary dark:text-primary-dark focus:border-blue-500 transition-colors ${errors.name ? "border-status-red" : "border-border dark:border-border-dark"}`}
                    placeholder="Full name"
                  />
                  {errors.name && <p className="text-xs text-status-red mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Severity</label>
                  <div className="flex gap-2 mt-1.5">
                    {severities.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSeverity(s.value as EmergencyFormData["severity"])}
                        className={`px-3 py-1.5 rounded text-xs transition-all duration-150 ${
                          severity === s.value
                            ? `${s.color} text-white`
                            : "border border-border dark:border-border-dark text-secondary dark:text-secondary-dark hover:border-gray-400"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Description</label>
                  <textarea
                    value={description}
                    onChange={e => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: "" })) }}
                    rows={4}
                    className={`mt-1.5 block w-full rounded border px-3 py-2 text-sm bg-white dark:bg-surface-dark text-primary dark:text-primary-dark focus:border-blue-500 transition-colors ${errors.description ? "border-status-red" : "border-border dark:border-border-dark"}`}
                    placeholder="Describe the emergency situation..."
                  />
                  {errors.description && <p className="text-xs text-status-red mt-1">{errors.description}</p>}
                </div>

                <p className="text-xs text-tertiary dark:text-tertiary-dark">
                  📍 {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300 font-medium">AI Assessment</span>
                  <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-medium">v2.1</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    <span>Estimated response: <strong>8 min</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    <span>Nearest hospital: <strong>3.2 km</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><rect x="16" y="8" width="6" height="8" rx="1" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                    <span>Available ambulances: <strong>4</strong></span>
                  </div>
                </div>

                <div className="border-t border-blue-200 dark:border-blue-800 pt-3 mt-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300 font-medium mb-2">Hospital Alternatives</p>
                  {[
                    { name: "City General", beds: "12/45", dist: "3.2 km", pct: 27 },
                    { name: "St. Mary's", beds: "8/30", dist: "5.1 km", pct: 27 },
                    { name: "University Med", beds: "3/60", dist: "7.8 km", pct: 5 },
                  ].map((h, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-800 dark:text-blue-200 truncate">{h.name}</span>
                          <span className="text-blue-600 dark:text-blue-400 shrink-0">{h.dist}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full" style={{ width: `${h.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border dark:border-border-dark flex justify-end gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm rounded border border-border dark:border-border-dark text-secondary dark:text-secondary-dark hover:bg-gray-50 dark:hover:bg-surface2-dark transition-all duration-150">
                Cancel
              </button>
              <button type="submit"
                className="px-6 py-2 text-sm rounded bg-primary dark:bg-primary-dark text-white dark:text-[#0F1117] hover:opacity-85 transition-all duration-150">
                Dispatch
              </button>
            </div>
          </form>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
          <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in space-y-4">
            <h3 className="text-sm font-medium text-primary dark:text-primary-dark">Confirm Dispatch</h3>
            <p className="text-sm text-secondary dark:text-secondary-dark">
              Dispatch emergency for <strong className="text-primary dark:text-primary-dark">{name}</strong> with {severity} severity?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm rounded border border-border dark:border-border-dark text-secondary dark:text-secondary-dark hover:bg-gray-50 dark:hover:bg-surface2-dark transition-all duration-150">
                Cancel
              </button>
              <button onClick={handleConfirm}
                className="px-4 py-2 text-sm rounded bg-primary dark:bg-primary-dark text-white dark:text-[#0F1117] hover:opacity-85 transition-all duration-150">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
