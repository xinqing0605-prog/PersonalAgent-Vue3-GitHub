<template>
<div class="modal-backdrop" id="knowledgeModal" hidden>
        <section class="knowledge-workspace" id="knowledgeWorkspace" role="dialog" aria-modal="true" aria-label="知识库工作台">
          <header class="knowledge-workspace-header"><div><span class="workspace-kicker">个人资料 · 拖动标题栏移动，拖动右下角缩放</span><strong>知识库</strong></div><button id="closeKnowledge" class="modal-close" type="button" aria-label="关闭知识库">×</button></header>
          <div class="knowledge-workspace-grid">
            <aside class="knowledge-library">
              <button class="new-knowledge-base" id="openKnowledgeCreate" type="button">＋ 新建知识库</button>
              <div class="knowledge-library-list" id="knowledgeList"></div>
            </aside>
            <section class="knowledge-content" id="knowledgeContent" aria-live="polite"></section>
            <aside class="knowledge-settings-drawer" id="knowledgeSettings" hidden></aside>
          </div>
          <input class="sr-only" id="knowledgeFileInput" type="file" multiple accept=".txt,.md,.csv,.json,.pdf,.docx,text/plain,text/markdown,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          <input class="sr-only" id="knowledgeDirectoryInput" type="file" multiple webkitdirectory directory accept=".txt,.md,.csv,.json,.pdf,.docx,text/plain,text/markdown,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
        </section>
      </div>
</template>
