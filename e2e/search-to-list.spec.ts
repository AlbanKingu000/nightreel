import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test('search for a film, save a ticket, and find it in My tickets after a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText("Tonight's feature")).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.keyboard.press('Control+k')
  const search = page.getByRole('combobox', { name: /search movies/i })
  await search.fill('inception')
  await page.getByRole('option', { name: /Inception/ }).first().click()
  await expect(page).toHaveURL(/\/movie\/inception-2010$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Inception' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.getByRole('button', { name: 'Get a ticket' }).click()
  await expect(page.getByRole('button', { name: 'In your tickets' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'In your tickets' })).toBeVisible()
  await page.goto('/my-list')
  await expect(page.getByRole('tabpanel').getByRole('heading', { name: 'Inception' })).toBeVisible()
})
