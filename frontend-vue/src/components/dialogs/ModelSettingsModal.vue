<template>
<div class="modal-backdrop model-settings-screen" id="modelSettingsModal" hidden>
        <section class="model-settings-dialog" role="dialog" aria-modal="true" aria-label="模型服务设置">
          <header class="model-settings-topbar"><button class="model-settings-back" id="backModelSettings" type="button"><span>‹</span> 返回上一级</button><span class="model-settings-window-title">模型服务<small>个人智能体设置</small></span><button class="modal-close" id="closeModelSettings" type="button" aria-label="关闭设置">×</button></header>
          <div class="model-settings-layout" id="modelSettingsLayout">
            <aside class="model-settings-nav" id="modelSettingsNav" aria-label="模型与工具设置">
              <h2>设置中心</h2>
              <button class="active" data-settings-section="services" type="button"><span class="settings-nav-icon" aria-hidden="true">☁</span><span class="settings-nav-copy"><strong>模型服务</strong><small>服务商与模型连接</small></span></button>
              <button data-settings-section="defaults" type="button"><span class="settings-nav-icon" aria-hidden="true">✦</span><span class="settings-nav-copy"><strong>默认模型</strong><small>首选、备用与生成参数</small></span></button>
              <button data-settings-section="local" type="button"><span class="settings-nav-icon" aria-hidden="true">◈</span><span class="settings-nav-copy"><strong>本地模型</strong><small>Ollama 与 LM Studio</small></span></button>
              <button data-settings-section="gateway" type="button"><span class="settings-nav-icon" aria-hidden="true">⇄</span><span class="settings-nav-copy"><strong>API 网关</strong><small>兼容接口与模型导入</small></span></button>
              <h2 class="settings-nav-group">工具与知识</h2>
              <button data-settings-section="mcp" type="button"><span class="settings-nav-icon" aria-hidden="true">⌁</span><span class="settings-nav-copy"><strong>MCP</strong><small>工具连接与基础检查</small></span></button>
            </aside>
            <aside class="model-service-directory" id="modelServiceDirectoryPane"><input class="model-service-search" id="modelServiceSearch" name="model-service-filter" type="search" autocomplete="off" data-lpignore="true" data-1p-ignore="true" spellcheck="false" placeholder="搜索模型平台…" /><div class="model-service-list" id="modelServiceDirectory"></div><button class="model-service-add" id="addModelService" type="button">＋ 添加服务商</button></aside>
            <section class="model-settings-main"><div class="model-service-workspace" id="modelServiceWorkspace"><div class="model-settings-heading"><div><h3 id="modelServiceHeading">模型服务</h3><p id="modelServiceDescription">选择左侧服务商，在右侧管理该服务商下的模型</p></div></div><p class="model-settings-note">左侧只显示服务商；右侧可添加、编辑或删除该服务商下的模型。API Key 与完整接口地址按模型安全保存在当前账户，保存后才会用于对话。</p><div class="service-list" id="modelServiceList"></div></div><div class="agent-settings-content" id="agentSettingsContent" hidden></div></section>
          </div>
        </section>
      </div>
</template>
