import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeId = 'mint' | 'ocean' | 'violet' | 'apricot' | 'custom'
export interface Theme {
  theme_id: ThemeId
  custom_background: string
  custom_background_name: string
  overlay: number
  updated_at?: string
}
export interface Favorite extends Omit<Theme, 'custom_background'> { id: string; name: string }
export const themeNames: Record<ThemeId, string> = { mint: '默认薄荷', ocean: '海盐蓝', violet: '暮光紫', apricot: '暖杏', custom: '自定义图片' }
const defaults = (): Theme => ({ theme_id: 'mint', custom_background: '', custom_background_name: '', overlay: .62 })
const normalize = (value: Partial<Theme> = {}): Theme => ({
  ...defaults(), ...value,
  theme_id: value.theme_id && value.theme_id in themeNames ? value.theme_id : 'mint',
  custom_background: value.theme_id === 'custom' ? value.custom_background || '' : '',
  custom_background_name: value.theme_id === 'custom' ? value.custom_background_name || '' : '',
  overlay: Number.isFinite(value.overlay) ? Math.min(1, Math.max(0, Number(value.overlay))) : .62,
})

function apply(value: Theme) {
  const theme = normalize(value)
  const custom = theme.theme_id === 'custom' && Boolean(theme.custom_background)
  document.body.dataset.theme = custom ? 'custom' : theme.theme_id === 'custom' ? 'mint' : theme.theme_id
  document.body.classList.toggle('theme-contrast-boost', custom && theme.overlay <= .42)
  for (const name of ['--theme-overlay', '--theme-surface-alpha']) document.documentElement.style.setProperty(name, String(theme.overlay))
  document.documentElement.style.setProperty('--theme-background-wash', '0')
  document.documentElement.style.setProperty('--theme-image', custom ? `url("${theme.custom_background.replace(/"/g, '%22')}")` : 'none')
}

export const useThemeStore = defineStore('theme', () => {
  const visible = ref(false)
  const tab = ref<'settings' | 'favorites'>('settings')
  const saved = ref<Theme>(defaults())
  const draft = ref<Theme>(defaults())
  const favorites = ref<Favorite[]>([])
  const message = ref('')
  const error = ref(false)
  const busy = ref(false)
  const favoriteChoice = ref<ThemeId | null>(null)
  const favoriteName = ref('')
  const favoriteError = ref('')
  let session = 0
  let revision = 0
  let queue: Promise<unknown> = Promise.resolve()
  const describe = (failure: unknown) => failure instanceof Error ? failure.message : '主题操作失败。'

  async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(url, { method, cache: 'no-store', ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) })
    const data = await response.json()
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : '主题操作失败。')
    return data as T
  }
  function reset() {
    session++; revision++
    visible.value = false; favoriteChoice.value = null; busy.value = false
    saved.value = defaults(); draft.value = defaults(); favorites.value = []
    message.value = ''; apply(saved.value)
  }
  async function load() {
    const activeSession = session, activeRevision = revision
    try {
      const data = await request<{ theme: Theme; favorites: Favorite[] }>('/api/theme')
      if (activeSession !== session || activeRevision !== revision) return
      saved.value = normalize(data.theme)
      favorites.value = data.favorites || []
      if (!visible.value) apply(saved.value)
    } catch { /* The default theme remains usable if the service is unavailable. */ }
  }
  function open() {
    revision++; draft.value = normalize(saved.value); tab.value = 'settings'
    favoriteChoice.value = null; message.value = ''; error.value = false; visible.value = true
    apply(draft.value)
  }
  function close() { revision++; visible.value = false; favoriteChoice.value = null; draft.value = normalize(saved.value); apply(saved.value) }
  function preview(value: Theme) { revision++; draft.value = normalize(value); apply(draft.value) }
  function choose(id: ThemeId) {
    if (id === 'custom') return
    preview({ ...draft.value, theme_id: id, custom_background: '', custom_background_name: '' })
    message.value = '已选择内置主题，保存后生效。'; error.value = false
  }
  function opacity(value: number) { preview({ ...draft.value, overlay: value / 100 }) }
  function removeImage() { choose(draft.value.theme_id === 'custom' ? 'mint' : draft.value.theme_id) }
  async function selectImage(file?: File) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !file.size || file.size > 5_000_000) {
      message.value = '请选择不超过 5 MB 的 PNG、JPG 或 WebP 图片。'; error.value = true; return
    }
    const activeRevision = ++revision, activeSession = session
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('背景图片读取失败，请重新选择。'))
        reader.readAsDataURL(file)
      })
      if (activeRevision !== revision || activeSession !== session || !visible.value) return
      preview({ ...draft.value, theme_id: 'custom', custom_background: image, custom_background_name: file.name.slice(0, 120) })
      message.value = ''; error.value = false
    } catch (failure) { if (activeSession === session) { message.value = describe(failure); error.value = true } }
  }
  // Serialize writes so a slow favorite activation cannot overwrite a later save.
  function persist(url: string, method: string, body?: unknown) {
    const activeSession = session, activeRevision = ++revision
    busy.value = true; error.value = false
    const operation = queue.catch(() => {}).then(async () => {
      if (activeSession !== session) return
      const data = await request<{ theme: Theme }>(url, method, body)
      if (activeSession !== session) return
      saved.value = normalize(data.theme)
      if (!visible.value) apply(saved.value)
      else if (activeRevision === revision) {
        draft.value = normalize(saved.value); apply(draft.value)
        message.value = method === 'PUT' ? '主题已保存。' : '已切换到收藏主题。'
      }
    }).catch(failure => {
      if (activeSession === session && activeRevision === revision) { message.value = describe(failure); error.value = true }
    }).finally(() => { if (activeSession === session && activeRevision === revision) busy.value = false })
    queue = operation
    // Editing while a write is pending changes revision; clear busy when the queue drains too.
    void operation.finally(() => { if (queue === operation && activeSession === session) busy.value = false })
    return operation
  }
  function save() { return persist('/api/theme', 'PUT', normalize(draft.value)) }
  function activate(id: string) { return persist(`/api/theme/favorites/${encodeURIComponent(id)}/activate`, 'POST') }
  function matches(favorite: Favorite, value: Theme = draft.value) {
    return favorite.theme_id === value.theme_id && (value.theme_id !== 'custom' || favorite.custom_background_name === value.custom_background_name)
  }
  function favoriteFor(id: ThemeId) { return favorites.value.find(item => matches(item, { ...draft.value, theme_id: id })) }
  async function removeFavorite(id: string) {
    const activeSession = session
    try {
      await request(`/api/theme/favorites/${encodeURIComponent(id)}`, 'DELETE')
      if (activeSession !== session) return
      favorites.value = favorites.value.filter(item => item.id !== id)
      message.value = '主题收藏已删除。'; error.value = false
    } catch (failure) { if (activeSession === session) { message.value = describe(failure); error.value = true } }
  }
  function suggestedName(id: ThemeId) {
    const filename = draft.value.custom_background_name.replace(/\.[^.]+$/, '')
    const base = id === 'custom' ? (!filename || /^[a-f0-9_-]{16,}$/i.test(filename) ? '自定义主题' : filename.slice(0, 32)) : themeNames[id]
    let name = base, index = 2
    while (favorites.value.some(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) name = `${base} ${index++}`
    return name
  }
  function toggleFavorite(id: ThemeId) {
    const existing = favoriteFor(id)
    if (existing) { void removeFavorite(existing.id); return }
    if (id === 'custom' && !draft.value.custom_background) return
    favoriteChoice.value = id; favoriteName.value = suggestedName(id); favoriteError.value = ''
  }
  async function confirmFavorite() {
    const choice = favoriteChoice.value
    if (!choice || busy.value) return
    const activeSession = session
    busy.value = true
    try {
      const data = await request<{ favorite: Favorite }>('/api/theme/favorites', 'POST', {
        name: favoriteName.value.trim() || suggestedName(choice), theme: normalize({ ...draft.value, theme_id: choice }),
      })
      if (activeSession !== session) return
      favorites.value.push(data.favorite); favoriteChoice.value = null; message.value = '主题已加入收藏。'; error.value = false
    } catch (failure) { if (activeSession === session) favoriteError.value = describe(failure) }
    finally { if (activeSession === session) busy.value = false }
  }
  return { visible, tab, saved, draft, favorites, message, error, busy, favoriteChoice, favoriteName, favoriteError,
    reset, load, open, close, choose, opacity, removeImage, selectImage, save, activate, matches, favoriteFor, removeFavorite, toggleFavorite, confirmFavorite }
})
