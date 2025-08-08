import { test, expect } from '@playwright/test'

test('login page: skip login navigates to accessibility onboarding', async ({ page }) => {
  await page.goto('/#/login')

  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Do this later' })).toBeVisible()

  await page.getByRole('button', { name: 'Do this later' }).click()

  await expect(page.getByRole('heading', { name: 'Enable Accessibility' })).toBeVisible()
})

