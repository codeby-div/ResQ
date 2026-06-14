import { useEffect, useState, useCallback } from "react"
import { fetchHospitals, fetchAmbulances, fetchEmergencies, updateEmergency } from "../services/api"
import { demoHospitals, demoAmbulances } from "../services/demoData"
import type { Hospital, Ambulance, Emergency } from "../types"
import MetricCard from "../components/ui/MetricCard"
import Skeleton from "../components/ui/Skeleton"
import EmptyState from "../components/ui/EmptyState"

const severityDot: Record<string, string> = {
  low: "bg-status-green", medium: "bg-status-amber", high: "bg-status-amber", critical: "bg-status-red",
}

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export default function Dashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [h, a, e] = await Promise.all([fetchHospitals(), fetchAmbulances(), fetchEmergencies()])
      setHospitals(h); setAmbulances(a); setEmergencies(e)
    } catch {
      setHospitals(demoHospitals); setAmbulances(demoAmbulances)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i) }, [load])

  const totalBeds = hospitals.reduce((s, h) => s + h.total_beds, 0)
  const availBeds = hospitals.reduce((s, h) => s + h.available_beds, 0)
  const pendingCount = emergencies.filter(e => e.status === "pending").length
  const criticalCount = emergencies.filter(e => e.severity === "critical").length
  const availAmb = ambulances.filter(a => a.status === "available").length

  const filteredEmergencies = emergencies.filter(e =>
    e.patient_name.toLowerCase().includes(search.toLowerCase()) || e.severity.includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
        ) : (
          <>
            <MetricCard label="Available Beds" value={`${availBeds}/${totalBeds}`} variant={availBeds < 30 ? "critical" : "default"} trend={[28, 31, 27, 24, 26, 22, availBeds]} micro="Across all hospitals" />
            <MetricCard label="Pending Emergencies" value={String(pendingCount)} variant={pendingCount > 5 ? "critical" : "warning"} trend={[2, 4, 3, 6, 5, 7, pendingCount]} micro="Awaiting dispatch" />
            <MetricCard label="Available Ambulances" value={String(availAmb)} variant={availAmb < 3 ? "warning" : "default"} trend={[8, 7, 5, 6, 4, 3, availAmb]} micro="Ready for deployment" />
            <MetricCard label="Critical Cases" value={String(criticalCount)} variant="critical" trend={[1, 2, 1, 3, 2, 4, criticalCount]} micro="Require immediate attention" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Active Emergencies</h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-48 border border-border dark:border-border-dark rounded px-3 py-1.5 text-xs bg-white dark:bg-surface-dark text-primary dark:text-primary-dark focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="border border-border dark:border-border-dark rounded-lg overflow-hidden bg-white dark:bg-surface-dark">
            {filteredEmergencies.length === 0 ? (
              <EmptyState heading="No emergencies" subtext="All clear for now" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark">
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Patient</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Severity</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Time</th>
                    <th className="w-16 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmergencies.map(e => (
                    <tr key={e.id} className="border-b border-border dark:border-border-dark hover:bg-gray-50 dark:hover:bg-surface2-dark transition-colors group">
                      <td className="px-4 py-3 text-primary dark:text-primary-dark">{e.patient_name}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${severityDot[e.severity]}`} />
                          <span className="text-xs text-secondary dark:text-secondary-dark">{e.severity}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${e.status === "resolved" ? "bg-status-green" : e.status === "dispatched" ? "bg-blue-500" : "bg-status-amber"}`} />
                          <span className="text-xs text-secondary dark:text-secondary-dark">{e.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-tertiary dark:text-tertiary-dark">{relTime(e.created_at)}</td>
                      <td className="px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {e.status !== "resolved" && (
                          <button
                            onClick={async () => { await updateEmergency(e.id, { status: "resolved" } as any); load() }}
                            className="text-xs text-secondary dark:text-secondary-dark hover:text-primary dark:hover:text-primary-dark transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">Alerts Feed</h2>
          <div className="border border-border dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark divide-y divide-border dark:divide-border-dark">
            {emergencies.length === 0 ? (
              <div className="p-8">
                <EmptyState heading="No active alerts" subtext="All systems nominal" />
              </div>
            ) : (
              emergencies.slice(0, 6).map(e => (
                <div key={e.id} className="flex gap-3 p-4">
                  <div className={`w-0.5 shrink-0 rounded ${e.severity === "critical" ? "bg-status-red" : e.severity === "high" ? "bg-status-amber" : "bg-tertiary dark:bg-tertiary-dark"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {e.status === "pending" && <span className="w-1.5 h-1.5 rounded-full bg-status-red shrink-0" />}
                      <p className="text-sm text-primary dark:text-primary-dark truncate">{e.patient_name}</p>
                    </div>
                    <p className="text-xs text-tertiary dark:text-tertiary-dark mt-0.5">{e.severity} severity — {e.description?.slice(0, 50) || "No details"}</p>
                    <p className="text-[11px] text-tertiary dark:text-tertiary-dark mt-1">{relTime(e.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
