import { test, expect } from '@playwright/test'

test('home page: renders key components', async ({ page }) => {
  // Mark onboarding as completed to avoid redirects
  await page.addInitScript(() => {
    localStorage.setItem('onboarding_completed', 'true')
  })
  await page.goto('/#/')

  // Heading should render
  await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible()

  // Basic layout renders (TopNav and Sidebar landmarks)
  const linkCount = await page.getByRole('link').filter({ has: page.locator('svg') }).count()
  expect(linkCount).toBeGreaterThan(0)
  await expect(page.getByRole('button', { name: /Start Focus/i })).toBeVisible()
})

