import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { fetchEmergencies, updateEmergency, fetchAmbulances, updateAmbulance } from "../services/api"
import { subscribeAmbulance, unsubscribeAmbulance } from "../services/socket"
import { onAmbulanceUpdate } from "../services/notifications"
import ResQLogo from "../components/ui/ResQLogo"
import { demoAmbulances } from "../services/demoData"
import type { Emergency, Ambulance } from "../types"
import StatusTimeline from "../components/ui/StatusTimeline"
import EmptyState from "../components/ui/EmptyState"

type Tab = "dispatch" | "fleet"

const TIMELINE_STEPS = [
  { key: "dispatched", label: "Dispatched" },
  { key: "en_route", label: "En Route" },
  { key: "arrived", label: "Arrived at scene" },
  { key: "transporting", label: "Patient on board" },
  { key: "resolved", label: "Handed over" },
]

export default function AmbulancePortal() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("dispatch")
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [selectedId, setSelectedId] = useState<number>(1)

  const load = useCallback(async () => {
    try { setEmergencies(await fetchEmergencies()); setAmbulances(await fetchAmbulances()) }
    catch { setAmbulances(demoAmbulances) }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i) }, [load])

  // WebSocket: subscribe to ambulance-specific updates
  useEffect(() => {
    subscribeAmbulance(selectedId)
    const cleanup = onAmbulanceUpdate((data) => {
      if (data.emergency_id) load()
    })
    return () => {
      cleanup()
      unsubscribeAmbulance(selectedId)
    }
  }, [selectedId, load])

  const myAmbulance = ambulances.find(a => a.id === selectedId)
  const myEmergencies = emergencies.filter(e => e.assigned_ambulance_id === selectedId)
  const currentEmergency = myEmergencies[0]
  const currentStepIdx = currentEmergency ? TIMELINE_STEPS.findIndex(s => s.key === currentEmergency.status) : -1

  const advanceStep = async () => {
    if (!currentEmergency || currentStepIdx >= TIMELINE_STEPS.length - 1) return
    const next = TIMELINE_STEPS[currentStepIdx + 1].key
    const status = next === "resolved" ? "resolved" : next === "arrived" || next === "transporting" ? "dispatched" : next
    await updateEmergency(currentEmergency.id, { status } as any)
    load()
  }

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
        <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
          className="text-caption bg-surface2 dark:bg-surface2-dark border border-border dark:border-border-dark rounded px-2 py-1 text-primary ">
          {ambulances.map(a => <option key={a.id} value={a.id}>{a.vehicle_id}</option>)}
        </select>
      </header>

      <div className="p-4 space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-section-label text-tertiary ">Vehicle Status</span>
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
                    : "border border-border dark:border-border-dark text-secondary  active:scale-[0.98]"
                }`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {tab === "dispatch" && (
          <div className="card space-y-4">
            <h1 className="text-page-title text-primary ">Current Dispatch</h1>

            {!currentEmergency ? (
              <EmptyState heading="No active assignment" subtext="Waiting for dispatch" />
            ) : (
              <>
                <div className="border border-border dark:border-border-dark rounded-card p-4 bg-surface2 dark:bg-surface2-dark">
                  <div className="flex justify-between">
                    <span className="text-body font-medium text-primary ">{currentEmergency.patient_name}</span>
                    <span className={`micro-tag ${
                      currentEmergency.severity === "critical" ? "micro-tag-critical" :
                      currentEmergency.severity === "high" ? "micro-tag-warning" : "micro-tag-ok"
                    }`}>{currentEmergency.severity}</span>
                  </div>
                  <p className="text-caption text-tertiary  mt-1">{currentEmergency.description}</p>
                  <p className="text-caption text-tertiary  mt-2">
                    📍 {currentEmergency.latitude.toFixed(4)}, {currentEmergency.longitude.toFixed(4)}
                  </p>
                </div>

                <StatusTimeline steps={TIMELINE_STEPS} currentKey={currentEmergency?.status ?? "dispatched"} onAdvance={advanceStep} advanceLabel={`Mark as ${TIMELINE_STEPS[currentStepIdx + 1]?.label ?? "Complete"}`} />
                {currentStepIdx === TIMELINE_STEPS.length - 1 && (
                  <span className="micro-tag-ok block text-center mt-3">Completed</span>
                )}
              </>
            )}
          </div>
        )}

        {tab === "fleet" && (
          <div className="card space-y-3">
            <h1 className="text-page-title text-primary ">Fleet Overview</h1>
            {ambulances.length === 0 ? (
              <EmptyState heading="No vehicles" />
            ) : (
              ambulances.map(a => (
                <div key={a.id} className="flex items-center justify-between py-3 border-b border-border dark:border-border-dark last:border-0">
                  <div>
                    <p className="text-body font-medium text-primary ">{a.vehicle_id}</p>
                    <p className="text-caption text-tertiary ">{a.latitude.toFixed(2)}, {a.longitude.toFixed(2)}</p>
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
              tab === t ? "text-accent " : "text-tertiary "
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
