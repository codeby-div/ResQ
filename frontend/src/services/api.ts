import axios from "axios"
import type { Hospital, Ambulance, Emergency, Recommendation, EmergencyFormData, Hotspot, Summary, TrackingInfo } from "../types"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
})

export async function fetchHospitals(): Promise<Hospital[]> {
  const { data } = await api.get("/hospitals")
  return data
}

export async function fetchAmbulances(): Promise<Ambulance[]> {
  const { data } = await api.get("/ambulances")
  return data
}

export async function fetchEmergencies(): Promise<Emergency[]> {
  const { data } = await api.get("/emergencies")
  return data
}

export async function createEmergency(form: EmergencyFormData): Promise<Emergency> {
  const { data } = await api.post("/emergencies", form)
  return data
}

export async function updateEmergency(
  id: number,
  updates: Partial<Emergency>
): Promise<Emergency> {
  const { data } = await api.patch(`/emergencies/${id}`, updates)
  return data
}

export async function getRecommendation(id: number): Promise<Recommendation> {
  const { data } = await api.post(`/emergencies/${id}/recommend`)
  return data
}

export async function fetchHotspots(): Promise<Hotspot[]> {
  const { data } = await api.get("/emergencies/analytics/hotspots")
  return data.hotspots
}

export async function fetchSummary(): Promise<Summary> {
  const { data } = await api.get("/emergencies/analytics/summary")
  return data
}

export async function updateAmbulance(id: number, updates: Partial<Ambulance>): Promise<Ambulance> {
  const { data } = await api.patch(`/ambulances/${id}`, updates)
  return data
}

export async function updateHospital(id: number, updates: Partial<Hospital>): Promise<Hospital> {
  const { data } = await api.patch(`/hospitals/${id}`, updates)
  return data
}

export async function fetchAmbulanceEmergencies(id: number): Promise<Emergency[]> {
  const { data } = await api.get(`/ambulances/${id}/emergencies`)
  return data
}

export async function fetchHospitalEmergencies(id: number): Promise<Emergency[]> {
  const { data } = await api.get(`/hospitals/${id}/emergencies`)
  return data
}

export async function fetchTracking(id: number): Promise<TrackingInfo> {
  const { data } = await api.get(`/emergencies/${id}/tracking`)
  return data
}
