<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'
import { renderNoteContent } from '../lib/format'
const workspace = useWorkspaceStore()
</script>

<template>
  <div id="notesList" class="search-result-list">
    <div v-if="workspace.notesStatus" :class="workspace.notesError ? 'warning' : 'lens-empty'">{{ workspace.notesStatus }}</div>
    <template v-if="workspace.notesLoaded">
      <details v-for="note in workspace.notes" :key="note.id" class="note-card">
        <summary><span class="note-summary-title">{{ note.title || '未命名笔记' }}</span>
          <button class="note-summary-delete" :data-note-delete="note.id" type="button" aria-label="删除笔记"
            @click.stop.prevent="workspace.dispatch('deleteNote', note.id)">删除</button></summary>
        <div class="note-card-body" v-html="renderNoteContent(note)"></div>
        <div class="note-card-actions">
          <button :data-note-edit="note.id" type="button" @click="workspace.dispatch('editNote', note.id)">修改</button>
          <button class="danger" :data-note-delete="note.id" type="button" @click="workspace.dispatch('deleteNote', note.id)">删除</button>
        </div>
      </details>
      <div v-if="!workspace.notes.length" class="lens-empty">当前没有匹配的笔记。点击上方“＋ 新建笔记”，或在助手回答下点击“保存为笔记”。</div>
    </template>
  </div>
</template>

