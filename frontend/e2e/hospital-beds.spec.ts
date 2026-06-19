import { test, expect } from "@playwright/test"
import { seedHospitalsAndAmbulances } from "./helpers"

test.describe("Hospital updates bed availability", () => {
  test.beforeAll(async () => {
    await seedHospitalsAndAmbulances()
  })

  test("update available beds via API and verify", async ({ request }) => {
    const res = await request.patch("http://localhost:8000/hospitals/1", {
      data: { available_beds: 15, available_icu: 2 },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.available_beds).toBe(15)
    expect(body.available_icu).toBe(2)
  })
})
