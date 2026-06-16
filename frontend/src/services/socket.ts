import { io, Socket } from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    socket.on("connect", () => console.log("[Socket] Connected"))
    socket.on("disconnect", () => console.log("[Socket] Disconnected"))
  }
  return socket
}

export function joinTracking(emergencyId: number) {
  const s = getSocket()
  s.emit("join_tracking", { emergency_id: emergencyId })
}

export function leaveTracking(emergencyId: number) {
  const s = getSocket()
  s.emit("leave_tracking", { emergency_id: emergencyId })
}

export function subscribeAllEmergencies() {
  const s = getSocket()
  s.emit("join_all_emergencies")
}

export function unsubscribeAllEmergencies() {
  const s = getSocket()
  s.emit("leave_all_emergencies")
}

export function subscribeAmbulance(ambulanceId: number) {
  const s = getSocket()
  s.emit("subscribe_ambulance", { ambulance_id: ambulanceId })
}

export function unsubscribeAmbulance(ambulanceId: number) {
  const s = getSocket()
  s.emit("unsubscribe_ambulance", { ambulance_id: ambulanceId })
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
