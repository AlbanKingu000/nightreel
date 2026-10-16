import { expect, test } from '@playwright/test'

const toMinutes = (text: string): number => {
  const hours = /(\d+)h/.exec(text)?.[1] ?? '0'
  const minutes = /(\d+)m/.exec(text)?.[1] ?? '0'
  return Number(hours) * 60 + Number(minutes)
}

test('spin with a mood and length, rate and review the pick, then export a backup', async ({ page }) => {
  await page.goto('/spin?mood=laugh')
  await page.getByLabel('Length').selectOption({ label: 'Under 2 hours' })
  await page.getByRole('button', { name: /Spin the reel/ }).click()
  await expect(page.getByText("Tonight you're watching")).toBeVisible({ timeout: 5000 })

  await page.getByRole('link', { name: 'See details' }).click()
  await expect(page.getByRole('list', { name: 'Genres' }).getByRole('link', { name: 'Comedy' })).toBeVisible()
  const kicker = (await page.locator('main .kicker').first().textContent()) ?? ''
  expect(toMinutes(kicker)).toBeLessThanOrEqual(120)

  // Right half of the fourth star = 4 stars (the left half would be 3.5).
  const fourth = page.getByTestId('star-4')
  const box = await fourth.boundingBox()
  await fourth.click({ position: { x: (box?.width ?? 32) * 0.8, y: (box?.height ?? 32) / 2 } })
  await page.getByLabel(/Your review of/).fill('Great pick for tonight')
  await page.getByRole('button', { name: 'Save review' }).click()
  await expect(page.getByText('Great pick for tonight')).toBeVisible()

  await page.goto('/my-list?tab=rated')
  await expect(page.getByText('Great pick for tonight')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export backup/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^nightreel-backup-\d{4}-\d{2}-\d{2}\.json$/)
  // The backup travels inside its data: URL, so read it from there rather than from the saved file.
  const url = download.url()
  const backup = JSON.parse(decodeURIComponent(url.slice(url.indexOf(',') + 1)))
  expect(backup.format).toBe('nightreel-user-data')
  const reviewed = Object.values(backup.data.entries) as Array<{ rating?: number; review?: { text: string } }>
  expect(reviewed).toContainEqual(expect.objectContaining({ rating: 4, review: expect.objectContaining({ text: 'Great pick for tonight' }) }))
})
