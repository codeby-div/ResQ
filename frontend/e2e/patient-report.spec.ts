import { test, expect } from "@playwright/test"
import { seedHospitalsAndAmbulances } from "./helpers"

test.describe("Patient reports emergency", () => {
  test.beforeAll(async () => {
    await seedHospitalsAndAmbulances()
  })

  test("full flow: report emergency and see confirmation", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: /patient/i }).click()

    await page.getByPlaceholder("Enter name").fill("Test Patient")
    await page.getByPlaceholder("Enter age").fill("30")
    await page.getByPlaceholder("Enter phone number").fill("9876543000")
    await page.getByRole("button", { name: /continue/i }).click()

    await expect(page).toHaveURL("/patient")

    await page.getByPlaceholder("Full name").fill("Emergency Patient")
    await page.getByPlaceholder("Enter age").fill("45")
    await page.getByRole("button", { name: /high/i }).first().click()
    await page.getByPlaceholder("Describe the situation...").fill("Severe chest pain and difficulty breathing")
    await page.getByPlaceholder("10-digit mobile number").fill("9876543000")
    await page.getByPlaceholder("patient@example.com").fill("patient@test.com")

    await page.getByRole("button", { name: /request emergency help/i }).click()
    await expect(page.locator("text=Track Status")).toBeVisible({ timeout: 10000 })
  })
})
