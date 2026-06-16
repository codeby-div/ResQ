import { getSocket } from "./socket"
import { showToast } from "../components/Toast"
import type { TrackingInfo } from "../types"

export function initNotificationListeners() {
  const socket = getSocket()

  socket.on("tracking_update", (data: TrackingInfo & { emergency_id: number }) => {
    // Handled by individual component callbacks
  })

  socket.on("emergency_update", (data: any) => {
    if (data.severity === "critical") {
      showToast({
        id: `emergency-${data.emergency_id}`,
        title: `Critical Emergency #${data.emergency_id}`,
        body: `${data.patient_name} — ${data.severity} severity`,
        type: "emergency",
      })
    }
  })

  socket.on("ambulance_update", (data: any) => {
    if (data.status === "dispatched") {
      showToast({
        id: `ambulance-${data.emergency_id}`,
        title: "Ambulance Dispatched",
        body: `Assigned to ${data.patient_name}`,
        type: "dispatch",
      })
    }
  })
}

export function onTrackingUpdate(cb: (data: TrackingInfo & { emergency_id: number }) => void) {
  const socket = getSocket()
  socket.on("tracking_update", cb)
  return () => { socket.off("tracking_update", cb) }
}

export function onEmergencyUpdate(cb: (data: any) => void) {
  const socket = getSocket()
  socket.on("emergency_update", cb)
  return () => { socket.off("emergency_update", cb) }
}

export function onAmbulanceUpdate(cb: (data: any) => void) {
  const socket = getSocket()
  socket.on("ambulance_update", cb)
  return () => { socket.off("ambulance_update", cb) }
}
