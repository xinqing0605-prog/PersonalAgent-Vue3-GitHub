<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'
const workspace = useWorkspaceStore()
</script>
<template>
  <div id="taskList" class="task-list">
    <div v-if="workspace.tasksStatus" :class="workspace.tasksError ? 'warning' : 'lens-empty'">{{ workspace.tasksStatus }}</div>
    <template v-else>
      <article v-for="task in workspace.tasks" :key="task.id" class="task-card">
        <header><strong>{{ task.title }}</strong><span class="task-badge">{{ task.status === '未完成' ? '待办' : task.status }}</span></header>
        <small>#{{ task.id }} · {{ task.due_date ? task.due_date.slice(0, 10) : '无截止日期' }} · {{ task.priority }}优先级</small>
        <p v-if="task.description">{{ task.description }}</p>
        <footer>
          <button class="secondary-button" type="button" :data-task-edit="task.id">编辑</button>
          <button class="secondary-button" type="button" :data-task-status="task.id">{{ task.status === '已完成' ? '重新待办' : '标记完成' }}</button>
          <button class="secondary-button danger" type="button" :data-task-delete="task.id">删除</button>
        </footer>
      </article>
      <div v-if="!workspace.tasks.length" class="lens-empty">没有匹配任务。可清空搜索和筛选，或点击“＋ 新建任务”。</div>
    </template>
  </div>
</template>
