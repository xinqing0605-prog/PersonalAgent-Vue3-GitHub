<template>
<div class="modal-backdrop compact-modal" id="conversationPreferencesModal" hidden>
        <section class="overlay-panel" role="dialog" aria-modal="true" aria-label="对话偏好">
          <header><div><h2>对话偏好</h2><p>只作用于当前对话，帮助智能体保持稳定的工作方式</p></div><button class="modal-close" id="closeConversationPreferences" type="button" aria-label="关闭">×</button></header>
          <div class="overlay-panel-body">
            <form class="preference-form" id="conversationPreferencesForm">
              <label>回答风格<select id="conversationResponseStyle"><option value="balanced">平衡：自然、清晰</option><option value="concise">简洁：先给结论</option><option value="structured">结构化：标题与列表优先</option><option value="coach">教练式：拆解目标并给出步骤</option></select></label>
              <label>当前对话指令<textarea id="conversationInstructions" maxlength="2000" placeholder="例如：你是一名产品经理，回答时先给结论，再列出风险和下一步。"></textarea></label>
              <p class="preference-help">这里适合填写角色、语气、输出格式和长期目标。它不会覆盖系统安全规则，也不会影响其他对话。</p>
              <div class="preference-examples"><button class="preference-example" data-preference-example="回答控制在 5 句话以内，先给结论。" type="button">短答案</button><button class="preference-example" data-preference-example="请用标题、步骤和检查清单组织回答。" type="button">清单式</button><button class="preference-example" data-preference-example="请像一位耐心的老师，先解释概念，再给一个简单例子。" type="button">教学式</button></div>
              <footer><button class="secondary-button" id="cancelConversationPreferences" type="button">取消</button><button class="primary-button" type="submit">保存偏好</button></footer>
            </form>
          </div>
        </section>
      </div>
</template>
