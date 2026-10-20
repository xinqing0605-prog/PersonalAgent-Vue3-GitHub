<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { ElImageViewer } from 'element-plus/es/components/image-viewer/index'
import 'element-plus/es/components/image-viewer/style/css'
import { useImageViewerStore } from '../stores/imageViewer'

const viewer = useImageViewerStore()
function onKeydown(event: KeyboardEvent) {
  // Closing the picture must not also close the note dialog behind it.
  if (!viewer.source || event.key !== 'Escape' || document.querySelector('[data-image-context-menu]')) return
  event.preventDefault(); event.stopImmediatePropagation(); viewer.close()
}
onMounted(() => document.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => { document.removeEventListener('keydown', onKeydown, true); viewer.close() })
</script>

<template>
  <Teleport to="body">
    <div v-if="viewer.source" class="agent-image-preview" role="dialog" aria-modal="true" aria-label="图片预览">
      <ElImageViewer :key="viewer.source" :url-list="[viewer.source]" :z-index="5000"
        :zoom-rate="1.15" :min-scale="0.15" :max-scale="6" :close-on-press-escape="false"
        hide-on-click-modal @close="viewer.close()">
        <template #toolbar><span /></template>
        <button class="image-preview-close" type="button" title="关闭预览（Esc）" aria-label="关闭图片预览" @click="viewer.close()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <template #viewer-error><p class="image-preview-error">图片无法加载，请关闭预览后重试。</p></template>
      </ElImageViewer>
    </div>
  </Teleport>
</template>
