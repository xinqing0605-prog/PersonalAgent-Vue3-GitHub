import { test, expect } from '@playwright/test'

test('many providers and models keep selectors bounded and preserve settings scroll', async ({ page }) => {
  await page.goto('/')
  if (!(await page.locator('#authConfirmLabel').isVisible())) await page.locator('#authSwitch').click()
  await page.locator('#authUsername').fill(`models${Date.now().toString(36)}`)
  await page.locator('#authPassword').fill('Vtest!49aQz')
  await page.locator('#authConfirmPassword').fill('Vtest!49aQz')
  await page.locator('#authSubmit').click()
  await expect(page.locator('#authScreen')).toBeHidden()

  const create = async (payload: Record<string, unknown>) => {
    const result = await page.evaluate(async (body) => {
      const response = await fetch('/api/model-services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      return { ok: response.ok, body: await response.json() }
    }, payload)
    expect(result.ok, JSON.stringify(result.body)).toBe(true)
  }
  for (let index = 0; index < 12; index++) {
    await create({ name: `Volume Provider ${index}`, provider_only: true, service_type: '大模型' })
  }
  for (let index = 0; index < 9; index++) {
    await create({ name: 'Volume Provider 11', model: `volume-model-${index}`, service_type: '大模型', base_url: 'https://example.test/v1' })
  }

  await page.reload()
  await expect(page.locator('#authScreen')).toBeHidden()
  await page.locator('#modelStatus').click()
  await expect(page.locator('#modelPicker')).toBeVisible()
  const picker = await page.locator('#modelPicker').evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    listHeight: element.querySelector('#chatModelList')!.getBoundingClientRect().height,
    listScrollHeight: element.querySelector('#chatModelList')!.scrollHeight,
  }))
  expect(picker.height).toBeLessThanOrEqual(522)
  expect(picker.listHeight).toBeLessThanOrEqual(392)
  expect(picker.listScrollHeight).toBeGreaterThan(picker.listHeight)

  await page.locator('#manageChatModels').click()
  const directory = page.locator('#modelServiceDirectory')
  await directory.locator('.model-service-item', { hasText: 'Volume Provider 11' }).click()
  await expect(page.locator('#modelServiceHeading')).toHaveText('Volume Provider 11')
  await page.locator('[data-provider-add-model]').click()
  const createTrigger = page.locator('#modelServiceCreateModal .bounded-provider-trigger')
  await createTrigger.click()
  const createOptions = page.locator('#modelServiceProviderOptions')
  await expect(createOptions).toBeVisible()
  const optionBounds = await createOptions.evaluate((element) => ({ height: element.getBoundingClientRect().height, scrollHeight: element.scrollHeight }))
  expect(optionBounds.height).toBeLessThanOrEqual(226)
  expect(optionBounds.scrollHeight).toBeGreaterThan(optionBounds.height)
  await createOptions.getByRole('option', { name: 'Volume Provider 10' }).click()
  await expect(createTrigger.locator('.bounded-provider-value')).toHaveText('Volume Provider 10')
  await page.locator('#cancelModelServiceCreate').click()

  const modelList = page.locator('.provider-model-list')
  await expect(modelList.locator('.service-card')).toHaveCount(9)
  await modelList.evaluate((element) => { element.scrollTop = element.scrollHeight })
  const before = await modelList.evaluate((element) => element.scrollTop)
  expect(before).toBeGreaterThan(0)
  await modelList.locator('.service-card').last().locator('[data-model-edit]').click()
  const editTrigger = page.locator('#modelServiceEditModal .bounded-provider-trigger')
  await editTrigger.click()
  await expect(page.locator('#modelServiceEditProviderOptions')).toBeVisible()
  expect(await page.locator('#modelServiceEditProviderOptions').evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(226)
  await editTrigger.click()
  await page.locator('#modelServiceEditDescription').fill('保存后保留滚动位置')
  await page.locator('#submitModelServiceEdit').click()
  await expect(page.locator('#modelServiceEditModal')).toBeHidden()
  await expect(modelList.locator('.service-card').last()).toContainText('保存后保留滚动位置')
  const after = await modelList.evaluate((element) => element.scrollTop)
  expect(after).toBeGreaterThanOrEqual(before - 2)
  await expect(page.locator('#modelServiceHeading')).toHaveText('Volume Provider 11')
})
