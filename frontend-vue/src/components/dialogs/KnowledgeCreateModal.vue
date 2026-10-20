<template>
<div class="modal-backdrop compact-modal" id="knowledgeCreateModal" hidden>
        <form class="knowledge-create-dialog" id="knowledgeCreate" aria-label="新建知识库" autocomplete="off">
          <div class="dialog-heading"><h2>新建知识库</h2><button class="modal-close" id="closeKnowledgeCreate" type="button" aria-label="关闭">×</button></div>
          <label>名称<input id="knowledgeName" name="knowledge-base-name" autocomplete="off" data-lpignore="true" data-1p-ignore="true" spellcheck="false" maxlength="60" required autofocus /></label>
          <label>嵌入模型<select id="knowledgeEmbedding" name="knowledge-embedding" autocomplete="off"><option value="本地关键词检索">不使用（本地关键词检索）</option></select></label>
          <p id="knowledgeCreateHint">仅列出已配置的嵌入模型；也可使用无需配置的本地关键词检索。</p>
          <div class="dialog-message" id="knowledgeCreateMessage" role="alert"></div><button class="dialog-config-button" id="openKnowledgeCreateModelSettings" type="button" hidden>去配置模型服务</button>
          <footer><button class="secondary-button" id="cancelKnowledgeCreate" type="button">取消</button><button class="primary-button" type="submit">创建</button></footer>
        </form>
      </div>
</template>
