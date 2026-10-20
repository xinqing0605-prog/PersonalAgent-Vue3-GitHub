import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useImageViewerStore = defineStore('imageViewer', () => {
  const source = ref('')
  function open(url: string) { source.value = url }
  function close() { source.value = '' }
  return { source, open, close }
})
