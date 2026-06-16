import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { fetchHospitals, fetchAmbulances, fetchEmergencies, updateEmergency } from "../services/api"
import { demoHospitals, demoAmbulances } from "../services/demoData"
import { subscribeAllEmergencies, unsubscribeAllEmergencies } from "../services/socket"
import { onEmergencyUpdate } from "../services/notifications"
import type { Hospital, Ambulance, Emergency } from "../types"
import AlertItem from "../components/ui/AlertItem"
import ConfirmationModal from "../components/ui/ConfirmationModal"
import MetricCard from "../components/ui/MetricCard"
import DataTable from "../components/ui/DataTable"
import EmptyState from "../components/ui/EmptyState"

type View = "overview" | "livemap" | "emergencies" | "hospitals" | "ambulances" | "staff" | "forecast" | "hotspots" | "reports" | "users" | "settings"

const nav: { label: string; items: { key: View; label: string; count?: number }[] }[] = [
  { label: "Monitor", items: [
    { key: "overview", label: "Overview" },
    { key: "livemap", label: "Live map" },
    { key: "emergencies", label: "Emergencies", count: 3 },
  ]},
  { label: "Resources", items: [
    { key: "hospitals", label: "Hospitals" },
    { key: "ambulances", label: "Ambulances" },
    { key: "staff", label: "Staff" },
  ]},
  { label: "Analytics", items: [
    { key: "forecast", label: "Demand forecast" },
    { key: "hotspots", label: "Hotspot map" },
    { key: "reports", label: "Reports" },
  ]},
  { label: "System", items: [
    { key: "users", label: "User management" },
    { key: "settings", label: "Settings" },
  ]},
]

const hospitalIcon = L.divIcon({
  html: '<div style="background:#1D6FA8;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)">+</div>',
  className: "", iconSize: [28, 28], iconAnchor: [14, 14],
})
const ambulanceIcon = L.divIcon({
  html: '<div style="background:#2D7A45;color:#fff;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)">🚑</div>',
  className: "", iconSize: [26, 26], iconAnchor: [13, 13],
})

const relTime = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime(); const m = Math.floor(d / 60000)
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; return `${Math.floor(m / 60)}h ago`
}

const DEMO_ETA: Record<number, number> = {
  1: 6, 2: 11, 3: 4, 4: 8, 5: 14, 6: 7, 7: 9, 8: 5
}

export default function AdminPortal() {
  const { user, logout } = useAuth()
  const [view, setView] = useState<View>("overview")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [search, setSearch] = useState("")
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reassignTarget, setReassignTarget] = useState<Emergency | null>(null)

  const load = useCallback(async () => {
    try {
      const [h, a, e] = await Promise.all([fetchHospitals(), fetchAmbulances(), fetchEmergencies()])
      setHospitals(h); setAmbulances(a); setEmergencies(e)
    } catch { setHospitals(demoHospitals); setAmbulances(demoAmbulances) }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i) }, [load])

  // WebSocket: real-time emergency updates
  useEffect(() => {
    subscribeAllEmergencies()
    const cleanup = onEmergencyUpdate(() => { load() })
    return () => {
      cleanup()
      unsubscribeAllEmergencies()
    }
  }, [load])

  const filtered = emergencies.filter(e => e.patient_name.toLowerCase().includes(search.toLowerCase()))
  const pending = emergencies.filter(e => e.status === "pending").length
  const critical = emergencies.filter(e => e.severity === "critical").length
  const availAmb = ambulances.filter(a => a.status === "available").length
  const totalBeds = hospitals.reduce((s, h) => s + h.available_beds, 0)

  const Sidebar = () => (
    <aside className="w-[220px] bg-surface2 dark:bg-surface2-dark border-r border-border dark:border-border-dark flex flex-col shrink-0">
      <nav className="flex-1 py-4 overflow-y-auto">
        {nav.map(s => (
          <div key={s.label} className="mb-5">
            <p className="px-4 mb-2 text-section-label text-tertiary dark:text-tertiary-dark">{s.label}</p>
            {s.items.map(item => (
              <button key={item.key} onClick={() => { setView(item.key); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-body transition-colors duration-100 ${
                  view === item.key
                    ? "border-l-2 border-accent dark:border-primary-dark text-primary dark:text-primary-dark font-medium"
                    : "border-l-2 border-transparent text-tertiary dark:text-tertiary-dark hover:bg-surface dark:hover:bg-surface-dark hover:text-primary dark:hover:text-primary-dark"
                }`}>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count ? <span className="text-caption text-tertiary">{item.count}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-border dark:border-border-dark flex items-center gap-1">
        <div className="w-7 h-7 rounded-full bg-surface2 dark:bg-surface2-dark flex items-center justify-center text-caption font-medium shrink-0">
          {user?.display_name?.charAt(0)?.toUpperCase() || "A"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-caption font-medium text-primary dark:text-primary-dark truncate">{user?.display_name || "Admin"}</p>
          <p className="text-caption text-tertiary dark:text-tertiary-dark truncate">{user?.role || "System Administrator"}</p>
        </div>
        <button onClick={() => { logout(); navigate("/") }} className="text-tertiary hover:text-primary transition-colors p-1" title="Logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="h-screen flex flex-col bg-page dark:bg-[#0F1117]">
      <header className="h-[52px] bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-secondary hover:text-primary transition-colors text-sm mr-1" title="Back to role selection">&larr;</button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-secondary dark:text-secondary-dark" aria-label="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <span className="text-[18px] font-medium text-status-red">+</span>
          <span className="text-[15px] font-medium text-primary dark:text-primary-dark">ResQ</span>
          <span className="hidden sm:block text-caption text-tertiary dark:text-tertiary-dark ml-2">/ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1 text-caption text-tertiary"><span className="w-1.5 h-1.5 rounded-full bg-status-red animate-pulse-ring" />{critical} critical</span>
            <span className="flex items-center gap-1 text-caption text-tertiary"><span className="w-1.5 h-1.5 rounded-full bg-status-green" />{availAmb} avail</span>
          </div>
          <span className="text-caption text-tertiary">{new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`${sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden"} lg:flex lg:relative lg:z-0`}>
          {sidebarOpen && <div className="absolute inset-0 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {view === "overview" && (
            <OverviewView emergencies={emergencies} hospitals={hospitals} ambulances={ambulances} pending={pending} critical={critical} availAmb={availAmb} totalBeds={totalBeds} filtered={filtered} search={search} setSearch={setSearch} relTime={relTime} setReassignTarget={setReassignTarget} />
          )}
          {view === "livemap" && (
            <LiveMapView hospitals={hospitals} ambulances={ambulances} emergencies={emergencies} />
          )}
          {view === "emergencies" && (
            <EmergenciesView emergencies={emergencies} hospitals={hospitals} ambulances={ambulances} load={load} />
          )}
          {view === "hospitals" && (
            <HospitalsView hospitals={hospitals} />
          )}
          {view === "ambulances" && (
            <AmbulancesView ambulances={ambulances} />
          )}
          {view === "forecast" && (
            <ForecastView emergencies={emergencies} />
          )}
          {view === "hotspots" && (
            <HotspotsView emergencies={emergencies} />
          )}
          {view === "staff" && (
            <AdminStaffView />
          )}
          {view === "reports" && (
            <ReportsView emergencies={emergencies} hospitals={hospitals} />
          )}
          {view === "settings" && (
            <AdminSettingsView />
          )}
          {view === "users" && (
            <UsersView />
          )}
        </main>
      </div>

      {reassignTarget && (
        <ConfirmationModal
          title="Reassign Emergency"
          description={`Reassign emergency #${reassignTarget.id} for ${reassignTarget.patient_name}?`}
          onConfirm={() => { setReassignTarget(null); load() }}
          onCancel={() => setReassignTarget(null)}
          confirmLabel="Reassign"
        />
      )}
    </div>
  )
}

function OverviewView({ emergencies, hospitals, ambulances, pending, critical, availAmb, totalBeds, filtered, search, setSearch, relTime, setReassignTarget }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-page-title text-primary dark:text-primary-dark">Command Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active emergencies"
          value={String(emergencies.filter((e: Emergency) => e.status !== "resolved").length)}
          variant={critical > 0 ? "critical" : "default"}
          trend={[12, 14, 11, 15, 13, 17, pending]}
          trendColor="#C0392B"
          micro={`${pending} pending dispatch`}
        />
        <MetricCard
          label="Beds available"
          value={String(totalBeds)}
          variant="default"
          trend={[45, 42, 38, 41, 39, 36, totalBeds]}
          trendColor="#2D7A45"
          micro="City-wide total"
        />
        <MetricCard
          label="Ambulances free"
          value={String(availAmb)}
          variant={availAmb < 4 ? "warning" : "ok"}
          trend={[8, 7, 5, 6, 4, 3, availAmb]}
          trendColor={availAmb < 4 ? "#B7660A" : "#2D7A45"}
          micro={`of ${ambulances.length} total`}
        />
        <MetricCard
          label="Avg response"
          value="7.2 min"
          variant="default"
          trend={[9, 8, 10, 7, 8, 6, 7]}
          trendColor="#2D7A45"
          micro="↓ 12% from yesterday"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DataTable label="Active Emergencies" search={search} onSearch={setSearch}>
            <thead>
              <tr className="border-b border-border dark:border-border-dark">
                <th className="th">ID</th>
                <th className="th">Severity</th>
                <th className="th">Assigned</th>
                <th className="th">ETA</th>
                <th className="th">Status</th>
                <th className="w-20 py-3"/>
              </tr>
            </thead>
            <tbody>
              {filtered.filter((e: Emergency) => e.status !== "resolved").slice(0, 6).map((e: Emergency) => (
                <tr key={e.id} className="border-b border-border dark:border-border-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors group">
                  <td className="td text-primary">#{e.id}</td>
                  <td className="td"><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${e.severity === "critical" ? "bg-status-red" : e.severity === "high" ? "bg-status-amber" : "bg-status-green"}`} /><span className="text-secondary">{e.severity}</span></span></td>
                  <td className="td text-secondary">AMB-{e.assigned_ambulance_id || "—"}</td>
                  <td className="td text-tertiary tabular-nums">{DEMO_ETA[e.id] ?? 8} min</td>
                  <td className="td text-secondary capitalize">{e.status}</td>
                  <td className="py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setReassignTarget(e)} className="text-caption text-secondary hover:text-primary">Reassign</button>
                  </td>
                </tr>
              ))}
              {filtered.filter((e: Emergency) => e.status !== "resolved").length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      heading="All clear"
                      subtext="No active emergencies right now"
                      icon={
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="11" cy="11" r="8"/>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </div>

        <div className="space-y-4">
          <div className="card p-0">
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
              <span className="text-section-label text-tertiary dark:text-tertiary-dark">Alerts feed</span>
              <button className="text-caption text-tertiary hover:text-primary transition-colors">Mark all read</button>
            </div>
            <div className="divide-y divide-border dark:divide-border-dark max-h-[380px] overflow-y-auto">
              {emergencies.slice(0, 6).map((e: Emergency) => (
                <AlertItem
                  key={e.id}
                  severity={e.severity === "critical" ? "critical" : e.severity === "high" ? "warning" : "info"}
                  message={`${e.patient_name} — ${e.severity} — ${e.status}`}
                  timestamp={relTime(e.created_at)}
                  unread={e.status === "pending"}
                />
              ))}
              {emergencies.length === 0 && (
                <EmptyState
                  heading="No active alerts"
                  subtext="System is operating normally"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  }
                />
              )}
            </div>
          </div>

          <div className="card">
            <span className="text-section-label text-tertiary">Hospital Capacity</span>
            <div className="mt-3 space-y-3">
              {hospitals.slice(0, 4).map((h: Hospital) => {
                const pct = h.total_beds > 0 ? Math.round((h.available_beds / h.total_beds) * 100) : 0
                return (
                  <div key={h.id}>
                    <div className="flex justify-between text-caption mb-1">
                      <span className="text-primary truncate">{h.name}</span>
                      <span className="text-tertiary">{pct}%</span>
                    </div>
                    <div className="h-[2px] bg-border rounded-full"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct > 30 ? "#2D7A45" : pct > 10 ? "#B7660A" : "#C0392B" }} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveMapView({ hospitals, ambulances, emergencies }: any) {
  const dispatched = emergencies.find((e: Emergency) => e.assigned_ambulance_id && e.status === "dispatched")
  const amb = dispatched ? ambulances.find((a: Ambulance) => a.id === dispatched.assigned_ambulance_id) : null
  return (
    <div className="h-full flex">
      <div className="flex-1 relative rounded-card overflow-hidden border border-border">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full" style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {hospitals.map((h: Hospital) => <Marker key={`h-${h.id}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}><Popup><div className="text-sm"><strong>{h.name}</strong><br />Beds: {h.available_beds}/{h.total_beds}</div></Popup></Marker>)}
          {ambulances.map((a: Ambulance) => <Marker key={`a-${a.id}`} position={[a.latitude, a.longitude]} icon={ambulanceIcon}><Popup><div className="text-sm"><strong>{a.vehicle_id}</strong><br />{a.status}</div></Popup></Marker>)}
          {emergencies.filter((e: Emergency) => e.status !== "resolved").map((e: Emergency) => (
            <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]}
              icon={L.divIcon({
                html: `<div style="background:#C0392B;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid #fff;box-shadow:0 0 0 ${e.severity === 'critical' ? '4px' : '0'} rgba(192,57,43,0.3)"${e.severity === 'critical' ? ' style="animation:pulse-ring 2s infinite"' : ''}>!</div>`,
                className: "", iconSize: [22, 22], iconAnchor: [11, 11],
              })}>
              <Popup><div className="text-sm"><strong>{e.patient_name}</strong><br />{e.severity}<br />{e.status}</div></Popup>
            </Marker>
          ))}
          {dispatched && amb && <Polyline positions={[[amb.latitude, amb.longitude], [dispatched.latitude, dispatched.longitude]]} pathOptions={{ color: "#3B82F6", dashArray: "6 3", weight: 1.5 }} />}
        </MapContainer>
      </div>
      <div className="w-[200px] shrink-0 border-l border-border bg-white dark:bg-surface-dark p-4 space-y-4 overflow-y-auto">
        <div><span className="text-section-label text-tertiary">Hospitals</span>
          {hospitals.slice(0, 4).map((h: Hospital) => <div key={h.id} className="flex justify-between text-caption py-1"><span className="text-primary">{h.name}</span><span className="text-tertiary">{h.available_beds}b</span></div>)}
        </div>
        <div><span className="text-section-label text-tertiary">Ambulances</span>
          {ambulances.slice(0, 4).map((a: Ambulance) => <div key={a.id} className="flex justify-between text-caption py-1"><span className="text-primary">{a.vehicle_id}</span><span className="text-tertiary">{a.status}</span></div>)}
        </div>
      </div>
    </div>
  )
}

function EmergenciesView({ emergencies: emergenciesList, load }: any) {
  emergenciesList
  const [s, setS] = useState(""); const [sev, setSev] = useState("all")
  const f = emergenciesList.filter((e: Emergency) => (sev === "all" || e.severity === sev) && (e.patient_name.toLowerCase().includes(s.toLowerCase())))
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-primary">Emergencies</h1>
        <div className="flex gap-2">
          <select value={sev} onChange={e => setSev(e.target.value)} className="border border-border rounded px-2 py-1 text-caption bg-surface2 text-primary">
            {["all", "critical", "high", "medium", "low"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <DataTable search={s} onSearch={setS}>
        <thead>
          <tr className="border-b border-border dark:border-border-dark">
            <th className="th">ID</th>
            <th className="th">Patient</th>
            <th className="th">Severity</th>
            <th className="th">Location</th>
            <th className="th">Ambulance</th>
            <th className="th">Hospital</th>
            <th className="th">Status</th>
            <th className="w-20 py-3"/>
          </tr>
        </thead>
        <tbody>
          {f.map((e: Emergency) => (
            <tr key={e.id} className="border-b border-border dark:border-border-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors group">
              <td className="td text-primary">#{e.id}</td>
              <td className="td text-primary">{e.patient_name}</td>
              <td className="td"><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${e.severity === "critical" ? "bg-status-red" : e.severity === "high" ? "bg-status-amber" : "bg-status-green"}`} /><span className="text-secondary">{e.severity}</span></span></td>
              <td className="td text-tertiary">{e.latitude.toFixed(2)}, {e.longitude.toFixed(2)}</td>
              <td className="td text-secondary">{e.assigned_ambulance_id ? `AMB-${e.assigned_ambulance_id}` : "—"}</td>
              <td className="td text-secondary">{e.assigned_hospital_id ? `H-${e.assigned_hospital_id}` : "—"}</td>
              <td className="td text-secondary capitalize">{e.status}</td>
              <td className="py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={async () => { await updateEmergency(e.id, { status: "resolved" } as any); load() }} className="text-caption text-secondary hover:text-primary">Resolve</button>
              </td>
            </tr>
          ))}
          {f.length === 0 && (
            <tr>
              <td colSpan={8}>
                <EmptyState
                  heading="No emergencies found"
                  subtext="Try adjusting your filters"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  }
                />
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </div>
  )
}

function HospitalsView({ hospitals }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">Hospitals</h1>
      <DataTable>
        <thead>
          <tr className="border-b border-border dark:border-border-dark">
            <th className="th">Name</th>
            <th className="th">Beds free</th>
            <th className="th">ICU free</th>
            <th className="th">Status</th>
            <th className="w-1/3 py-3"/>
          </tr>
        </thead>
        <tbody>
          {hospitals.map((h: Hospital) => {
            const pct = h.total_beds > 0 ? Math.round((h.available_beds / h.total_beds) * 100) : 0
            return (
              <tr key={h.id} className="border-b border-border dark:border-border-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors">
                <td className="td text-primary">{h.name}</td>
                <td className="td text-secondary">{h.available_beds}/{h.total_beds}</td>
                <td className="td text-secondary">{h.available_icu}/{h.total_icu}</td>
                <td className="td"><span className={`micro-tag ${h.status === "active" ? "micro-tag-ok" : h.status === "full" ? "micro-tag-critical" : "micro-tag-warning"}`}>{h.status}</span></td>
                <td className="py-3"><div className="h-[2px] bg-border rounded-full"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct > 30 ? "#2D7A45" : "#B7660A" }} /></div></td>
              </tr>
            )
          })}
        </tbody>
      </DataTable>
    </div>
  )
}

function AmbulancesView({ ambulances }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">Ambulances</h1>
      <DataTable>
        <thead>
          <tr className="border-b border-border dark:border-border-dark">
            <th className="th">Vehicle</th>
            <th className="th">Status</th>
            <th className="th">Location</th>
            <th className="th">Hospital</th>
          </tr>
        </thead>
        <tbody>
          {ambulances.map((a: Ambulance) => (
            <tr key={a.id} className="border-b border-border dark:border-border-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors">
              <td className="td text-primary">{a.vehicle_id}</td>
              <td className="td"><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${a.status === "available" ? "bg-status-green" : a.status === "en_route" ? "bg-status-amber" : "bg-status-red"}`} /><span className="text-secondary">{a.status}</span></span></td>
              <td className="td text-tertiary">{a.latitude.toFixed(2)}, {a.longitude.toFixed(2)}</td>
              <td className="td text-secondary">{a.hospital_id ? `H-${a.hospital_id}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  )
}

function ForecastView(_: any) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const actual = hours.map(() => Math.floor(Math.random() * 8 + 1))
  const predicted = hours.map(() => Math.floor(Math.random() * 8 + 1))
  const w = 600, h = 160, max = Math.max(...actual, ...predicted)
  const sx = w / (hours.length - 1), sy = (v: number) => h - (v / max) * (h - 10) - 5
  const peakHour = `${Math.floor(Math.random() * 12 + 8)}:00`
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">Demand Forecast</h1>
      <div className="card space-y-4">
        <div className="flex gap-6 text-caption">
          <span className="flex items-center gap-2"><svg width="20" height="2" viewBox="0 0 20 2"><line x1="0" y1="1" x2="20" y2="1" stroke="#1A1917" strokeWidth="1.5" /></svg> Actual</span>
          <span className="flex items-center gap-2"><svg width="20" height="2" viewBox="0 0 20 2"><line x1="0" y1="1" x2="20" y2="1" stroke="#9E9B97" strokeWidth="1.5" strokeDasharray="4 2" /></svg> Predicted</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-48">
          {[0, 0.25, 0.5, 0.75, 1].map(r => <line key={r} x1="0" y1={h * (1 - r)} x2={w} y2={h * (1 - r)} stroke="#E2E0DC" strokeWidth="1" opacity="0.1" />)}
          <polyline points={actual.map((v, i) => `${i * sx},${sy(v)}`).join(" ")} fill="none" stroke="#1A1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points={predicted.map((v, i) => `${i * sx},${sy(v)}`).join(" ")} fill="none" stroke="#9E9B97" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="grid grid-cols-3 gap-4 text-caption">
          <div><span className="text-tertiary">Peak hour</span><p className="text-primary font-medium">{peakHour}</p></div>
          <div><span className="text-tertiary">Busiest location</span><p className="text-primary font-medium">Downtown</p></div>
          <div><span className="text-tertiary">Avg response</span><p className="text-primary font-medium">7.2 min</p></div>
        </div>
      </div>
    </div>
  )
}

function HotspotsView({ emergencies }: any) {
  const [range, setRange] = useState("7days")
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)

  useEffect(() => {
    if (mapRef.current && !map) {
      const m = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(m)
      setMap(m)
    }
    return () => { if (map) map.remove() }
  }, [])

  useEffect(() => {
    if (!map) return
    const groups: Record<string, { lat: number; lng: number; count: number }> = {}
    emergencies.forEach((e: Emergency) => {
      const key = `${Math.round(e.latitude * 10)},${Math.round(e.longitude * 10)}`
      if (!groups[key]) groups[key] = { lat: e.latitude, lng: e.longitude, count: 0 }
      groups[key].count++
    })
    Object.values(groups).forEach(g => {
      const radius = Math.min(g.count * 8, 40)
      const color = g.count >= 2 ? "#C0392B" : g.count === 1 ? "#B7660A" : "#2D7A45"
      L.circleMarker([g.lat, g.lng], {
        radius, color: "#fff", weight: 2, fillColor: color, fillOpacity: 0.6,
      }).addTo(map).bindPopup(`<b>${g.count} emergency(ies)</b>`)
    })
  }, [map, emergencies])

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-primary">Hotspot Map</h1>
        <div className="flex gap-2">
          {["Today", "7 days", "30 days"].map(t => (
            <button key={t} onClick={() => setRange(t === "Today" ? "today" : t === "7 days" ? "7days" : "30days")}
              className={`px-3 py-1.5 rounded text-caption border transition-colors ${(t === "Today" && range === "today") || (t === "7 days" && range === "7days") || (t === "30 days" && range === "30days") ? "bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] border-accent" : "bg-surface2 text-secondary hover:text-primary border-border"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card lg:col-span-3 h-[500px] overflow-hidden rounded-xl" ref={mapRef} />
        <div className="space-y-3">
          <div className="card">
            <p className="text-section-label text-tertiary">Total emergencies</p>
            <p className="text-metric-number tabular-nums text-primary mt-1">{emergencies.length}</p>
          </div>
          <div className="card">
            <p className="text-section-label text-tertiary">Unique locations</p>
            <p className="text-metric-number tabular-nums text-primary mt-1">{new Set(emergencies.map((e: Emergency) => `${Math.round(e.latitude * 10)},${Math.round(e.longitude * 10)}`)).size}</p>
          </div>
          <div className="card">
            <p className="text-section-label text-tertiary">Hotspot zones</p>
            <p className="text-metric-number tabular-nums text-primary mt-1">{emergencies.filter((e: Emergency) => e.severity === "critical").length}</p>
          </div>
          <div className="card p-3">
            <p className="text-section-label text-tertiary">Legend</p>
            <div className="mt-2 space-y-1.5 text-caption text-secondary">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-status-red" /> Critical zone</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-status-amber" /> Moderate</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-status-green" /> Low activity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminStaffView() {
  const staff = [
    { name: "Dr. Meera Nair", role: "Cardiologist", hospital: "City Hospital", status: "Active" },
    { name: "Nurse Priya K.", role: "Senior Nurse", hospital: "City Hospital", status: "Active" },
    { name: "Dr. Arjun Reddy", role: "Neurologist", hospital: "Metro Medical", status: "Active" },
    { name: "Dr. Sanjay Joshi", role: "Orthopedic Surgeon", hospital: "Metro Medical", status: "Off" },
    { name: "Nurse Anita D.", role: "ICU Nurse", hospital: "City Hospital", status: "Active" },
    { name: "Dr. Kavita B.", role: "Anesthesiologist", hospital: "Apollo", status: "On-call" },
    { name: "Tech Raj M.", role: "Lab Technician", hospital: "Apollo", status: "Active" },
    { name: "Dr. Deepak C.", role: "Pulmonologist", hospital: "City Hospital", status: "Off" },
  ]
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-primary">Staff Management</h1>
        <button className="px-3 py-1.5 rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] text-caption hover:opacity-85">Add staff</button>
      </div>
      <DataTable>
        <thead>
          <tr className="border-b border-border dark:border-border-dark">
            <th className="th">Name</th>
            <th className="th">Role</th>
            <th className="th">Hospital</th>
            <th className="th">Status</th>
            <th className="w-24 py-3"/>
          </tr>
        </thead>
        <tbody>
          {staff.map((s, i) => (
            <tr key={i} className="border-b border-border dark:border-border-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors group">
              <td className="td text-primary">{s.name}</td>
              <td className="td text-secondary">{s.role}</td>
              <td className="td text-secondary">{s.hospital}</td>
              <td className="td">
                <span className={`micro-tag ${s.status === "Active" ? "micro-tag-ok" : s.status === "On-call" ? "micro-tag-warning" : "micro-tag-default"}`}>{s.status}</span>
              </td>
              <td className="py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-caption text-secondary hover:text-primary">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  )
}

function ReportsView({ emergencies, hospitals }: any) {
  const resolved = emergencies.filter((e: Emergency) => e.status === "resolved").length
  const avgResTime = "7.2 min"
  const busiestHospital = hospitals.reduce((best: any, h: any) => (h.available_beds < (best?.available_beds ?? Infinity) ? h : best), hospitals[0])
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-primary">Reports</h1>
        <div className="flex gap-2">
          {["PDF", "CSV", "Print"].map(f => (
            <button key={f} className="px-3 py-1.5 rounded bg-surface2 text-caption text-secondary hover:text-primary border border-border transition-colors">{f}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><span className="text-section-label text-tertiary">Total emergencies</span><p className="text-metric-number tabular-nums text-primary mt-1">{emergencies.length}</p><p className="text-caption text-tertiary mt-1">This period</p></div>
        <div className="card"><span className="text-section-label text-tertiary">Resolved</span><p className="text-metric-number tabular-nums text-primary mt-1">{resolved}</p><p className="text-caption text-tertiary mt-1">{emergencies.length ? Math.round(resolved / emergencies.length * 100) : 0}% rate</p></div>
        <div className="card"><span className="text-section-label text-tertiary">Avg response</span><p className="text-metric-number tabular-nums text-primary mt-1">{avgResTime}</p><p className="text-caption text-tertiary mt-1">Dispatch to arrival</p></div>
        <div className="card"><span className="text-section-label text-tertiary">Busiest hospital</span><p className="text-metric-number tabular-nums text-primary mt-1">{busiestHospital?.name}</p><p className="text-caption text-tertiary mt-1">{busiestHospital?.available_beds}/{busiestHospital?.total_beds} beds free</p></div>
      </div>
      <div className="card">
        <h2 className="text-section-label text-tertiary mb-4">Emergency trend (7 days)</h2>
        <div className="h-[200px] flex items-end gap-2">
          {[8, 12, 7, 15, 10, 18, 14].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-tertiary">{v}</span>
              <div className="w-full rounded bg-accent dark:bg-primary-dark/70 transition-all hover:opacity-80" style={{ height: `${v * 10}px` }} />
              <span className="text-[10px] text-tertiary">{"MTWTFSS"[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-section-label text-tertiary mb-3">By severity</h2>
          {["critical", "high", "medium", "low"].map(s => {
            const count = emergencies.filter((e: Emergency) => e.severity === s).length
            const pct = emergencies.length ? Math.round(count / emergencies.length * 100) : 0
            const color = s === "critical" ? "bg-status-red" : s === "high" ? "bg-status-amber" : s === "medium" ? "bg-status-green" : "bg-tertiary"
            return (
              <div key={s} className="flex items-center gap-3 mb-2">
                <span className="w-16 text-caption text-secondary capitalize">{s}</span>
                <div className="flex-1 h-2 bg-surface2 rounded-full"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
                <span className="w-10 text-right text-caption text-tertiary">{count}</span>
              </div>
            )
          })}
        </div>
        <div className="card">
          <h2 className="text-section-label text-tertiary mb-3">By hospital</h2>
          {hospitals.slice(0, 5).map((h: Hospital) => {
            const count = emergencies.filter((e: Emergency) => e.assigned_hospital_id === h.id).length
            return (
              <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-caption text-primary">{h.name}</span>
                <span className="text-caption text-tertiary">{count} cases</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AdminSettingsView() {
  const [toggles, setToggles] = useState({ autoRefresh: true, emailAlerts: false, smsAlerts: true, publicDash: false, maintenance: false })
  const toggle = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }))
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">System Settings</h1>
      <div className="card space-y-1">
        <h2 className="text-section-label text-tertiary pb-2">System preferences</h2>
        {[
          { key: "autoRefresh" as const, label: "Auto-refresh", desc: "Refresh dashboard every 8 seconds" },
          { key: "emailAlerts" as const, label: "Email alerts", desc: "Send email on critical emergencies" },
          { key: "smsAlerts" as const, label: "SMS alerts", desc: "Send SMS to on-call staff" },
          { key: "publicDash" as const, label: "Public dashboard", desc: "Allow public read-only access" },
          { key: "maintenance" as const, label: "Maintenance mode", desc: "Disable all non-admin access" },
        ].map(s => (
          <div key={s.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div><p className="text-body text-primary">{s.label}</p><p className="text-caption text-tertiary">{s.desc}</p></div>
            <button onClick={() => toggle(s.key)}
              className={`w-10 h-5 rounded-full transition-colors ${toggles[s.key] ? "bg-accent dark:bg-primary-dark" : "bg-border"} relative`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${toggles[s.key] ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h2 className="text-section-label text-tertiary">API Configuration</h2>
          {["API URL", "API Key", "Refresh interval"].map(f => (
            <div key={f}>
              <label className="text-caption text-tertiary block mb-1">{f}</label>
              <input className="w-full border border-border rounded px-3 py-1.5 text-caption bg-surface2 text-primary" defaultValue={f === "API URL" ? "http://localhost:8000" : f === "API Key" ? "••••••••" : "8s"} />
            </div>
          ))}
          <button className="px-3 py-1.5 rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] text-caption hover:opacity-85">Update</button>
        </div>
        <div className="card space-y-3">
          <h2 className="text-section-label text-tertiary">Notifications</h2>
          {["Emergency alerts", "System updates", "Staff changes", "Daily summary"].map(n => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-caption text-primary">{n}</span>
              <button className="w-10 h-5 rounded-full bg-accent dark:bg-primary-dark relative"><span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow-sm" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="card space-y-3">
        <h2 className="text-section-label text-tertiary">Data management</h2>
        <div className="flex gap-3 flex-wrap">
          {["Export all data", "Clear demo data", "Restore defaults"].map(a => (
            <button key={a} className={`px-4 py-2 rounded text-caption border ${a === "Clear demo data" || a === "Restore defaults" ? "border-status-red text-status-red hover:bg-status-red hover:text-white" : "border-border text-secondary hover:text-primary"} transition-colors`}>{a}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsersView() {
  const users = [
    { name: "John Doe", role: "Ambulance operator", portal: "Ambulance", status: "Active", last: "2 min ago" },
    { name: "Jane Smith", role: "Hospital staff", portal: "Hospital", status: "Active", last: "15 min ago" },
    { name: "Admin User", role: "Admin", portal: "Admin", status: "Active", last: "just now" },
    { name: "Patient One", role: "Patient", portal: "Patient", status: "Active", last: "1h ago" },
  ]
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-primary">User Management</h1>
        <button className="px-3 py-1.5 rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] text-caption hover:opacity-85">Add user</button>
      </div>
      <DataTable>
        <thead>
          <tr className="border-b border-border dark:border-border-dark">
            <th className="th">Name</th>
            <th className="th">Role</th>
            <th className="th">Portal</th>
            <th className="th">Status</th>
            <th className="th">Last active</th>
            <th className="w-24 py-3"/>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i} className="border-b border-border dark:border-border-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors group">
              <td className="td text-primary">{u.name}</td>
              <td className="td text-secondary">{u.role}</td>
              <td className="td text-secondary">{u.portal}</td>
              <td className="td"><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-status-green" : "bg-status-red"}`} /><span className="text-secondary">{u.status}</span></span></td>
              <td className="td text-tertiary">{u.last}</td>
              <td className="py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-caption text-secondary hover:text-primary">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  )
}
