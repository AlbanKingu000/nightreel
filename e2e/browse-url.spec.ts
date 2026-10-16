import { expect, test } from '@playwright/test'

test('browse filters live in the URL, survive a reload, and work with Back', async ({ page }) => {
  await page.goto('/browse')
  // Wait for the catalog to load before deciding whether the (phone-only) filter drawer needs opening.
  await expect(page.getByRole('heading', { level: 1, name: 'Browse' })).toBeVisible()
  const drawerToggle = page.getByRole('button', { name: /^Filters/ })
  if (await drawerToggle.isVisible()) await drawerToggle.click()

  const filters = page.getByRole('complementary', { name: 'Filters' })
  await filters.getByRole('button', { name: 'Horror', exact: true }).click()
  await expect(page).toHaveURL(/\/browse\?g=horror$/)
  await filters.getByRole('button', { name: '1980s' }).click()
  await expect(page).toHaveURL(/g=horror&y=1980-1989/)

  const summary = page.getByText(/^\d+ of \d+ films$/)
  const before = await summary.textContent()
  const firstTitle = await page.getByRole('article').first().getByRole('heading').textContent()

  await page.reload()
  await expect(summary).toHaveText(before ?? '')
  await expect(page.getByRole('article').first().getByRole('heading')).toHaveText(firstTitle ?? '')

  await page.goBack()
  await expect(page).toHaveURL(/\/browse\?g=horror$/)
})
