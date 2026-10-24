import { test, expect } from '@playwright/test'

test('phone form validates before requesting a code and hides password account links', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#authScreen')).toBeVisible()
  await page.locator('[data-auth-method="password"]').click()
  if (await page.locator('#authConfirmLabel').isVisible()) await page.locator('#authSwitch').click()
  await expect(page.locator('#authSwitch')).toHaveText('没有账户？创建本地账户')
  await page.locator('[data-auth-method="phone"]').click()
  await expect(page.locator('#authSwitch')).toBeHidden()
  await expect(page.locator('#phoneAuthForm')).toBeVisible()
  await page.locator('[data-auth-method="password"]').click()
  await expect(page.locator('#authSwitch')).toBeVisible()
  await page.locator('#authSwitch').click()
  await expect(page.locator('#authSwitch')).toHaveText('已有账户？返回登录')
  await page.locator('[data-auth-method="phone"]').click()
  await expect(page.locator('#authSwitch')).toBeHidden()
  await expect(page.locator('[data-auth-method="phone"]')).toHaveText('手机验证码')
  await expect(page.locator('#phoneSubmit')).toHaveText('验证码登录 / 自动注册')
  const visibleText = await page.locator('#authScreen').innerText()
  for (const removed of ['演示', '没有账户？创建本地账户', '已有账户？返回登录']) expect(visibleText).not.toContain(removed)
  let sendRequests = 0
  let loginRequests = 0
  page.on('request', request => {
    if (request.url().endsWith('/api/auth/sms/send')) sendRequests++
    if (request.url().endsWith('/api/auth/phone/login')) loginRequests++
  })
  for (const phone of ['', '12345678901', '15412345678', '14112345678', '19412345678', '16111234567', '17406123456', '1380013800', '138001380000', '１３８００１３８０００', '1380013800a']) {
    await page.locator('#phoneNumber').fill(phone)
    await page.locator('#sendSmsButton').click()
    await expect(page.locator('#phoneMessage')).toHaveText('请输入正确的手机号')
    await expect(page.locator('#sendSmsButton')).toBeEnabled()
    await expect(page.locator('#phoneNumber')).toHaveAttribute('aria-invalid', 'true')
    await page.locator('#phoneCode').fill('123456')
    await page.locator('#phoneSubmit').click()
    await expect(page.locator('#phoneMessage')).toHaveText('请输入正确的手机号')
  }
  expect(sendRequests).toBe(0)
  expect(loginRequests).toBe(0)
  await page.screenshot({ path: test.info().outputPath('phone-validation.png') })
})

test('missing numbering rules cannot fall back to length-only validation', async ({ page }) => {
  await page.route('**/api/auth/status', async route => {
    const response = await route.fetch()
    const data = await response.json()
    delete data.phone_mobile_pattern
    await route.fulfill({ response, json: data })
  })
  let sendRequests = 0
  page.on('request', request => { if (request.url().endsWith('/api/auth/sms/send')) sendRequests++ })
  await page.goto('/')
  await expect(page.locator('#authScreen')).toBeVisible()
  await page.locator('[data-auth-method="phone"]').click()
  await page.locator('#phoneNumber').fill('18812345678')
  await page.locator('#sendSmsButton').click()
  await expect(page.locator('#phoneMessage')).toContainText('校验规则加载失败')
  expect(sendRequests).toBe(0)
})

test('changing a phone ignores a delayed response for the previous number', async ({ page }) => {
  const status = await (await page.request.get('/api/auth/status')).json()
  test.skip(status.sms_demo !== true, 'Requires an isolated local-code desktop server.')
  let releaseResponse!: () => void
  let responseFetched!: () => void
  const fetched = new Promise<void>(resolve => { responseFetched = resolve })
  const released = new Promise<void>(resolve => { releaseResponse = resolve })
  await page.route('**/api/auth/sms/send', async route => {
    const response = await route.fetch()
    responseFetched()
    await released
    await route.fulfill({ response })
  })
  await page.goto('/')
  await expect(page.locator('#authScreen')).toBeVisible()
  await page.locator('[data-auth-method="phone"]').click()
  await page.locator('#phoneNumber').fill('18812345678')
  await page.locator('#sendSmsButton').click()
  await fetched
  await page.locator('#phoneNumber').fill('15412345678')
  const returned = page.waitForResponse(response => response.url().endsWith('/api/auth/sms/send'))
  releaseResponse()
  await returned
  await expect(page.locator('#phoneMessage')).toHaveText('')
  await expect(page.locator('#phoneCode')).toHaveValue('')
  await expect(page.locator('#sendSmsButton')).toBeEnabled()
  await expect(page.locator('#sendSmsButton')).toHaveText('获取验证码')
  await page.locator('#sendSmsButton').click()
  await expect(page.locator('#phoneMessage')).toHaveText('请输入正确的手机号')
})

test('a valid phone obtains a displayed code and can log in', async ({ page }) => {
  const status = await (await page.request.get('/api/auth/status')).json()
  test.skip(status.sms_demo !== true, 'Requires an isolated local-code desktop server; never send real SMS in tests.')
  await page.goto('/')
  await expect(page.locator('#authScreen')).toBeVisible()
  await page.locator('[data-auth-method="phone"]').click()
  await page.locator('#phoneNumber').fill('+86 155-1234-5678')
  const [response] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/auth/sms/send')),
    page.locator('#sendSmsButton').click(),
  ])
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.phone).toBe('15512345678')
  expect(data.dev_code).toMatch(/^[0-9]{6}$/)
  await expect(page.locator('#phoneMessage')).toContainText(`验证码：${data.dev_code}`)
  await expect(page.locator('#phoneModeHint')).toContainText('不会发送短信')
  await expect(page.locator('#authSwitch')).toBeHidden()
  expect(await page.locator('#authScreen').innerText()).not.toContain('演示')
  await page.screenshot({ path: test.info().outputPath('phone-code-visible.png') })
  await page.locator('#phoneCode').fill(data.dev_code)
  await page.locator('#phoneNumber').fill('13800138000')
  await expect(page.locator('#phoneCode')).toHaveValue('')
  await expect(page.locator('#phoneMessage')).toHaveText('')
  await expect(page.locator('#sendSmsButton')).toBeEnabled()
  await page.locator('#phoneCode').fill(data.dev_code)
  await page.locator('#phoneSubmit').click()
  await expect(page.locator('#phoneMessage')).toContainText('验证码错误')
  await expect(page.locator('#authScreen')).toBeVisible()
  await page.locator('#phoneNumber').fill('15512345678')
  await page.locator('#phoneCode').fill(data.dev_code)
  await page.locator('#phoneSubmit').click()
  await expect(page.locator('#authScreen')).toBeHidden()
  const me = await (await page.request.get('/api/auth/me')).json()
  expect(me.user.phone).toBe('15512345678')
})
