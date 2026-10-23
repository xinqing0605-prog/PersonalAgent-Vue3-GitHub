<template>
  <section class="auth-screen" id="authScreen">
        <div class="auth-card">
          <div class="auth-brand"><span class="auth-brand-mark">◉</span><span>个人智能体</span></div>
          <h1 id="authTitle">登录你的本地智能体</h1>
          <p id="authSubtitle">数据保存在这台电脑上。首次使用请先注册一个本地账户。</p>
          <div class="auth-tabs" role="tablist" aria-label="登录方式"><button class="auth-tab active" data-auth-method="password" type="button">密码登录</button><button class="auth-tab" data-auth-method="phone" type="button">手机验证码</button></div>
          <form class="auth-form auth-panel" id="authForm" novalidate autocomplete="off">
            <label>用户名<input id="authUsername" name="local-agent-identifier" autocomplete="off" data-lpignore="true" data-1p-ignore="true" minlength="2" maxlength="16" pattern="[A-Za-z][A-Za-z0-9_]{1,15}" placeholder="2-16 位，以英文字母开头" required /><small class="auth-field-hint">仅可包含英文字母、数字和下划线</small></label>
            <label>密码<div class="password-field"><input id="authPassword" class="password-masked" name="local-agent-secret" type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" minlength="8" maxlength="20" placeholder="8-20 位，含大小写、数字和符号" required /><button class="password-toggle" data-password-toggle="authPassword" type="button" aria-label="显示密码" title="显示密码"></button></div><small class="auth-field-hint">注册时须同时包含大写、小写、数字和特殊符号</small></label>
            <label id="authConfirmLabel" hidden>确认密码<div class="password-field"><input id="authConfirmPassword" class="password-masked" name="local-agent-secret-confirm" type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" minlength="8" maxlength="20" placeholder="再次输入密码" /><button class="password-toggle" data-password-toggle="authConfirmPassword" type="button" aria-label="显示确认密码" title="显示确认密码"></button></div></label>
            <button class="auth-submit" id="authSubmit" type="submit">登录</button>
          </form>
          <form class="auth-form auth-panel" id="phoneAuthForm" hidden novalidate>
            <label>手机号<input id="phoneNumber" inputmode="numeric" autocomplete="tel" minlength="11" maxlength="24" placeholder="请输入 11 位手机号" required /></label>
            <label>短信验证码<div class="sms-row"><input id="phoneCode" inputmode="numeric" autocomplete="one-time-code" minlength="6" maxlength="6" placeholder="6 位验证码" required /><button id="sendSmsButton" type="button">获取验证码</button></div><small class="auth-field-hint" id="phoneModeHint">验证码 5 分钟内有效；未注册手机号验证后会自动创建账户</small></label>
            <button class="auth-submit" id="phoneSubmit" type="submit">验证码登录 / 自动注册</button>
            <div class="auth-message" id="phoneMessage" role="alert"></div>
          </form>
          <button class="auth-switch" id="authSwitch" type="button">没有账户？创建本地账户</button>
          <div class="auth-message" id="authMessage" role="alert"></div>
          <div class="caps-lock-hint" id="capsLockHint" role="status" aria-live="polite" hidden>大写锁定已开启</div>
          <div class="auth-hint">这是本机桌面版账户，支持在同一台电脑注册多个账户，密码不会上传到云端。请妥善保存密码。</div>
        </div>
      </section>
</template>
