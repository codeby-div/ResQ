import { test, expect } from "@playwright/test"
import { seedHospitalsAndAmbulances, registerAdmin, createEmergency } from "./helpers"

test.describe("Dispatcher assigns resources", () => {
  let emergencyId: number

  test.beforeAll(async () => {
    await registerAdmin()
    await seedHospitalsAndAmbulances()
    const em = await createEmergency("Dispatch Test Patient")
    emergencyId = em.id
  })

  test("assign ambulance and hospital, verify dispatched status", async ({ request }) => {
    const res = await request.post(
      `http://localhost:8000/emergencies/${emergencyId}/assign?ambulance_id=1&hospital_id=1`
    )
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe("dispatched")
    expect(body.assigned_ambulance_id).toBe(1)
    expect(body.assigned_hospital_id).toBe(1)
  })
})
