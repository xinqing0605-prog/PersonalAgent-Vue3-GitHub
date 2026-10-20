<script setup lang="ts">
import NoteList from '../NoteList.vue'
</script>
<template>
<div class="modal-backdrop compact-modal" id="notesModal" hidden>
        <section class="overlay-panel" role="dialog" aria-modal="true" aria-labelledby="notesTitle">
          <header><div><h2 id="notesTitle">我的笔记</h2><p>这里显示当前账户保存的全部笔记，点击标题即可展开正文。</p></div><button class="modal-close" id="closeNotes" type="button" aria-label="关闭">×</button></header>
          <div class="overlay-panel-body">
            <div class="collection-toolbar"><button class="primary-button" id="newNote" type="button">＋ 新建笔记</button><span>独立记录想法，也可保存对话中的回答</span></div>
            <form class="note-editor" id="noteEditor" hidden>
              <h3 id="noteEditorHeading">新建笔记</h3><input id="noteEditorId" type="hidden" />
              <label>标题<input id="noteEditorTitle" maxlength="80" required placeholder="给这篇笔记起个名字" /></label>
              <div class="note-editor-toolbar"><label id="noteContentLabel">正文</label><button class="secondary-button" id="insertNoteImage" type="button">＋ 插入图片</button></div>
              <div id="noteEditorContent" class="note-rich-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="noteContentLabel" data-placeholder="写下内容，或按 Ctrl + V 粘贴截图…"></div>
              <input id="noteImageInput" type="file" hidden multiple accept="image/png,image/jpeg,image/webp" />
              <small class="auth-field-hint">支持粘贴截图、选择或拖入 PNG / JPG / WebP；单张不超过 16 MB。点击图片可放大。</small>
              <footer><button class="secondary-button" id="cancelNoteEdit" type="button">取消</button><button class="primary-button" id="saveNoteButton" type="submit">保存笔记</button></footer>
            </form>
            <div class="search-bar"><input id="notesSearchInput" placeholder="搜索笔记标题或正文" autocomplete="off" /><button class="primary-button" id="runNotesSearch" type="button">搜索</button></div>
            <NoteList />
          </div>
        </section>
      </div>
</template>

