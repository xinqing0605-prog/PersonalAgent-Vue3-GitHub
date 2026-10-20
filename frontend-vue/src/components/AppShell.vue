<script setup lang="ts">
import ConversationList from './ConversationList.vue'
import MessageList from './MessageList.vue'
import AttachmentList from './AttachmentList.vue'
</script>
<template>
  <div class="app-shell" id="appShell">
        <aside class="sidebar" id="sidebar">
          <button class="sidebar-toggle" id="sidebarToggle" type="button" title="折叠对话导航" aria-label="折叠对话导航" aria-expanded="true">‹</button>
          <div class="sidebar-content">
          <div class="brand"><span class="brand-mark">◉</span>个人智能体</div>
          <button class="new-chat" id="newChat" type="button">＋ 新建对话</button>
          <div class="conversation-heading"><span>对话</span><span id="conversationCount">仅本机保存</span></div>
          <div class="conversation-tools"><input class="conversation-search" id="conversationSearch" type="search" placeholder="搜索会话…" autocomplete="off" /><button class="conversation-filter" id="toggleArchived" type="button" title="只显示已归档对话" aria-pressed="false">显示归档</button></div>
          <ConversationList />
          <button class="app-settings-button" id="openTasks" type="button">☑ 我的任务</button>
          <button class="app-settings-button" id="openNotes" type="button">▤ 我的笔记</button>
          <button class="app-settings-button" id="exportState" type="button">⇩ 导出当前对话 JSON</button>
          <button class="app-settings-button" id="importState" type="button">⇧ 导入对话 JSON</button>
          <div class="sidebar-foot">每个对话拥有独立附件。<br />删除对话时会同步删除它的文件。</div>
          </div>
        </aside>
  
        <main class="chat-panel">
          <header class="chat-header">
            <div class="agent-title"><span class="avatar">◉</span><div><strong>个人知识库与事务助手</strong><span>连续对话 · 本地工具</span></div></div>
            <div class="header-actions"><button class="conversation-preferences-button" id="openConversationPreferences" type="button" title="设置当前对话的回答偏好">⚙ 对话偏好</button><button class="lens-button" id="openContextLens" type="button" title="查看当前对话的焦点、资料和下一步建议">✦ 对话概览</button><button class="knowledge-button" id="knowledgeButton" type="button">▤ 知识库</button><button class="model-pill" id="modelStatus" type="button" title="切换大模型" aria-haspopup="dialog" aria-expanded="false">正在检查模型配置…</button><div class="account-menu" id="accountMenu" hidden><button class="account-button" id="accountButton" type="button" aria-haspopup="menu" aria-expanded="false"><span class="account-avatar" id="accountAvatar">用</span><span class="account-name" id="accountName">本机账户</span><span class="account-chevron">⌄</span></button><div class="account-dropdown" id="accountDropdown" hidden><div class="account-dropdown-info"><strong id="accountDropdownName">本机账户</strong><small id="accountDropdownMeta">本地账户 · 数据独立保存</small></div><button id="accountProfileButton" type="button">编辑个人资料</button><button id="accountThemeButton" type="button">外观与主题</button><button class="danger" id="accountLogoutButton" type="button">退出登录</button></div></div></div>
          </header>
          <aside class="model-picker" id="modelPicker" hidden aria-label="选择大模型">
            <header class="model-picker-header"><div><strong>选择大模型</strong><small>当前选择只作用于本对话，发送前可随时切换</small></div><button class="model-picker-close" id="closeModelPicker" type="button" aria-label="关闭模型选择">×</button></header>
            <div class="model-picker-list" id="chatModelList"><div class="lens-empty">正在读取可用模型…</div></div>
            <footer class="chat-model-footer"><button class="chat-model-manage" id="manageChatModels" type="button">⚙ 管理模型服务</button></footer>
          </aside>
          <aside class="context-lens" id="contextLens" hidden aria-label="对话概览">
            <header class="context-lens-header"><div><strong>对话概览</strong><small>汇总当前焦点、已用资料和下一步建议，不改动历史记录</small></div><button class="context-lens-close" id="closeContextLens" type="button" aria-label="关闭对话概览">×</button></header>
            <div class="context-lens-body" id="contextLensBody"></div>
          </aside>
          <section class="chat-body">
            <div class="welcome" id="welcome">
              <span class="avatar">◉</span>
              <h1>今天想完成什么？</h1>
              <p>这是你的个人知识库与事务助手。它可以管理待办、读写笔记；你上传的文字与图片会安全地关联到当前对话。</p>
              <div class="suggestions">
                <button class="suggestion" data-prompt="查询我还有哪些未完成任务"><b>查看待办</b>查询我还有哪些未完成任务</button>
                <button class="suggestion" data-prompt="帮我创建一个待办：今天整理学习计划，优先级高"><b>安排事项</b>创建一个今天要完成的待办</button>
                <button class="suggestion" data-prompt="列出 workspace 目录中的文件"><b>查看文件</b>列出受限工作区中的文件</button>
                <button class="suggestion" data-prompt="搜索我的笔记里关于 Agent 的内容"><b>检索笔记</b>搜索和整理个人笔记</button>
              </div>
            </div>
            <MessageList />
          </section>
          <div class="composer-wrap">
            <section class="attachment-panel" id="attachmentPanel" hidden>
              <div class="attachment-header"><span><b>待发送附件</b> <span id="attachmentCount"></span></span><button class="delete-selected" id="deleteSelected" type="button" disabled>删除已选</button></div>
              <AttachmentList />
            </section>
            <div class="composer-context" id="composerContext" hidden></div>
            <div class="composer-tools" id="composerTools" hidden>
              <div class="composer-tool-main" id="composerToolMain">
                <button class="composer-tool-row" data-composer-action="attachment" type="button"><span>⌇</span><span><strong>上传附件</strong><small>添加文本、PDF、DOCX 或图片</small></span></button>
                <button class="composer-tool-row" data-composer-action="knowledge" type="button"><span>▤</span><span><strong>知识库</strong><small>选择本次对话要引用的资料库</small></span></button>
                <button class="composer-tool-row" data-composer-action="generate-image" id="generateImageAction" type="button" disabled><span>✧</span><span><strong>生成图片</strong><small>使用当前已配置的图片模型</small></span></button>
                <button class="composer-manage-kb" data-composer-create-kb type="button">管理知识库</button>
              </div>
              <div class="composer-knowledge-picker" id="composerKnowledgePicker" hidden>
                <div class="composer-picker-header"><strong>选择知识库</strong><span>点击切换</span></div>
                <div id="composerKnowledgeList"></div>
              </div>
            </div>
            <div class="composer" id="composer">
              <textarea id="question" rows="1" placeholder="输入消息或粘贴图片，Enter 发送；Shift + Enter 换行" aria-label="消息输入框" title="支持粘贴图片；每条消息最多 4 张图片，每张不超过 16 MB"></textarea>
              <div class="composer-actions">
                <button class="icon-button" id="attach" type="button" title="上传当前对话的文件或图片">＋</button>
                <button class="mode-toggle" id="executionMode" type="button" title="切换自动执行或计划模式">自动执行</button>
                <button class="send-button" id="ask" type="button" title="发送">↑</button>
              </div>
            </div>
            <input class="sr-only" id="fileInput" type="file" multiple accept=".txt,.md,.csv,.json,.pdf,.docx,.png,.jpg,.jpeg,.gif,.webp,text/plain,text/markdown,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/gif,image/webp" />
            <input class="sr-only" id="stateImportInput" type="file" accept="application/json,.json" />
          </div>
        </main>
      </div>
</template>
