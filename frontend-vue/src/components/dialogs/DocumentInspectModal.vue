<template>
<div class="modal-backdrop compact-modal" id="documentInspectModal" hidden>
        <section class="document-inspect-dialog" role="dialog" aria-modal="true" aria-label="查看知识库文档">
          <header class="document-inspect-header"><div class="document-inspect-heading"><button class="modal-close" id="backDocumentInspect" type="button" aria-label="返回知识库">‹</button><div><h2 id="documentInspectTitle">文档查看</h2><p id="documentInspectSubtitle"></p></div></div><button class="modal-close" id="closeDocumentInspect" type="button" aria-label="关闭">×</button></header>
          <div class="document-inspect-body" id="documentInspectBody"></div>
        </section>
      </div>
</template>
