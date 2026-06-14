import { useState, useEffect, useCallback } from "react"
import { fetchHospitals, fetchEmergencies, updateEmergency, updateHospital } from "../services/api"
import { demoHospitals } from "../services/demoData"
import type { Hospital, Emergency } from "../types"
import AlertItem from "../components/ui/AlertItem"
import ConfirmationModal from "../components/ui/ConfirmationModal"

type View = "dashboard" | "incoming" | "bedmgmt" | "wardmap" | "icu" | "staff" | "availability" | "notifications" | "settings"

const nav: { label: string; items: { key: View; label: string }[] }[] = [
  { label: "Overview", items: [
    { key: "dashboard", label: "Dashboard" },
    { key: "incoming", label: "Incoming cases" },
    { key: "bedmgmt", label: "Bed management" },
  ]},
  { label: "Resources", items: [
    { key: "wardmap", label: "Ward map" },
    { key: "icu", label: "ICU tracker" },
    { key: "staff", label: "Staff on call" },
  ]},
  { label: "System", items: [
    { key: "availability", label: "Update availability" },
    { key: "notifications", label: "Notifications" },
    { key: "settings", label: "Settings" },
  ]},
]

const relTime = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime(); const m = Math.floor(d / 60000)
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; return `${Math.floor(m / 60)}h ago`
}

export default function HospitalPortal() {
  const [view, setView] = useState<View>("dashboard")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [selectedId, setSelectedId] = useState<number>(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bedInput, setBedInput] = useState({ beds: "", icu: "", er: "" })
  const [accepting, setAccepting] = useState("all")
  const [note, setNote] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const load = useCallback(async () => {
    try { const [h, e] = await Promise.all([fetchHospitals(), fetchEmergencies()]); setHospitals(h); setEmergencies(e) }
    catch { setHospitals(demoHospitals) }
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i) }, [load])

  const h = hospitals.find(x => x.id === selectedId)
  const incoming = emergencies.filter(e => e.assigned_hospital_id === selectedId && e.status !== "resolved")
  const bedPct = h ? (h.available_beds / Math.max(h.total_beds, 1)) * 100 : 0

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
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-border dark:border-border-dark flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-surface2 dark:bg-surface2-dark flex items-center justify-center text-caption font-medium">NH</div>
        <div className="flex-1 min-w-0">
          <p className="text-caption font-medium text-primary dark:text-primary-dark truncate">Nurse Harper</p>
          <p className="text-caption text-tertiary dark:text-tertiary-dark truncate">ER Staff</p>
        </div>
      </div>
    </aside>
  )

  const Header = () => (
    <header className="h-[52px] bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-secondary dark:text-secondary-dark" aria-label="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <span className="text-[18px] font-medium text-status-red">+</span>
        <span className="text-[15px] font-medium text-primary dark:text-primary-dark">ResQ</span>
        <span className="hidden sm:block text-caption text-tertiary dark:text-tertiary-dark ml-2">/ {view.replace(/([A-Z])/g, " $1").trim()}</span>
      </div>
      <div className="flex items-center gap-3">
        <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
          className="text-caption bg-surface2 dark:bg-surface2-dark border border-border dark:border-border-dark rounded px-2 py-1 text-primary dark:text-primary-dark">
          {hospitals.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>
    </header>
  )

  return (
    <div className="h-screen flex flex-col bg-page dark:bg-[#0F1117]">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`${sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden"} lg:flex lg:relative lg:z-0`}>
          {sidebarOpen && <div className="absolute inset-0 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          {view === "dashboard" && !h && <p className="text-caption text-tertiary">Select a hospital</p>}
          {view === "dashboard" && h && <DashboardView h={h} incoming={incoming} emergencies={emergencies} hospitals={hospitals} bedPct={bedPct} relTime={relTime} load={load} selectedId={selectedId} />}
          {view === "incoming" && <IncomingView incoming={incoming} load={load} />}
          {view === "bedmgmt" && <BedMgmtView h={h} load={load} selectedId={selectedId} />}
          {view === "wardmap" && <WardMapView h={h} />}
          {view === "availability" && <AvailabilityView bedInput={bedInput} setBedInput={setBedInput} accepting={accepting} setAccepting={setAccepting} note={note} setNote={setNote} setConfirmOpen={setConfirmOpen} load={load} selectedId={selectedId} />}
        </main>
      </div>
      {confirmOpen && <ConfirmationModal title="Update Availability" description="Publish these availability changes?" onConfirm={() => { setConfirmOpen(false) }} onCancel={() => setConfirmOpen(false)} />}
    </div>
  )
}

function DashboardView({ h, incoming, emergencies, hospitals, bedPct, relTime }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-page-title text-primary dark:text-primary-dark">{h.name}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`card ${bedPct > 30 ? "card-ok" : bedPct > 10 ? "card-warning" : "card-critical"}`}>
          <span className="text-section-label text-tertiary">General beds free</span>
          <p className="text-metric-number tabular-nums text-primary mt-1">{h.available_beds}/{h.total_beds}</p>
        </div>
        <div className={`card ${h.available_icu > 3 ? "card-ok" : h.available_icu > 0 ? "card-warning" : "card-critical"}`}>
          <span className="text-section-label text-tertiary">ICU beds free</span>
          <p className="text-metric-number tabular-nums text-primary mt-1">{h.available_icu}/{h.total_icu}</p>
        </div>
        <div className={`card ${h.available_beds > 5 ? "card-ok" : "card-warning"}`}>
          <span className="text-section-label text-tertiary">ER bays free</span>
          <p className="text-metric-number tabular-nums text-primary mt-1">{Math.max(0, Math.floor(h.available_beds / 3))}</p>
        </div>
        <div className="card">
          <span className="text-section-label text-tertiary">Incoming patients</span>
          <p className="text-metric-number tabular-nums text-primary mt-1">{incoming.length}</p>
          {incoming.length > 0 && <p className="text-caption text-tertiary mt-1">ETA ~8-12 min</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <span className="text-section-label text-tertiary">Incoming Ambulances</span>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-caption">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Case ID</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Type</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Severity</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Ambulance</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">ETA</th>
                  <th className="w-24 py-3"></th>
                </tr></thead>
                <tbody>
                  {incoming.slice(0, 5).map((e: Emergency) => (
                    <tr key={e.id} className="border-b border-border hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors group">
                      <td className="py-3 pr-4 text-primary">#{e.id}</td>
                      <td className="py-3 pr-4 text-secondary">{e.description?.slice(0, 15) || "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${e.severity === "critical" ? "bg-status-red" : e.severity === "high" ? "bg-status-amber" : "bg-status-green"}`} />
                          <span className="text-secondary">{e.severity}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-secondary">AMB-{e.assigned_ambulance_id || "—"}</td>
                      <td className="py-3 pr-4 text-secondary">{Math.floor(Math.random() * 10 + 3)} min</td>
                      <td className="py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-caption bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] px-2 py-1 rounded hover:opacity-85 text-nowrap">Prep ER bay</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <span className="text-section-label text-tertiary">Recent Admissions</span>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-caption">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Patient</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Case type</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Ward</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Admitted</th>
                  <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {emergencies.filter((e: Emergency) => e.status === "resolved").slice(0, 4).map((e: Emergency) => (
                    <tr key={e.id} className="border-b border-border hover:bg-surface2 transition-colors">
                      <td className="py-3 pr-4 text-primary">{e.patient_name}</td>
                      <td className="py-3 pr-4 text-secondary">{e.severity}</td>
                      <td className="py-3 pr-4 text-secondary">General</td>
                      <td className="py-3 pr-4 text-tertiary">{relTime(e.created_at)}</td>
                      <td className="py-3"><span className="micro-tag-ok">Stable</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <span className="text-section-label text-tertiary">Alerts Feed</span>
          <div className="card p-0 divide-y divide-border">
            {emergencies.slice(0, 4).map((e: Emergency) => (
              <AlertItem key={e.id} severity={e.severity === "critical" ? "critical" : e.severity === "high" ? "warning" : "info"} message={`${e.patient_name} — ${e.severity}`} timestamp={relTime(e.created_at)} unread={e.status === "pending"} />
            ))}
            {emergencies.length === 0 && <div className="p-8 text-center text-caption text-tertiary">No active alerts</div>}
          </div>

          <div className="card">
            <span className="text-section-label text-tertiary">Hospital Capacity</span>
            <div className="mt-3 space-y-3">
              {hospitals.slice(0, 5).map((hosp: Hospital) => {
                const pct = hosp.total_beds > 0 ? Math.round((hosp.available_beds / hosp.total_beds) * 100) : 0
                return (
                  <div key={hosp.id}>
                    <div className="flex justify-between text-caption mb-1">
                      <span className="text-primary truncate">{hosp.name}</span>
                      <span className="text-tertiary">{pct}%</span>
                    </div>
                    <div className="h-[2px] bg-border dark:bg-border-dark rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 30 ? "#2D7A45" : pct > 10 ? "#B7660A" : "#C0392B" }} />
                    </div>
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

function IncomingView({ incoming, load }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">Incoming Cases</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-caption">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Case ID</th>
              <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Patient</th>
              <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">Severity</th>
              <th className="text-left py-3 pr-4 text-section-label text-tertiary font-medium">ETA</th>
              <th className="w-24 py-3"></th>
            </tr></thead>
            <tbody>
              {incoming.map((e: Emergency) => (
                <tr key={e.id} className="border-b border-border hover:bg-surface2 transition-colors group">
                  <td className="py-3 pr-4 text-primary">#{e.id}</td>
                  <td className="py-3 pr-4 text-primary">{e.patient_name}</td>
                  <td className="py-3 pr-4"><span className={`micro-tag ${e.severity === "critical" ? "micro-tag-critical" : e.severity === "high" ? "micro-tag-warning" : "micro-tag-info"}`}>{e.severity}</span></td>
                  <td className="py-3 pr-4 text-tertiary">{Math.floor(Math.random() * 10 + 3)} min</td>
                  <td className="py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={async () => { await updateEmergency(e.id, { status: "resolved" } as any); load() }} className="text-caption text-secondary hover:text-primary">Assign bed</button>
                  </td>
                </tr>
              ))}
              {incoming.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-caption text-tertiary">No incoming cases</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BedMgmtView({ h, load, selectedId }: any) {
  const [beds, setBeds] = useState({ available_beds: "", available_icu: "" })
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">Bed Management</h1>
      <div className="card space-y-4">
        <span className="text-section-label text-tertiary">General beds</span>
        <div className="flex items-center gap-3">
          <input type="number" value={beds.available_beds} onChange={e => setBeds(p => ({ ...p, available_beds: e.target.value }))}
            className="w-24 border border-border rounded px-3 py-1.5 text-caption bg-surface2 text-primary" placeholder={String(h?.available_beds || 0)} />
          <span className="text-caption text-secondary">/ {h?.total_beds || 0}</span>
          <button onClick={async () => { if (beds.available_beds) { await updateHospital(selectedId, { available_beds: parseInt(beds.available_beds) } as any); load() } }}
            className="text-caption bg-accent text-white px-3 py-1.5 rounded hover:opacity-85">Update</button>
        </div>
        <span className="text-section-label text-tertiary">ICU beds</span>
        <div className="flex items-center gap-3">
          <input type="number" value={beds.available_icu} onChange={e => setBeds(p => ({ ...p, available_icu: e.target.value }))}
            className="w-24 border border-border rounded px-3 py-1.5 text-caption bg-surface2 text-primary" placeholder={String(h?.available_icu || 0)} />
          <span className="text-caption text-secondary">/ {h?.total_icu || 0}</span>
          <button onClick={async () => { if (beds.available_icu) { await updateHospital(selectedId, { available_icu: parseInt(beds.available_icu) } as any); load() } }}
            className="text-caption bg-accent text-white px-3 py-1.5 rounded hover:opacity-85">Update</button>
        </div>
      </div>
    </div>
  )
}

function WardMapView(_: any) {
  const bedColors: Record<string, string> = {
    free: "bg-surface2 dark:bg-surface2-dark text-tertiary",
    occupied: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700",
    incoming: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
    reserved: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700",
  }
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">Ward Map</h1>
      <div className="card space-y-4">
        <div className="flex gap-4 text-caption text-secondary">
          {[["free", "Free"], ["occupied", "Occupied"], ["incoming", "Incoming"], ["reserved", "Reserved"]].map(([k, v]) => (
            <span key={k} className="flex items-center gap-1"><span className={`w-3 h-3 rounded ${bedColors[k].split(" ")[0]}`} />{v}</span>
          ))}
        </div>
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
          {Array.from({ length: 60 }).map((_, i) => {
            const type = i < 18 ? "free" : i < 38 ? "occupied" : i < 48 ? "incoming" : "reserved"
            const pulse = type === "incoming" ? "animate-pulse" : ""
            return (
              <button key={i} className={`w-full aspect-square rounded text-[10px] flex items-center justify-center ${bedColors[type]} ${pulse} transition-transform hover:scale-110`} title={`Bed ${i + 1}: ${type}`} aria-label={`Bed ${i + 1}: ${type}`}>
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AvailabilityView({ bedInput, setBedInput, accepting, setAccepting, note, setNote, setConfirmOpen }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-page-title text-primary">Update Availability</h1>
      <div className="card space-y-4">
        {["beds", "icu", "er"].map(f => (
          <div key={f}>
            <label className="text-section-label text-tertiary">{f === "beds" ? "General beds free" : f === "icu" ? "ICU beds free" : "ER bays free"}</label>
            <input type="number" value={bedInput[f]} onChange={e => setBedInput((p: any) => ({ ...p, [f]: e.target.value }))}
              className="mt-1 w-full border border-border rounded px-3 py-1.5 text-caption bg-surface2 text-primary" placeholder="0" />
          </div>
        ))}
        <div>
          <label className="text-section-label text-tertiary">Accepting cases</label>
          <select value={accepting} onChange={e => setAccepting(e.target.value)}
            className="mt-1 w-full border border-border rounded px-3 py-1.5 text-caption bg-surface2 text-primary">
            {["All", "Non-critical", "Cardiac only", "Not accepting"].map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-section-label text-tertiary">On-call note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            className="mt-1 w-full border border-border rounded px-3 py-1.5 text-caption bg-surface2 text-primary" placeholder="Optional notes..." />
        </div>
        <button onClick={() => setConfirmOpen(true)}
          className="w-full py-2 rounded bg-accent dark:bg-primary-dark text-white dark:text-[#0F1117] text-body font-medium hover:opacity-85 active:scale-[0.98] transition-all">
          Publish
        </button>
      </div>
    </div>
  )
}
