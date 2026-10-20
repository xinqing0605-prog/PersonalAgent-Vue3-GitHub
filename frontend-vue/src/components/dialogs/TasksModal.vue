<script setup lang="ts">
import TaskList from '../TaskList.vue'
import TaskDateField from '../TaskDateField.vue'
import TaskChoiceField from '../TaskChoiceField.vue'

const priorities = [
  { value: '低', label: '低' },
  { value: '普通', label: '普通' },
  { value: '高', label: '高' },
]
const statuses = [
  { value: '未完成', label: '待办' },
  { value: '进行中', label: '进行中' },
  { value: '已完成', label: '已完成' },
]
</script>
<template>
<div class="modal-backdrop compact-modal" id="tasksModal" hidden>
        <section class="overlay-panel" role="dialog" aria-modal="true" aria-label="我的任务">
          <header><div><h2>我的任务</h2><p>创建、编辑和搜索当前账户的任务，直接保存，无需调用模型。</p></div><button class="modal-close" id="closeTasks" type="button" aria-label="关闭任务">×</button></header>
          <div class="overlay-panel-body">
            <div class="collection-toolbar"><button id="newTask" class="primary-button" type="button">＋ 新建任务</button><span id="taskCount"></span></div>
            <form class="note-editor task-editor" id="taskEditor" hidden>
              <h3 id="taskEditorHeading">新建任务</h3><input id="taskEditorId" type="hidden" />
              <label>标题<input id="taskTitle" maxlength="200" required placeholder="例如：整理本周项目资料" /></label>
              <div class="task-fields">
                <div class="task-field"><span class="task-field-label">截止日期（可选）</span><TaskDateField /></div>
                <div class="task-field"><span class="task-field-label">优先级</span><TaskChoiceField id="taskPriority" label="优先级" :options="priorities" initial="普通" /></div>
                <div class="task-field"><span class="task-field-label">状态</span><TaskChoiceField id="taskStatus" label="状态" :options="statuses" initial="未完成" /></div>
              </div>
              <label>备注（可选）<textarea id="taskDescription" maxlength="5000" placeholder="补充资料或具体要求"></textarea></label>
              <footer><button id="cancelTaskEdit" class="secondary-button" type="button">取消</button><button id="saveTaskButton" class="primary-button" type="submit">保存任务</button></footer>
            </form>
            <div class="search-bar task-search"><input id="taskSearch" placeholder="搜索任务标题或备注" aria-label="搜索任务" /><select id="taskFilter" aria-label="筛选任务状态"><option>全部</option><option>待办</option><option>进行中</option><option>已完成</option></select><button id="searchTasks" class="primary-button" type="button">搜索</button></div>
            <TaskList />
          </div>
        </section>
      </div>
</template>
