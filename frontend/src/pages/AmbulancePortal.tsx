import { useState, useEffect, useCallback } from "react"
import { fetchEmergencies, updateEmergency, fetchAmbulances, updateAmbulance } from "../services/api"
import { demoAmbulances } from "../services/demoData"
import type { Emergency, Ambulance } from "../types"

type Tab = "dispatch" | "fleet"

const timelineSteps = [
  { key: "dispatched", label: "Dispatched" },
  { key: "en_route", label: "En Route" },
  { key: "arrived", label: "Arrived" },
  { key: "transporting", label: "Transporting" },
  { key: "resolved", label: "Resolved" },
]

export default function AmbulancePortal() {
  const [tab, setTab] = useState<Tab>("dispatch")
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [selectedId, setSelectedId] = useState<number>(1)

  const load = useCallback(async () => {
    try { setEmergencies(await fetchEmergencies()); setAmbulances(await fetchAmbulances()) }
    catch { setAmbulances(demoAmbulances) }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i) }, [load])

  const myAmbulance = ambulances.find(a => a.id === selectedId)
  const myEmergencies = emergencies.filter(e => e.assigned_ambulance_id === selectedId)
  const currentEmergency = myEmergencies[0]
  const currentStepIdx = currentEmergency ? timelineSteps.findIndex(s => s.key === currentEmergency.status) : -1

  const advanceStep = async () => {
    if (!currentEmergency || currentStepIdx >= timelineSteps.length - 1) return
    const next = timelineSteps[currentStepIdx + 1].key
    const status = next === "resolved" ? "resolved" : next === "arrived" || next === "transporting" ? "dispatched" : next
    await updateEmergency(currentEmergency.id, { status } as any)
    load()
  }

  return (
    <div className="min-h-screen bg-page dark:bg-[#0F1117] pb-20">
      <header className="sticky top-0 z-10 bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark px-4 h-[52px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[18px] font-medium text-status-red">+</span>
          <span className="text-[15px] font-medium text-primary dark:text-primary-dark">ResQ</span>
        </div>
        <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
          className="text-caption bg-surface2 dark:bg-surface2-dark border border-border dark:border-border-dark rounded px-2 py-1 text-primary dark:text-primary-dark">
          {ambulances.map(a => <option key={a.id} value={a.id}>{a.vehicle_id}</option>)}
        </select>
      </header>

      <div className="p-4 space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-section-label text-tertiary dark:text-tertiary-dark">Vehicle Status</span>
            <span className={`micro-tag ${
              myAmbulance?.status === "available" ? "micro-tag-ok" :
              myAmbulance?.status === "en_route" ? "micro-tag-warning" : "micro-tag-critical"
            }`}>{myAmbulance?.status || "—"}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["available", "en_route", "busy"].map(s => (
              <button key={s} onClick={async () => { await updateAmbulance(selectedId, { status: s } as any); load() }}
                className={`h-[44px] rounded text-caption transition-all duration-150 ${
                  myAmbulance?.status === s
                    ? "bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117]"
                    : "border border-border dark:border-border-dark text-secondary dark:text-secondary-dark active:scale-[0.98]"
                }`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {tab === "dispatch" && (
          <div className="card space-y-4">
            <h1 className="text-page-title text-primary dark:text-primary-dark">Current Dispatch</h1>

            {!currentEmergency ? (
              <div className="py-8 text-center">
                <p className="text-caption text-tertiary dark:text-tertiary-dark">No active assignment</p>
                <p className="text-metric-label text-secondary dark:text-secondary-dark mt-1">Waiting for dispatch</p>
              </div>
            ) : (
              <>
                <div className="border border-border dark:border-border-dark rounded-card p-4 bg-surface2 dark:bg-surface2-dark">
                  <div className="flex justify-between">
                    <span className="text-body font-medium text-primary dark:text-primary-dark">{currentEmergency.patient_name}</span>
                    <span className={`micro-tag ${
                      currentEmergency.severity === "critical" ? "micro-tag-critical" :
                      currentEmergency.severity === "high" ? "micro-tag-warning" : "micro-tag-ok"
                    }`}>{currentEmergency.severity}</span>
                  </div>
                  <p className="text-caption text-tertiary dark:text-tertiary-dark mt-1">{currentEmergency.description}</p>
                  <p className="text-caption text-tertiary dark:text-tertiary-dark mt-2">
                    📍 {currentEmergency.latitude.toFixed(4)}, {currentEmergency.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="space-y-0 py-2">
                  {timelineSteps.map((step, i) => {
                    const completed = i < currentStepIdx
                    const current = i === currentStepIdx
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            completed ? "bg-accent dark:bg-primary-dark border-accent dark:border-primary-dark" :
                            current ? "bg-status-green border-status-green" :
                            "border-tertiary dark:border-tertiary-dark"
                          }`}>
                            {completed && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                          </div>
                          {i < timelineSteps.length - 1 && <div className="w-px h-5 bg-border dark:border-border-dark" />}
                        </div>
                        <div className="pb-3 flex-1">
                          <p className={`text-body ${current ? "font-medium text-primary dark:text-primary-dark" : completed ? "text-secondary dark:text-secondary-dark" : "text-tertiary dark:text-tertiary-dark"}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {currentStepIdx < timelineSteps.length - 1 && (
                  <button onClick={advanceStep}
                    className="w-full h-[44px] rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] text-body font-medium hover:opacity-85 active:scale-[0.98] transition-all duration-150">
                    Update Status
                  </button>
                )}
                {currentStepIdx === timelineSteps.length - 1 && (
                  <span className="micro-tag-ok block text-center">Completed</span>
                )}
              </>
            )}
          </div>
        )}

        {tab === "fleet" && (
          <div className="card space-y-3">
            <h1 className="text-page-title text-primary dark:text-primary-dark">Fleet Overview</h1>
            {ambulances.length === 0 ? (
              <p className="text-caption text-tertiary dark:text-tertiary-dark py-4 text-center">No vehicles</p>
            ) : (
              ambulances.map(a => (
                <div key={a.id} className="flex items-center justify-between py-3 border-b border-border dark:border-border-dark last:border-0">
                  <div>
                    <p className="text-body font-medium text-primary dark:text-primary-dark">{a.vehicle_id}</p>
                    <p className="text-caption text-tertiary dark:text-tertiary-dark">{a.latitude.toFixed(2)}, {a.longitude.toFixed(2)}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-caption">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      a.status === "available" ? "bg-status-green" : a.status === "en_route" ? "bg-status-amber" : "bg-status-red"
                    }`} />
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-border dark:border-border-dark flex" style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {(["dispatch", "fleet"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-caption transition-colors duration-150 ${
              tab === t ? "text-accent dark:text-primary-dark" : "text-tertiary dark:text-tertiary-dark"
            }`}>
            {t === "dispatch" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="3" width="15" height="13" rx="1" /><rect x="16" y="8" width="6" height="8" rx="1" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            )}
            {t === "dispatch" ? "Dispatch" : "Fleet"}
          </button>
        ))}
      </nav>
    </div>
  )
}
