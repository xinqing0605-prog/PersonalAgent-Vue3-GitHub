<template>
<div class="modal-backdrop compact-modal" id="globalSearchModal" hidden>
        <section class="overlay-panel" role="dialog" aria-modal="true" aria-label="全局搜索">
          <header><div><h2>全局搜索</h2><p>同时搜索当前设备上的对话、知识库、待办和笔记</p></div><button class="modal-close" id="closeGlobalSearch" type="button" aria-label="关闭">×</button></header>
          <div class="overlay-panel-body"><div class="search-bar"><input id="globalSearchInput" placeholder="输入关键词，例如：简历、学习、北京" autocomplete="off" /><button class="primary-button" id="runGlobalSearch" type="button">搜索</button></div><div class="search-result-list" id="globalSearchResults"><div class="lens-empty">输入关键词开始搜索。</div></div></div>
        </section>
      </div>
</template>
