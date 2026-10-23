<template>
<div class="modal-backdrop compact-modal" id="modelServiceEditModal" hidden>
        <form class="provider-dialog" id="modelServiceEditForm" aria-label="编辑服务商资料" autocomplete="off">
          <input id="modelServiceEditId" type="hidden" />
          <div class="dialog-heading"><h2 id="modelServiceEditTitle">编辑服务商</h2><button class="modal-close" id="closeModelServiceEdit" type="button" aria-label="关闭">×</button></div>
          <p class="dialog-subtitle" id="modelServiceEditSubtitle">服务商资料与模型连接分开编辑。</p>
          <label data-edit-provider-only>服务商名称（必填）<input id="modelServiceEditName" maxlength="60" required /></label>
          <label data-edit-model-only>所属服务商（必填）<span class="bounded-provider-select"><select id="modelServiceEditProvider" class="bounded-provider-native" required tabindex="-1" aria-hidden="true"></select><button class="bounded-provider-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="modelServiceEditProviderOptions"><span class="bounded-provider-value"></span><span aria-hidden="true">⌄</span></button><span class="bounded-provider-options" id="modelServiceEditProviderOptions" role="listbox" hidden></span></span></label>
          <label data-edit-model-only>模型类型（必填）<select id="modelServiceEditType" required><option value="大模型">大模型</option><option value="文档解析">文档解析</option><option value="嵌入模型">嵌入模型</option><option value="重排模型">重排模型</option><option value="综合服务">综合服务</option></select></label>
          <label data-edit-model-only><span id="modelServiceEditModelLabel">模型标识（可留空）</span><input id="modelServiceEditModel" maxlength="120" /></label>
          <label data-edit-model-only>完整 API 接口地址（必填）<input id="modelServiceEditUrl" type="url" maxlength="500" required /></label>
          <label data-edit-model-only>替换 API Key（留空则保留原 Key）<div class="secret-field"><input id="modelServiceEditKey" class="secret-input-masked" name="agent-model-replacement-token" type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" spellcheck="false" maxlength="500" /><button class="secret-toggle" data-edit-reveal type="button" aria-label="显示 API Key" title="显示/隐藏 API Key">◉</button></div></label>
          <label data-edit-model-only>模型说明（可选）<input id="modelServiceEditDescription" maxlength="200" /></label>
          <p class="form-error" id="modelServiceEditError" role="alert"></p>
          <footer><button class="secondary-button" id="cancelModelServiceEdit" type="button">取消</button><button class="primary-button" id="submitModelServiceEdit" type="submit">保存修改</button></footer>
        </form>
      </div>
</template>
