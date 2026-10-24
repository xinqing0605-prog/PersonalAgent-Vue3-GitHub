<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { copyImage, downloadImage } from '../lib/images'
import { useImageViewerStore } from '../stores/imageViewer'

const viewer = useImageViewerStore()
const selector = '.generated-images img, .document-markdown-preview img, .note-card-body img, .note-rich-editor img, .agent-image-preview .el-image-viewer__img'
const hovered = shallowRef<HTMLImageElement | null>(null)
const savePosition = ref({ left: '0px', top: '0px' })
const saveVisible = ref(false)
const menu = ref<{ source: string; x: number; y: number } | null>(null)
const menuElement = ref<HTMLElement>()
const saving = ref(false)
let anchor: HTMLElement | null = null
let frame = 0
let observer: MutationObserver | undefined
let resizeObserver: ResizeObserver | undefined

function feedback(message: string) { window.dispatchEvent(new CustomEvent('image-feedback', { detail: message })) }
function imageAt(target: EventTarget | null): HTMLImageElement | null {
  if (!(target instanceof Element)) return null
  if (target.matches(selector)) return target as HTMLImageElement
  return target.closest('[data-generated-image-preview]')?.querySelector('img') || null
}
function positionSaveButton() {
  saveVisible.value = false
  const image = hovered.value
  if (!image?.isConnected) { hovered.value = null; return }
  const box = image.getBoundingClientRect()
  const left = box.right - 44, top = box.top + 10
  // Anchor to the actual picture corner, never clamp it to the viewport.
  if (left < 0 || top < 0 || left + 34 > innerWidth || top + 34 > innerHeight || box.width < 54 || box.height < 54) return
  for (let parent = image.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent)
    const bounds = parent.getBoundingClientRect()
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX) && (left < bounds.left || left + 34 > bounds.right)) return
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY) && (top < bounds.top || top + 34 > bounds.bottom)) return
  }
  // A header or modal may cover the corner even when it is within the viewport.
  for (const [x, y] of [[left + 1, top + 1], [left + 33, top + 33]]) {
    const surface = document.elementsFromPoint(x!, y!).find(element => !element.closest('.image-save-button'))
    if (surface !== image) return
  }
  savePosition.value = { left: `${left}px`, top: `${top}px` }
  saveVisible.value = true
}
function schedulePosition() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(positionSaveButton)
}
watch(hovered, image => {
  saveVisible.value = false
  observer?.disconnect(); resizeObserver?.disconnect()
  if (image) {
    positionSaveButton()
    observer?.observe(image, { attributes: true, attributeFilter: ['style', 'src'] })
    resizeObserver?.observe(image)
  }
})
function hover(event: MouseEvent | FocusEvent) {
  if (event.target instanceof Element && event.target.closest('.image-save-button, [data-image-context-menu]')) return
  const image = imageAt(event.target)
  if (image !== hovered.value) hovered.value = image
  else if (image) schedulePosition()
}
function leave(event: MouseEvent) { if (!event.relatedTarget) hovered.value = null }
function closeMenu(restoreFocus = false) {
  menu.value = null
  if (restoreFocus && anchor?.isConnected) anchor.focus({ preventScroll: true })
}
async function contextMenu(event: MouseEvent) {
  const image = imageAt(event.target)
  if (!image) { closeMenu(); return }
  event.preventDefault()
  const source = image.getAttribute('src') || ''
  if (!source) return
  anchor = image.closest<HTMLElement>('[data-generated-image-preview]') || image
  const box = image.getBoundingClientRect()
  const x = event.clientX || box.left + 12
  const y = event.clientY || box.top + 12
  menu.value = { source, x, y }
  await nextTick()
  if (!menu.value || !menuElement.value) return
  menu.value.x = Math.max(8, Math.min(x, innerWidth - menuElement.value.offsetWidth - 8))
  menu.value.y = Math.max(8, Math.min(y, innerHeight - menuElement.value.offsetHeight - 8))
  menuElement.value.querySelector('button')?.focus()
}
function outside(event: PointerEvent) {
  if (!menuElement.value?.contains(event.target as Node)) closeMenu()
}
function dismissOnScroll() { closeMenu(); hovered.value = null }
function keydown(event: KeyboardEvent) {
  if (!menu.value) return
  // Keep the viewer's shortcuts from acting on the menu.
  if (['Escape', 'Tab', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault(); event.stopImmediatePropagation()
    if (event.key === 'Escape' || event.key === 'Tab') closeMenu(true)
  }
}
async function copy() {
  const source = menu.value?.source
  if (!source) return
  // Start on the click so browser clipboard user activation is preserved.
  const action = copyImage(source)
  closeMenu(true)
  try { await action; feedback('图片已复制，可以按 Ctrl + V 粘贴。') }
  catch (error) { feedback(error instanceof Error ? error.message : '复制图片失败，请重试。') }
}
async function save() {
  const source = hovered.value?.getAttribute('src')
  if (!source || saving.value) return
  saving.value = true
  try { if (await downloadImage(source)) feedback('图片已保存。') }
  catch (error) { feedback(error instanceof Error ? error.message : '保存图片失败，请重试。') }
  finally { saving.value = false }
}
watch(() => viewer.source, () => { closeMenu(); hovered.value = null }, { flush: 'sync' })
onMounted(() => {
  observer = new MutationObserver(schedulePosition)
  resizeObserver = new ResizeObserver(schedulePosition)
  document.addEventListener('mousemove', hover)
  document.addEventListener('mouseover', hover)
  document.addEventListener('mouseout', leave)
  document.addEventListener('focusin', hover)
  document.addEventListener('contextmenu', contextMenu)
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('keydown', keydown, true)
  document.addEventListener('scroll', dismissOnScroll, true)
  window.addEventListener('resize', dismissOnScroll)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame); observer?.disconnect(); resizeObserver?.disconnect()
  document.removeEventListener('mousemove', hover)
  document.removeEventListener('mouseover', hover)
  document.removeEventListener('mouseout', leave)
  document.removeEventListener('focusin', hover)
  document.removeEventListener('contextmenu', contextMenu)
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('keydown', keydown, true)
  document.removeEventListener('scroll', dismissOnScroll, true)
  window.removeEventListener('resize', dismissOnScroll)
})
</script>

<template>
  <!-- Keep interactive overlays inside the viewer's focus trap when it is open. -->
  <Teleport v-if="hovered || menu" :to="viewer.source ? '.agent-image-preview .el-image-viewer__wrapper' : 'body'">
    <button v-if="hovered && saveVisible && !menu" class="image-save-button" type="button" aria-label="保存图片" title="保存图片"
      :style="savePosition" :disabled="saving" @click.stop="save" @mousedown.stop>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" /></svg>
    </button>
    <div v-if="menu" ref="menuElement" data-image-context-menu class="image-context-menu" role="menu" aria-label="图片操作"
      :style="{ left: `${menu.x}px`, top: `${menu.y}px` }" @contextmenu.prevent @click.stop @keydown.stop>
      <button type="button" role="menuitem" @click="copy">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></svg>
        复制图片
      </button>
    </div>
  </Teleport>
</template>
