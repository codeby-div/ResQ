import { useEffect, useState, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { fetchHospitals, fetchAmbulances, fetchEmergencies, createEmergency } from "../services/api"
import { demoHospitals, demoAmbulances } from "../services/demoData"
import { subscribeAllEmergencies, unsubscribeAllEmergencies } from "../services/socket"
import { onEmergencyUpdate } from "../services/notifications"
import type { Hospital, Ambulance, Emergency, EmergencyFormData } from "../types"
import EmergencyForm from "../components/EmergencyForm"
import EmptyState from "../components/ui/EmptyState"

const hospitalIcon = L.divIcon({
  html: `<div style="background:#1D6FA8;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);font-weight:300;">+</div>`,
  className: "", iconSize: [28, 28], iconAnchor: [14, 14],
})

const ambulanceIcon = L.divIcon({
  html: `<div style="background:#2D7A45;color:#fff;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);font-weight:500;">🚑</div>`,
  className: "", iconSize: [26, 26], iconAnchor: [13, 13],
})

const emergencyColors: Record<string, string> = { critical: "#C0392B", high: "#ea580c", medium: "#ca8a04", low: "#16a34a" }

const emergencyIcon = (severity: string, isCritical: boolean) => L.divIcon({
  html: `<div style="background:${emergencyColors[severity]};color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid #fff;box-shadow:0 0 0 ${isCritical ? '4px' : '0'} rgba(192,57,43,0.3), 0 2px 8px rgba(0,0,0,.2);animation:${isCritical ? 'pulse-ring 2s infinite' : 'none'}">!</div>`,
  className: "", iconSize: [22, 22], iconAnchor: [11, 11],
})

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng) } })
  return null
}

export default function MapPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [showForm, setShowForm] = useState<{ lat: number; lng: number } | null>(null)
  const [showHospitals, setShowHospitals] = useState(true)
  const [showAmbulances, setShowAmbulances] = useState(true)
  const [showEmergencies, setShowEmergencies] = useState(true)
  const [selectedDispatch, setSelectedDispatch] = useState<Emergency | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [h, a, e] = await Promise.all([fetchHospitals(), fetchAmbulances(), fetchEmergencies()])
      setHospitals(h); setAmbulances(a); setEmergencies(e)
    } catch { setHospitals(demoHospitals); setAmbulances(demoAmbulances) }
  }, [])

  // Initial load
  useEffect(() => { loadData() }, [loadData])

  // WebSocket real-time emergency updates
  const emergenciesRef = useRef(emergencies)
  emergenciesRef.current = emergencies
  useEffect(() => {
    subscribeAllEmergencies()
    const cleanup = onEmergencyUpdate((data: any) => {
      const idx = emergenciesRef.current.findIndex((e: Emergency) => e.id === data.emergency_id)
      if (idx >= 0) {
        setEmergencies(prev => prev.map(e => e.id === data.emergency_id ? { ...e, ...data } : e))
      } else {
        loadData()
      }
    })
    return () => { cleanup(); unsubscribeAllEmergencies() }
  }, [loadData])

  // Background fallback poll (30s)
  useEffect(() => { const i = setInterval(loadData, 30000); return () => clearInterval(i) }, [loadData])

  const handleFormSubmit = async (data: EmergencyFormData) => {
    try { await createEmergency(data); setShowForm(null); loadData() } catch { console.error("Failed") }
  }

  const sortedHospitals = [...hospitals].sort((a, b) => b.available_beds / Math.max(b.total_beds, 1) - a.available_beds / Math.max(a.total_beds, 1))

  return (
    <div className="flex h-[calc(100vh-52px)]">
      <div className="w-72 border-r border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-y-auto shrink-0 hidden lg:block p-4 space-y-4">
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-tertiary dark:text-tertiary-dark font-medium">
          Nearby Hospitals <span className="text-secondary dark:text-secondary-dark normal-case">by load</span>
        </h2>
        {sortedHospitals.length === 0 ? (
          <EmptyState heading="No hospitals" subtext="" />
        ) : (
          sortedHospitals.map(h => (
            <div key={h.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-primary dark:text-primary-dark truncate">{h.name}</span>
                <span className="text-xs text-tertiary dark:text-tertiary-dark shrink-0">{h.available_beds}/{h.total_beds}</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-surface2-dark rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(h.available_beds / Math.max(h.total_beds, 1)) * 100}%`,
                    backgroundColor: h.available_beds > 10 ? "#16A34A" : h.available_beds > 3 ? "#D97706" : "#DC2626",
                  }}
                />
              </div>
            </div>
          ))
        )}

        <div className="pt-4 space-y-2 text-xs text-secondary dark:text-secondary-dark">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showHospitals} onChange={e => setShowHospitals(e.target.checked)} className="accent-blue-600" />
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" /> Hospitals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showAmbulances} onChange={e => setShowAmbulances(e.target.checked)} className="accent-green-600" />
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-green-700" /> Ambulances</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showEmergencies} onChange={e => setShowEmergencies(e.target.checked)} className="accent-red-600" />
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600" /> Emergencies</span>
          </label>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onClick={(lat, lng) => setShowForm({ lat, lng })} />

          {showHospitals && hospitals.map(h => (
            <Marker key={`h-${h.id}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
              <Popup><div className="text-sm"><strong>{h.name}</strong><br />Beds: {h.available_beds}/{h.total_beds}<br />ICU: {h.available_icu}/{h.total_icu}</div></Popup>
            </Marker>
          ))}

          {showAmbulances && ambulances.map(a => (
            <Marker key={`a-${a.id}`} position={[a.latitude, a.longitude]} icon={ambulanceIcon}>
              <Popup><div className="text-sm"><strong>{a.vehicle_id}</strong><br />Status: {a.status}</div></Popup>
            </Marker>
          ))}

          {showEmergencies && emergencies.map(e => (
            <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]}
              eventHandlers={{ click: () => setSelectedDispatch(e) }}
              icon={emergencyIcon(e.severity, e.severity === "critical")}>
              <Popup>
                <div className="text-sm">
                  <strong>{e.patient_name}</strong><br />
                  Severity: {e.severity}<br />
                  Status: {e.status}
                </div>
              </Popup>
            </Marker>
          ))}

          {selectedDispatch && selectedDispatch.assigned_ambulance_id && (
            <Polyline
              positions={[
                ambulances.find(a => a.id === selectedDispatch.assigned_ambulance_id)?.latitude ? [ambulances.find(a => a.id === selectedDispatch.assigned_ambulance_id)!.latitude, ambulances.find(a => a.id === selectedDispatch.assigned_ambulance_id)!.longitude] as [number, number] : [0, 0],
                [selectedDispatch.latitude, selectedDispatch.longitude],
              ]}
              pathOptions={{ color: "#3B82F6", dashArray: "8 4", weight: 2 }}
            />
          )}
        </MapContainer>

        <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-1 shadow-lg">
          <button onClick={() => {}} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-surface2-dark text-secondary dark:text-secondary-dark transition-colors" aria-label="Zoom in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
          </button>
        </div>

        <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg px-3 py-2 text-xs shadow text-secondary dark:text-secondary-dark">
          Click map to report an emergency
        </div>

        {showForm && (
          <EmergencyForm
            lat={showForm.lat}
            lng={showForm.lng}
            onSubmit={handleFormSubmit}
            onClose={() => setShowForm(null)}
          />
        )}
      </div>
    </div>
  )
}
