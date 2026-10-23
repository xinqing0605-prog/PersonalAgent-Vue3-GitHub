<template>
<div class="modal-backdrop compact-modal" id="modelServiceCreateModal" hidden>
        <form class="provider-dialog" id="modelServiceCreateForm" aria-label="添加自定义服务商" autocomplete="off">
          <div class="dialog-heading"><h2 id="modelServiceCreateTitle">添加服务商</h2><button class="modal-close" id="closeModelServiceCreate" type="button" aria-label="关闭">×</button></div>
          <p class="dialog-subtitle" id="modelServiceCreateSubtitle">只需填写服务商名称；模型连接在右侧单独添加。</p>
          <label data-provider-only>服务商名称（必填）<input id="modelServiceName" name="model-service-name" autocomplete="off" data-lpignore="true" data-1p-ignore="true" maxlength="60" required /></label>
          <label data-model-only>所属服务商（必填）<span class="bounded-provider-select"><select id="modelServiceProvider" class="bounded-provider-native" required tabindex="-1" aria-hidden="true"></select><button class="bounded-provider-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="modelServiceProviderOptions"><span class="bounded-provider-value"></span><span aria-hidden="true">⌄</span></button><span class="bounded-provider-options" id="modelServiceProviderOptions" role="listbox" hidden></span></span></label>
          <label data-model-only>模型类型（必填）<select id="modelServiceType" required><option value="大模型">大模型</option><option value="文档解析">文档解析</option><option value="嵌入模型">嵌入模型</option><option value="重排模型">重排模型</option><option value="综合服务">综合服务</option></select></label>
          <label data-model-only><span id="modelServiceModelLabel">模型标识（可留空）</span><input id="modelServiceModel" name="model-service-model" autocomplete="off" data-lpignore="true" data-1p-ignore="true" maxlength="120" /></label>
          <label data-model-only>完整 API 接口地址（必填）<input id="modelServiceUrl" name="model-service-url" type="url" autocomplete="off" data-lpignore="true" data-1p-ignore="true" maxlength="500" required /></label>
          <small class="form-help" data-model-only>填写该模型实际调用的完整接口；大模型可填写 OpenAI 兼容的 /v1 地址。</small>
          <label data-model-only>API Key（可稍后填写）<div class="secret-field"><input id="modelServiceKey" class="secret-input-masked" name="agent-model-access-token" type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" spellcheck="false" maxlength="500" /><button class="secret-toggle" data-secret-target="modelServiceKey" type="button" aria-label="显示 API Key" title="显示/隐藏 API Key">◉</button></div></label>
          <label data-model-only>模型说明（可选）<input id="modelServiceCreateDescription" name="model-service-description" autocomplete="off" data-lpignore="true" data-1p-ignore="true" maxlength="200" /></label>
          <p class="form-error" id="modelServiceCreateError" role="alert"></p>
          <footer><button class="secondary-button" id="cancelModelServiceCreate" type="button">取消</button><button class="primary-button" id="submitModelServiceCreate" type="submit">添加服务商</button></footer>
        </form>
      </div>
</template>
