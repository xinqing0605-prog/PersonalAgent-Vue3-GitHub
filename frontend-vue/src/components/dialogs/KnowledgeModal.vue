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
<dialog class="knowledge-note-dialog" id="knowledgeNoteImport" aria-labelledby="knowledgeNoteImportTitle">
  <header><h2 id="knowledgeNoteImportTitle">导入笔记</h2><button id="closeKnowledgeNoteImport" class="modal-close" type="button" aria-label="关闭导入笔记">×</button></header>
  <p>选择当前账户的笔记，导入文字和图片引用的副本。原笔记保留，后续修改不会自动同步。</p>
  <div class="search-bar knowledge-note-search"><input id="knowledgeNoteSearch" type="search" aria-label="搜索要导入的笔记" placeholder="搜索笔记标题或正文" autocomplete="off" /><button id="runKnowledgeNoteSearch" class="primary-button" type="button">搜索</button></div>
  <p id="knowledgeNoteSelectionCount" aria-live="polite">已选 0 篇</p>
  <div id="knowledgeNoteChoices" class="knowledge-note-choices"></div>
  <p id="knowledgeNoteImportError" class="knowledge-note-error" role="alert"></p>
  <footer><button id="cancelKnowledgeNoteImport" class="outline-button" type="button">取消</button><button id="submitKnowledgeNoteImport" class="primary-button" type="button" disabled>导入已选笔记</button></footer>
</dialog>
</template>
