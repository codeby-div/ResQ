import { useState, useEffect, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { createEmergency, fetchEmergencies } from "../services/api"
import { subscribeAllEmergencies, unsubscribeAllEmergencies } from "../services/socket"
import { onEmergencyUpdate } from "../services/notifications"
import type { Emergency, EmergencyFormData } from "../types"

const severityColors: Record<string, string> = {
  low: "#16a34a", medium: "#ca8a04", high: "#ea580c", critical: "#dc2626",
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng) } })
  return null
}

export default function UserPortal() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [showForm, setShowForm] = useState<{ lat: number; lng: number } | null>(null)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [myId, setMyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try { setEmergencies(await fetchEmergencies()) } catch { /* ignore */ }
  }, [])

  // Initial load
  useEffect(() => { load() }, [load])

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
        load()
      }
    })
    return () => { cleanup(); unsubscribeAllEmergencies() }
  }, [load])

  // Background fallback poll (30s)
  useEffect(() => { const i = setInterval(load, 30000); return () => clearInterval(i) }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showForm) return
    const data: EmergencyFormData = {
      patient_name: name, description: desc,
      latitude: showForm.lat, longitude: showForm.lng,
      severity: "medium",
    }
    try {
      const created = await createEmergency(data)
      setMyId(created.id)
      setShowForm(null)
      setName("")
      setDesc("")
      load()
    } catch { /* ignore */ }
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <div className="w-80 bg-white border-r p-4 overflow-y-auto space-y-4">
        <h2 className="font-bold text-lg">Report Emergency</h2>
        <p className="text-xs text-gray-500">Click on the map to set location</p>

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" />
            <textarea placeholder="Describe the emergency..." value={desc} onChange={e => setDesc(e.target.value)}
              rows={3} className="w-full border rounded px-3 py-2 text-sm" />
            <div className="text-xs text-gray-400">📍 {showForm.lat.toFixed(4)}, {showForm.lng.toFixed(4)}</div>
            <button type="submit" className="w-full bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700">
              Submit Emergency
            </button>
            <button type="button" onClick={() => setShowForm(null)}
              className="w-full border py-2 rounded text-sm hover:bg-gray-50">
              Cancel
            </button>
          </form>
        ) : (
          <div className="text-xs text-gray-400 italic">Tap anywhere on the map</div>
        )}

        {myId && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
            <p className="font-medium text-green-800">Emergency #{myId} submitted!</p>
            <p className="text-green-600 text-xs">Track its status on the map below.</p>
          </div>
        )}

        <hr />

        <h3 className="font-semibold text-sm">My Emergencies</h3>
        <div className="space-y-2">
          {emergencies.filter(e => myId ? e.id === myId : false).map(e => (
            <div key={e.id} className="border rounded p-2 text-xs">
              <p className="font-medium">{e.patient_name}</p>
              <p>Status: <span className="font-medium">{e.status}</span></p>
              <p>Severity: {e.severity}</p>
            </div>
          ))}
          {emergencies.length === 0 && <p className="text-xs text-gray-400">No emergencies yet</p>}
        </div>
      </div>

      <div className="flex-1">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onClick={(lat, lng) => setShowForm({ lat, lng })} />
          {emergencies.map(e => (
            <Marker key={e.id} position={[e.latitude, e.longitude]}
              icon={L.divIcon({
                html: `<div style="background:${severityColors[e.severity]};color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid #fff">!</div>`,
                className: "", iconSize: [20, 20], iconAnchor: [10, 10],
              })}>
              <Popup>
                <div className="text-sm">
                  <strong>{e.patient_name}</strong><br />
                  Severity: {e.severity}<br />
                  Status: {e.status}<br />
                  {e.assigned_ambulance_id && <span>Ambulance assigned ✓</span>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
