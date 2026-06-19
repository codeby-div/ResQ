import { test, expect } from "@playwright/test"
import { registerAdmin, createEmergency } from "./helpers"

test.describe("Admin logs in and sees emergencies", () => {
  test.beforeAll(async () => {
    await registerAdmin()
    await createEmergency("Admin View Test")
  })

  test("can log in and see emergencies in dashboard", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /admin/i }).click()

    await page.getByPlaceholder("Enter username").fill("admin")
    await page.getByPlaceholder("Enter password").fill("admin123")
    await page.getByRole("button", { name: /enter admin/i }).click()

    await expect(page).toHaveURL("/admin")
    await expect(page.locator("text=Admin View Test")).toBeVisible({ timeout: 10000 })
  })
})
