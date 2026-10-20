<script setup lang="ts">
import { useWorkspaceStore } from '../stores/workspace'
import { formatAnswer, stripVisibleSourceMarkers } from '../lib/format'
const workspace = useWorkspaceStore()
const toolLabels: Record<string, string> = { create_task: '创建待办', list_tasks: '查询待办', complete_task: '完成待办', search_notes: '搜索笔记', save_note: '保存笔记', list_local_files: '列出本地文件', read_local_file: '读取本地文件' }
const origins: Record<string, string> = { model: '模型生成', status: '配置状态', local_fallback: '本地降级' }
function fileFor(name: string) { return workspace.current?.files.find(file => file.filename === name) }
// A multi-step request can call the same tool once per item. Show the tool
// category only once; the execution trace below retains every call.
function uniqueTools(tools: string[] = []) {
  return [...new Set(tools.map(tool => tool.trim()).filter(Boolean))]
}
</script>

<template>
  <div class="messages" id="messages" aria-live="polite">
    <article v-for="message in workspace.current?.messages || []" :key="message.id" class="message" :class="{ user: message.role === 'user' }">
      <template v-if="message.role === 'user'">
        <form v-if="workspace.current?.editingMessageId === message.id" class="user-inline-editor" :data-inline-edit-form="message.id">
          <textarea maxlength="1000" aria-label="修改原问题" :value="message.content || ''"></textarea>
          <div class="user-inline-actions"><button data-inline-edit-cancel type="button">取消</button><button type="submit">重新发送</button></div>
        </form>
        <div v-else class="user-message-block">
          <div v-if="message.content" class="message-content" v-html="formatAnswer(message.content)"></div>
          <div v-if="message.attachments?.length" class="message-user-attachments">
            <button v-for="filename in message.attachments" :key="filename" class="message-user-attachment"
              :data-message-file-open="filename" type="button" title="打开附件">
              <img v-if="fileFor(filename)?.kind === 'image'" :src="fileFor(filename)?.url" alt="" />
              <span v-else class="file-icon">▤</span><span>{{ filename }}</span>
            </button>
          </div>
        </div>
      </template>
      <template v-else>
        <span class="avatar">◉</span>
        <div class="message-content">
          <div v-if="message.answerOrigin || message.knowledgeUsed || (message.mode && message.mode !== '模型回答') || message.toolsUsed?.length" class="message-meta">
            <span v-if="message.answerOrigin" class="badge" :class="message.answerOrigin === 'local_fallback' ? 'runtime-fallback' : 'runtime-origin'">{{ origins[message.answerOrigin] || message.answerOrigin }}</span>
            <template v-if="message.answerOrigin && message.provider && message.model">
              <span v-if="message.answerOrigin === 'local_fallback'" class="badge runtime-context muted"
                :title="`原计划调用 ${message.provider} / ${message.model}，但本次调用失败，回答由本地检索生成`">未使用模型</span>
              <span v-else class="badge runtime-model" title="本条回答已由后台解析并确认此模型">{{ message.answerOrigin === 'status' ? '已解析' : '实际模型' }} · {{ message.provider }} / {{ message.model }}</span>
            </template>
            <span v-if="message.knowledgeUsed" class="badge runtime-context">知识库增强</span>
            <span v-if="message.mode && message.mode !== '模型回答'" class="badge">{{ message.mode }}</span>
            <span v-for="tool in uniqueTools(message.toolsUsed)" :key="tool" class="badge tool">{{ toolLabels[tool] || tool }}</span>
          </div>
          <span :class="{ 'streaming-caret': message.streaming }" v-html="formatAnswer(stripVisibleSourceMarkers(message.content || ''))"></span>
          <div v-if="message.images?.length" class="generated-images" aria-label="生成的图片">
            <div v-for="(image, index) in message.images" :key="`${message.id}-${index}`" class="generated-image-card">
              <button class="generated-image-preview" :data-generated-image-preview="message.id" :data-generated-image-index="index" type="button" :aria-label="`放大查看第 ${index + 1} 张生成图片`">
                <img :src="image" alt="生成的图片" loading="lazy" draggable="true" />
              </button>
            </div>
          </div>
          <div v-if="message.warning" class="warning">{{ message.warning }}</div>
          <div v-if="message.sources?.length && !message.streaming" class="message-sources">
            <strong>引用来源</strong>
            <details v-for="(source, i) in message.sources" :key="i" class="message-source">
              <summary>{{ source.filename || source.title || '未命名资料' }}{{ Number.isInteger(source.chunk_index) ? ` · Chunk ${source.chunk_index! + 1}` : '' }}{{ source.score == null ? '' : ` · 相关度 ${source.score}` }}</summary>
              <p>{{ (source.content || '').slice(0, 480) }}{{ (source.content || '').length > 480 ? '…' : '' }}</p>
            </details>
          </div>
          <details v-if="message.trace?.length && !message.streaming" class="trace-details">
            <summary>执行轨迹 · {{ message.trace.length }} 步</summary>
            <div class="trace-list"><div v-for="(item, i) in message.trace" :key="i" class="trace-row">
              <b>{{ item.type === 'tool' ? (toolLabels[item.name || ''] || item.name || '工具') : `模型第 ${item.round || 1} 轮` }}</b>
              <span :class="item.type === 'tool' && item.success === false ? 'trace-fail' : 'trace-ok'">{{ item.type === 'tool' ? (item.success === false ? '失败' : '成功') : '完成' }}</span>
              <small>{{ item.duration_ms ?? '—' }} ms</small>
            </div></div>
          </details>
          <div v-if="message.error || (message.plan && !message.streaming) || (message.content && !message.streaming && !message.error) || (message.interrupted && message.relatedUserMessageId)" class="message-actions">
            <button v-if="message.error" class="message-retry" :data-retry-message="message.question || ''" type="button">↻ 重试这条消息</button>
            <button v-if="message.plan && !message.streaming" class="message-retry" :data-approve-plan="message.question || ''" type="button">✓ 批准计划并执行</button>
            <button v-if="message.content && !message.streaming && !message.error" class="message-action" :data-save-note="message.id" type="button">⌑ 保存为笔记</button>
            <button v-if="message.interrupted && message.relatedUserMessageId" class="message-action" :data-edit-interrupted="message.relatedUserMessageId" type="button">✎ 编辑原问题</button>
          </div>
        </div>
      </template>
    </article>
  </div>
</template>
