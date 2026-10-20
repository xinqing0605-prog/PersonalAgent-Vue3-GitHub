<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'
const workspace = useWorkspaceStore()
</script>

<template>
  <div class="conversation-list" id="conversationList">
    <div v-for="item in workspace.conversations" :key="item.id" class="conversation-row"
      :class="{ archived: item.archived, active: item.id === workspace.current?.id }">
      <button class="conversation" :class="{ active: item.id === workspace.current?.id }"
        :data-conversation="item.id" type="button" @click="workspace.dispatch('selectConversation', item.id)">
        <span class="conversation-title">{{ item.title }}</span>
        <span v-if="item.archived" class="conversation-state">已归档</span>
        <span class="delete-chat" :data-delete="item.id" title="删除对话" role="button" tabindex="0"
          @click.stop="workspace.dispatch('deleteConversation', item.id)"
          @keydown.enter.stop.prevent="workspace.dispatch('deleteConversation', item.id)">×</span>
      </button>
      <div class="conversation-row-actions">
        <button type="button" title="重命名" :data-rename-conversation="item.id"
          @click="workspace.dispatch('renameConversation', item.id)">✎</button>
        <button type="button" :data-pin-conversation="item.id" :title="item.pinned ? '取消置顶' : '置顶聊天'"
          :aria-label="item.pinned ? '取消置顶' : '置顶聊天'" :aria-pressed="item.pinned"
          @click="workspace.dispatch('pinConversation', item.id)">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m16 3 5 5-4 1-4 6v4l-8-8h4l6-4zM9 15l-6 6" /></svg>
        </button>
        <button type="button" :data-archive-conversation="item.id" :title="item.archived ? '移出归档' : '归档聊天'"
          :aria-label="item.archived ? '移出归档' : '归档聊天'" :aria-pressed="item.archived"
          @click="workspace.dispatch('archiveConversation', item.id)">
          <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="5" rx="1" /><path d="M5 8v12h14V8M9 12h6" /></svg>
        </button>
      </div>
    </div>
    <div v-if="!workspace.conversations.length" class="conversation-empty">此视图没有匹配的对话。<br />试试清空搜索，或切换归档视图。</div>
  </div>
</template>
