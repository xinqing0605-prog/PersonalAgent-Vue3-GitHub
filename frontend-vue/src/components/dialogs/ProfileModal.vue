<template>
<div class="modal-backdrop compact-modal" id="profileModal" hidden>
        <form class="profile-dialog" id="profileForm" aria-label="编辑个人资料" autocomplete="off">
          <div class="dialog-heading"><h2>编辑个人资料</h2><button class="modal-close" id="closeProfile" type="button" aria-label="关闭">×</button></div>
          <div class="profile-avatar-row"><button class="profile-avatar-preview" id="profileAvatarPreview" type="button" aria-label="放大查看头像" title="点击放大头像">用</button><div><strong>个人头像</strong><p class="auth-field-hint">支持 PNG、JPG、WebP，文件不超过 1 MB；点击头像可放大查看</p><div class="profile-avatar-actions"><button id="chooseProfileAvatar" type="button">选择图片</button><button id="removeProfileAvatar" type="button">移除头像</button></div><input id="profileAvatarInput" type="file" accept="image/png,image/jpeg,image/webp" hidden /></div></div>
          <label>登录用户名<input id="profileUsername" type="text" readonly /></label>
          <label>昵称<input id="profileNickname" type="text" minlength="1" maxlength="20" placeholder="1-20 位昵称" required /><small class="auth-field-hint">昵称用于界面展示，不会改变登录用户名</small></label>
          <div class="profile-message" id="profileMessage" role="alert"></div>
          <footer><button class="secondary-button" id="cancelProfile" type="button">取消</button><button class="primary-button" id="saveProfile" type="submit">保存资料</button></footer>
        </form>
      </div>
</template>
