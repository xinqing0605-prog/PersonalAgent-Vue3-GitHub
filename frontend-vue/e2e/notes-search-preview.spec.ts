import { test, expect } from '@playwright/test'

test('notes search stays stable without flicker, scrolls independently, and imported images render', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  let noteRequests = 0
  page.on('request', request => { if (request.url().includes('/api/notes?')) noteRequests++ })
  await page.goto('/')
  if (!(await page.locator('#authConfirmLabel').isVisible())) await page.locator('#authSwitch').click()
  await page.locator('#authUsername').fill('Notes' + Date.now().toString(36))
  await page.locator('#authPassword').fill('Safe1234!')
  await page.locator('#authConfirmPassword').fill('Safe1234!')
  await page.locator('#authSubmit').click()
  await expect(page.locator('#authScreen')).toBeHidden()
  const source = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 280
    const context = canvas.getContext('2d')!; context.fillStyle = '#128575'; context.fillRect(0, 0, 400, 280)
    context.fillStyle = '#fff'; context.fillRect(80, 60, 240, 160)
    return canvas.toDataURL('image/png')
  })
  const imageResponse = await page.request.post('/api/images/import', { data: { source } })
  expect(imageResponse.ok()).toBeTruthy()
  const imageUrl = (await imageResponse.json()).url
  const bodies = [
    { title: '插图笔记', content: `图片独有正文\n![示例图片](${imageUrl})\n<script>window.previewUnsafe = true</script>\n![不安全](javascript:alert(1))` },
    { title: 'Alpha 说明', content: '正文检索专用关键词' },
    { title: '旧结果笔记', content: '并发请求测试' },
    ...Array.from({ length: 30 }, (_, i) => ({ title: `普通笔记 ${i}`, content: '常规内容 ' + i }))
  ]
  for (const body of bodies) expect((await page.request.post('/api/notes', { data: body })).ok()).toBeTruthy()
  await page.locator('#openNotes').click()
  await expect(page.locator('.note-card')).toHaveCount(33)
  const scroll = page.locator('#notesModal .notes-scroll')
  const controls = page.locator('#notesModal .notes-controls')
  const header = page.locator('#notesModal .overlay-panel > header')
  const headerY = (await header.boundingBox())!.y
  const controlsY = (await controls.boundingBox())!.y
  await scroll.evaluate(el => { el.scrollTop = el.scrollHeight })
  expect(await scroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  expect((await header.boundingBox())!.y).toBe(headerY)
  expect((await controls.boundingBox())!.y).toBe(controlsY)
  expect(await page.locator('#notesModal .overlay-panel-body').evaluate(el => el.scrollTop)).toBe(0)
  await page.screenshot({ path: test.info().outputPath('notes-fixed-controls.png') })
  const search = page.locator('#notesSearchInput')
  // Whitespace-only edits must neither request data nor detach/recreate existing cards.
  await page.evaluate(() => {
    const list = document.querySelector('#notesList')!
    const state = (window as any).noteStability = { removedCards: 0, loadingShown: false }
    state.observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.removedNodes) {
        if (node instanceof Element && (node.matches('.note-card') || node.querySelector('.note-card'))) state.removedCards++
      }
      if (list.textContent?.includes('正在读取')) state.loadingShown = true
    })
    state.observer.observe(list, { childList: true, subtree: true })
  })
  const originalCard = await page.locator('.note-card').last().elementHandle()
  await originalCard!.evaluate(el => { (el as HTMLDetailsElement).open = true })
  await scroll.evaluate(el => { el.scrollTop = el.scrollHeight })
  const initialScroll = await scroll.evaluate(el => el.scrollTop)
  const beforeSpaces = noteRequests
  for (let i = 0; i < 3; i++) { await search.press('Space'); await page.waitForTimeout(260) }
  for (let i = 0; i < 3; i++) { await search.press('Backspace'); await page.waitForTimeout(260) }
  expect(noteRequests).toBe(beforeSpaces)
  expect(await originalCard!.evaluate(el => el.isConnected && (el as HTMLDetailsElement).open)).toBe(true)
  expect(await scroll.evaluate(el => el.scrollTop)).toBe(initialScroll)
  expect(await page.evaluate(() => (window as any).noteStability.removedCards)).toBe(0)
  // Keep all current cards visible while a real search is in flight.
  let releaseSearch!: () => void
  let searchStarted!: () => void
  const slowSearch = new Promise<void>(resolve => { searchStarted = resolve })
  const holdSearch = new Promise<void>(resolve => { releaseSearch = resolve })
  await page.route('**/api/notes?*', async route => {
    const response = await route.fetch(); searchStarted(); await holdSearch; await route.fulfill({ response })
  })
  await search.fill('Alpha'); await slowSearch
  await expect(page.locator('.note-card')).toHaveCount(33)
  expect(await originalCard!.evaluate(el => el.isConnected)).toBe(true)
  expect(await scroll.evaluate(el => el.scrollTop)).toBe(initialScroll)
  expect(await page.evaluate(() => (window as any).noteStability.removedCards)).toBe(0)
  releaseSearch()
  await expect(page.locator('.note-summary-title')).toHaveText(['Alpha 说明'])
  await page.unroute('**/api/notes?*')
  const alphaCard = await page.locator('.note-card').elementHandle()
  await page.locator('.note-card summary').click()
  const beforeEquivalent = noteRequests
  await search.fill('  ALPHA   '); await page.waitForTimeout(300)
  expect(noteRequests).toBe(beforeEquivalent)
  expect(await alphaCard!.evaluate(el => el.isConnected && (el as HTMLDetailsElement).open)).toBe(true)
  // Explicit search still refreshes even if the query/result has not changed.
  let refreshed = page.waitForResponse(response => response.url().includes('/api/notes?'))
  await page.locator('#runNotesSearch').click(); await refreshed; await page.waitForTimeout(100)
  expect(noteRequests).toBe(beforeEquivalent + 1)
  expect(await alphaCard!.evaluate(el => el.isConnected && (el as HTMLDetailsElement).open)).toBe(true)
  refreshed = page.waitForResponse(response => response.url().includes('/api/notes?'))
  await search.fill('正文检索专用'); await refreshed; await page.waitForTimeout(100)
  await expect(page.locator('.note-summary-title')).toHaveText(['Alpha 说明'])
  expect(await alphaCard!.evaluate(el => el.isConnected && (el as HTMLDetailsElement).open)).toBe(true)
  // A failed refresh must retain the last results; Enter retries successfully.
  await page.route('**/api/notes?*', route => route.fulfill({ status: 503, json: { detail: '读取暂时失败，请重试' } }))
  await search.press('Enter')
  await expect(page.locator('#notesList .warning')).toContainText('读取暂时失败')
  expect(await alphaCard!.evaluate(el => el.isConnected && (el as HTMLDetailsElement).open)).toBe(true)
  await page.unroute('**/api/notes?*')
  await search.press('Enter')
  await expect(page.locator('#notesList .warning')).toHaveCount(0)
  expect(await alphaCard!.evaluate(el => el.isConnected && (el as HTMLDetailsElement).open)).toBe(true)
  expect(await page.evaluate(() => (window as any).noteStability.loadingShown)).toBe(false)
  await page.evaluate(() => (window as any).noteStability.observer.disconnect())
  await search.fill('不存在的词')
  await expect(page.locator('.note-card')).toHaveCount(0)
  await expect(page.locator('#notesList')).toContainText('当前没有匹配')
  await search.fill('')
  await expect(page.locator('.note-card')).toHaveCount(33)
  await search.fill('图片独有'); await search.press('Enter')
  await expect(page.locator('.note-summary-title')).toHaveText(['插图笔记'])
  await search.fill('Alpha'); await page.locator('#runNotesSearch').click()
  await expect(page.locator('.note-summary-title')).toHaveText(['Alpha 说明'])
  // Composition must not submit half-entered Chinese text.
  const beforeComposition = noteRequests
  await search.dispatchEvent('compositionstart')
  await search.fill('插图')
  await search.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  await page.waitForTimeout(300)
  expect(noteRequests).toBe(beforeComposition)
  await search.dispatchEvent('compositionend')
  await expect(page.locator('.note-summary-title')).toHaveText(['插图笔记'])
  // Older, slower responses must never replace results for a newer query.
  let releaseOld!: () => void
  let oldStarted!: () => void
  let oldFinished!: () => void
  const started = new Promise<void>(resolve => { oldStarted = resolve })
  const finished = new Promise<void>(resolve => { oldFinished = resolve })
  const hold = new Promise<void>(resolve => { releaseOld = resolve })
  await page.route('**/api/notes?*', async route => {
    if (new URL(route.request().url()).searchParams.get('query') === '旧结果') {
      const response = await route.fetch(); oldStarted(); await hold
      await route.fulfill({ response }); oldFinished()
    } else await route.continue()
  })
  await search.fill('旧结果'); await started
  await search.fill('Alpha'); await expect(page.locator('.note-summary-title')).toHaveText(['Alpha 说明'])
  releaseOld(); await finished; await page.waitForTimeout(100)
  await expect(page.locator('.note-summary-title')).toHaveText(['Alpha 说明'])
  await page.unroute('**/api/notes?*')
  // Reopening resets the input; repeating the previous query must still search.
  await page.locator('#closeNotes').click(); await page.locator('#openNotes').click()
  await expect(page.locator('.note-card')).toHaveCount(33)
  await search.fill('Alpha')
  await expect(page.locator('.note-summary-title')).toHaveText(['Alpha 说明'])
  await search.fill('')
  await expect(page.locator('.note-card')).toHaveCount(33)
  await page.locator('#newNote').click()
  await expect(page.locator('#noteEditorTitle')).toBeInViewport()
  await expect(controls).toBeInViewport()
  await page.locator('#cancelNoteEdit').click()
  await page.locator('#closeNotes').click()

  const baseResponse = await page.request.post('/api/knowledge-bases', { data: { name: '图片笔记资料库' } })
  expect(baseResponse.ok()).toBeTruthy()
  const base = await baseResponse.json()
  await page.locator('#knowledgeButton').click()
  await page.locator('#knowledgeContent [data-source-action="note"]:visible').click()
  await expect(page.locator('[data-import-note]')).toHaveCount(33)
  const importSearch = page.locator('#knowledgeNoteSearch')
  const importSearchY = (await importSearch.boundingBox())!.y
  await page.locator('#knowledgeNoteChoices').evaluate(el => { el.scrollTop = el.scrollHeight })
  expect(await page.locator('#knowledgeNoteChoices').evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  expect((await importSearch.boundingBox())!.y).toBe(importSearchY)
  await expect(page.locator('#submitKnowledgeNoteImport')).toBeInViewport()
  const importCard = await page.locator('[data-import-note]').last().elementHandle()
  const importScroll = await page.locator('#knowledgeNoteChoices').evaluate(el => el.scrollTop)
  await importSearch.fill('   '); await page.waitForTimeout(300)
  await importSearch.fill(''); await page.waitForTimeout(300)
  expect(await importCard!.evaluate(el => el.isConnected)).toBe(true)
  expect(await page.locator('#knowledgeNoteChoices').evaluate(el => el.scrollTop)).toBe(importScroll)
  await importSearch.fill('Alpha')
  await expect(page.locator('#knowledgeNoteChoices strong')).toHaveText(['Alpha 说明'])
  await page.locator('#cancelKnowledgeNoteImport').click()
  await page.locator('#knowledgeContent [data-source-action="note"]:visible').click()
  await expect(page.locator('[data-import-note]')).toHaveCount(33)
  await importSearch.fill('Alpha')
  await expect(page.locator('#knowledgeNoteChoices strong')).toHaveText(['Alpha 说明'])
  await importSearch.fill('图片独有')
  await expect(page.locator('#knowledgeNoteChoices strong')).toHaveText(['插图笔记'])
  await page.locator('[data-import-note]').check()
  await importSearch.fill('Alpha'); await importSearch.press('Enter')
  await expect(page.locator('#knowledgeNoteChoices strong')).toHaveText(['Alpha 说明'])
  await page.locator('[data-import-note]').check()
  await expect(page.locator('#knowledgeNoteSelectionCount')).toHaveText('已选 2 篇')
  await importSearch.fill('不存在'); await page.locator('#runKnowledgeNoteSearch').click()
  await expect(page.locator('#knowledgeNoteChoices')).toContainText('没有匹配')
  await expect(page.locator('#submitKnowledgeNoteImport')).toBeEnabled()
  await importSearch.fill('')
  await expect(page.locator('[data-import-note]')).toHaveCount(33)
  await expect(page.locator('[data-import-note]:checked')).toHaveCount(2)
  await page.screenshot({ path: test.info().outputPath('import-live-search-selection.png') })
  await importSearch.fill('Alpha')
  await expect(page.locator('#knowledgeNoteChoices strong')).toHaveText(['Alpha 说明'])
  await page.locator('#submitKnowledgeNoteImport').click()
  await expect(page.locator('#knowledgeNoteImport')).toBeHidden()
  await expect(page.locator('.document-table tbody tr')).toHaveCount(2)
  const imageRow = page.locator('.document-table tbody tr').filter({ hasText: '插图笔记.md' })
  await imageRow.locator('[data-document-menu]').click()
  await imageRow.locator('[data-document-action="source"]').click()
  const preview = page.locator('.document-markdown-preview')
  await expect(preview.locator('img')).toHaveJSProperty('naturalWidth', 400)
  await expect(preview.locator('img')).toHaveAttribute('src', imageUrl)
  await expect(preview.locator('script')).toHaveCount(0)
  expect(await page.evaluate(() => (window as any).previewUnsafe)).toBeUndefined()
  await page.screenshot({ path: test.info().outputPath('knowledge-image-preview.png') })
  await preview.locator('img').click()
  const viewer = page.getByRole('dialog', { name: '图片预览', exact: true })
  await expect(viewer).toBeVisible()
  await expect(viewer.locator('img')).toHaveJSProperty('naturalWidth', 400)
  await page.keyboard.press('Escape'); await expect(viewer).toBeHidden()
  await expect(page.locator('#documentInspectModal')).toBeVisible()
  await page.locator('#closeDocumentInspect').click()
  // Existing imported Markdown remains renderable after reloading the app.
  await page.reload(); await page.locator('#knowledgeButton').click()
  const reopened = page.locator('.document-table tbody tr').filter({ hasText: '插图笔记.md' })
  await reopened.locator('[data-document-menu]').click()
  await reopened.locator('[data-document-action="source"]').click()
  await expect(page.locator('.document-markdown-preview img')).toHaveJSProperty('naturalWidth', 400)
  expect((await (await page.request.get(`/api/knowledge-bases/${base.id}/documents`)).json()).documents).toHaveLength(2)
  expect(errors).toEqual([])
})
