<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'
const workspace = useWorkspaceStore()
</script>

<template>
  <div class="attachment-list" id="attachmentList">
    <article v-for="file in workspace.attachments" :key="file.filename" class="attachment-card">
      <button class="attachment-open" :data-file-open="file.filename" type="button" :title="`打开 ${file.filename}`"
        @click="workspace.dispatch('openFile', file.filename)">
        <img v-if="file.kind === 'image'" :src="file.url" :alt="file.filename" />
        <span v-else class="file-icon">▤</span><span class="file-name">{{ file.filename }}</span>
      </button>
      <input class="file-check" :data-file-check="file.filename" type="checkbox" :checked="workspace.selectedFiles.includes(file.filename)"
        :aria-label="`选择 ${file.filename}`" @change="workspace.dispatch('selectFile', file.filename, ($event.target as HTMLInputElement).checked)" />
      <button class="file-delete" :data-file-delete="file.filename" type="button" :aria-label="`移除附件 ${file.filename}`" title="移除附件"
        @click="workspace.dispatch('deleteFile', file.filename)">×</button>
    </article>
  </div>
</template>
