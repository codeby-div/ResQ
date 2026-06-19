import { request } from "@playwright/test"

const API_URL = process.env.API_URL || "http://localhost:8000"

export async function seedHospitalsAndAmbulances() {
  const ctx = await request.newContext({ baseURL: API_URL })

  await ctx.post("/hospitals", { data: { name: "Test Hospital A", latitude: 28.61, longitude: 77.23, total_beds: 100, available_beds: 20, total_icu: 10, available_icu: 3 } })
  await ctx.post("/hospitals", { data: { name: "Test Hospital B", latitude: 28.62, longitude: 77.24, total_beds: 80, available_beds: 5, total_icu: 8, available_icu: 1 } })
  await ctx.post("/ambulances", { data: { vehicle_id: "TEST-AMB-001", latitude: 28.60, longitude: 77.22, driver_name: "Test Driver", driver_phone: "9876543999" } })
}

export async function createEmergency(patientName: string) {
  const ctx = await request.newContext({ baseURL: API_URL })
  const res = await ctx.post("/emergencies", {
    data: { patient_name: patientName, description: "Test emergency description", latitude: 28.61, longitude: 77.23, severity: "high", phone: "9876543000", email: "test@example.com" },
  })
  return res.json()
}

export async function registerAdmin() {
  const ctx = await request.newContext({ baseURL: API_URL })
  await ctx.post("/auth/register", { data: { username: "admin", password: "admin123", role: "admin", display_name: "Admin" } })
}
