// @ts-nocheck
import { useThemeStore } from '../stores/theme'
import { useWorkspaceStore } from '../stores/workspace'
import { createLifecycle } from './lifecycle'
import { stripVisibleSourceMarkers, formatAnswerText, normalizeCodeLanguage, highlightCode, formatAnswer, escapeHtml, escapeAttribute, noteBody, renderNoteContent, renderNoteMarkup } from '../lib/format'
import { storeImage } from '../lib/images'
import { useImageViewerStore } from '../stores/imageViewer'
/* Compatibility bridge: this keeps the proven UI behavior while screens migrate to Vue components. */
export function createRuntime() {
  const workspace = useWorkspaceStore();
  const imageViewer = useImageViewerStore();
  const theme = useThemeStore();
  const lifecycle = createLifecycle();
  const { listen, later, repeat, observeResize } = lifecycle;
  listen(window, 'image-feedback', event => showToast(String(event.detail || '')));
  const originalFetch = window.fetch;

  const STORAGE_KEY = 'personal-agent-conversations-v2';
        const LEGACY_STORAGE_KEY = 'personal-agent-conversations-v1';
        const SIDEBAR_COLLAPSED_KEY = 'personal-agent-sidebar-collapsed';
        const AUTH_IDENTIFIER_KEY = 'personal-agent-last-auth-identifier';
        const MAX_FILE_BYTES = 2_000_000;
        const MAX_CHAT_IMAGE_BYTES = 16_000_000;
        const isImageFile = (file) => /\.(png|jpe?g|gif|webp)$/i.test(file.name);
        const toolLabels = { create_task: '创建待办', list_tasks: '查询待办', complete_task: '完成待办', search_notes: '搜索笔记', save_note: '保存笔记', list_local_files: '列出本地文件', read_local_file: '读取本地文件' };
        const question = document.querySelector('#question');
        const ask = document.querySelector('#ask');
        const appShell = document.querySelector('#appShell');
        const sidebar = document.querySelector('#sidebar');
        const sidebarToggle = document.querySelector('#sidebarToggle');
        const executionMode = document.querySelector('#executionMode');
        const messages = document.querySelector('#messages');
        const welcome = document.querySelector('#welcome');
        const chatBody = document.querySelector('.chat-body');
        const conversationList = document.querySelector('#conversationList');
        const conversationSearch = document.querySelector('#conversationSearch');
        const conversationCount = document.querySelector('#conversationCount');
        const toggleArchived = document.querySelector('#toggleArchived');
        const attachmentPanel = document.querySelector('#attachmentPanel');
        const attachmentList = document.querySelector('#attachmentList');
        const attachmentCount = document.querySelector('#attachmentCount');
        const deleteSelected = document.querySelector('#deleteSelected');
        const fileInput = document.querySelector('#fileInput');
        const stateImportInput = document.querySelector('#stateImportInput');
        const knowledgeButton = document.querySelector('#knowledgeButton');
        const modelStatus = document.querySelector('#modelStatus');
        const modelPicker = document.querySelector('#modelPicker');
        const closeModelPicker = document.querySelector('#closeModelPicker');
        const chatModelList = document.querySelector('#chatModelList');
        const manageChatModels = document.querySelector('#manageChatModels');
        const knowledgeModal = document.querySelector('#knowledgeModal');
        const knowledgeWorkspace = document.querySelector('#knowledgeWorkspace');
        const knowledgeList = document.querySelector('#knowledgeList');
        const knowledgeContent = document.querySelector('#knowledgeContent');
        const knowledgeSettings = document.querySelector('#knowledgeSettings');
        const knowledgeFileInput = document.querySelector('#knowledgeFileInput');
        const knowledgeDirectoryInput = document.querySelector('#knowledgeDirectoryInput');
        const knowledgeCreateModal = document.querySelector('#knowledgeCreateModal');
        const documentInspectModal = document.querySelector('#documentInspectModal');
        const backDocumentInspect = document.querySelector('#backDocumentInspect');
        const documentInspectTitle = document.querySelector('#documentInspectTitle');
        const documentInspectSubtitle = document.querySelector('#documentInspectSubtitle');
        const documentInspectBody = document.querySelector('#documentInspectBody');
        const knowledgeEmbedding = document.querySelector('#knowledgeEmbedding');
        const knowledgeCreateHint = document.querySelector('#knowledgeCreateHint');
        const knowledgeCreateMessage = document.querySelector('#knowledgeCreateMessage');
        const openKnowledgeCreateModelSettings = document.querySelector('#openKnowledgeCreateModelSettings');
        const contextLens = document.querySelector('#contextLens');
        const contextLensBody = document.querySelector('#contextLensBody');
        const modelSettingsModal = document.querySelector('#modelSettingsModal');
        const modelSettingsLayout = document.querySelector('#modelSettingsLayout');
        const modelSettingsNav = document.querySelector('#modelSettingsNav');
        const modelServiceWorkspace = document.querySelector('#modelServiceWorkspace');
        const agentSettingsContent = document.querySelector('#agentSettingsContent');
        const modelServiceCreateModal = document.querySelector('#modelServiceCreateModal');
        const modelServiceCreateForm = document.querySelector('#modelServiceCreateForm');
        const modelServiceList = document.querySelector('#modelServiceList');
        const modelServiceDirectory = document.querySelector('#modelServiceDirectory');
        const modelServiceSearch = document.querySelector('#modelServiceSearch');
        const modelServiceHeading = document.querySelector('#modelServiceHeading');
        const modelServiceDescription = document.querySelector('#modelServiceDescription');
        const addModelService = document.querySelector('#addModelService');
        const modelServiceEditModal = document.querySelector('#modelServiceEditModal');
        const modelServiceEditForm = document.querySelector('#modelServiceEditForm');
        const composerContext = document.querySelector('#composerContext');
        const composerTools = document.querySelector('#composerTools');
        const generateImageAction = document.querySelector('#generateImageAction');
        const composerToolMain = document.querySelector('#composerToolMain');
        const composerKnowledgePicker = document.querySelector('#composerKnowledgePicker');
        const composerKnowledgeList = document.querySelector('#composerKnowledgeList');
        const toast = document.querySelector('#toast');
        const globalSearchModal = document.querySelector('#globalSearchModal');
        const globalSearchInput = document.querySelector('#globalSearchInput');
        const globalSearchResults = document.querySelector('#globalSearchResults');
        const notesModal = document.querySelector('#notesModal');
        const notesSearchInput = document.querySelector('#notesSearchInput');
        const notesList = document.querySelector('#notesList');
        const noteEditor = document.querySelector('#noteEditor');
        const noteEditorId = document.querySelector('#noteEditorId');
        const noteEditorTitle = document.querySelector('#noteEditorTitle');
        const noteEditorContent = document.querySelector('#noteEditorContent');
        const tasksModal = document.querySelector('#tasksModal');
        const taskEditor = document.querySelector('#taskEditor');
        const taskList = document.querySelector('#taskList');
        let loadedTasks = [];
        let taskLoadVersion = 0;
        let noteEditorVersion = 0;
        let noteImagesPending = 0;
        let noteSelection = null;
        let noteOriginal = '';
        const dailyBriefModal = document.querySelector('#dailyBriefModal');
        const dailyBriefBody = document.querySelector('#dailyBriefBody');
        const contextGraphModal = document.querySelector('#contextGraphModal');
        const contextGraphBody = document.querySelector('#contextGraphBody');
        const conversationPreferencesModal = document.querySelector('#conversationPreferencesModal');
        const openConversationPreferences = document.querySelector('#openConversationPreferences');
        const closeConversationPreferences = document.querySelector('#closeConversationPreferences');
        const cancelConversationPreferences = document.querySelector('#cancelConversationPreferences');
        const conversationPreferencesForm = document.querySelector('#conversationPreferencesForm');
        const conversationInstructions = document.querySelector('#conversationInstructions');
        const conversationResponseStyle = document.querySelector('#conversationResponseStyle');
        const authForm = document.querySelector('#authForm');
        const authTitle = document.querySelector('#authTitle');
        const authSubtitle = document.querySelector('#authSubtitle');
        const authUsername = document.querySelector('#authUsername');
        const authPassword = document.querySelector('#authPassword');
        const authConfirmLabel = document.querySelector('#authConfirmLabel');
        const authConfirmPassword = document.querySelector('#authConfirmPassword');
        const authSubmit = document.querySelector('#authSubmit');
        const authSwitch = document.querySelector('#authSwitch');
        const authMessage = document.querySelector('#authMessage');
        const accountMenu = document.querySelector('#accountMenu');
        const accountButton = document.querySelector('#accountButton');
        const accountDropdown = document.querySelector('#accountDropdown');
        const accountAvatar = document.querySelector('#accountAvatar');
        const accountName = document.querySelector('#accountName');
        const accountDropdownName = document.querySelector('#accountDropdownName');
        const accountDropdownMeta = document.querySelector('#accountDropdownMeta');
        const accountProfileButton = document.querySelector('#accountProfileButton');
        const accountThemeButton = document.querySelector('#accountThemeButton');
        const accountLogoutButton = document.querySelector('#accountLogoutButton');
        const authTabs = document.querySelectorAll('[data-auth-method]');
        const phoneAuthForm = document.querySelector('#phoneAuthForm');
        const phoneNumber = document.querySelector('#phoneNumber');
        const phoneCode = document.querySelector('#phoneCode');
        const sendSmsButton = document.querySelector('#sendSmsButton');
        const phoneSubmit = document.querySelector('#phoneSubmit');
        const phoneMessage = document.querySelector('#phoneMessage');
        const capsLockHint = document.querySelector('#capsLockHint');
        const profileModal = document.querySelector('#profileModal');
        const profileForm = document.querySelector('#profileForm');
        const closeProfile = document.querySelector('#closeProfile');
        const cancelProfile = document.querySelector('#cancelProfile');
        const profileAvatarPreview = document.querySelector('#profileAvatarPreview');
        const profileAvatarInput = document.querySelector('#profileAvatarInput');
        const chooseProfileAvatar = document.querySelector('#chooseProfileAvatar');
        const removeProfileAvatar = document.querySelector('#removeProfileAvatar');
        const profileUsername = document.querySelector('#profileUsername');
        const profileNickname = document.querySelector('#profileNickname');
        const profileMessage = document.querySelector('#profileMessage');
        const avatarPreviewModal = document.querySelector('#avatarPreviewModal');
        const avatarPreviewImage = document.querySelector('#avatarPreviewImage');
        const closeAvatarPreview = document.querySelector('#closeAvatarPreview');
        const textContextMenu = document.querySelector('#textContextMenu');
        const nativeFetch = window.fetch.bind(window);
        let authMode = 'login';
        let authMethod = 'password';
        let authUser = null;
        let authSessionVersion = 0;
        let desktopStateEnabled = false;
        let desktopStatePending = null;
        let desktopStateWriter = null;
        let desktopStateError = null;
        function flushDesktopState() {
          if (desktopStateWriter) return desktopStateWriter;
          desktopStateWriter = (async () => {
            while (desktopStateEnabled && desktopStatePending !== null) {
              const snapshot = desktopStatePending;
              desktopStatePending = null;
              try {
                const response = await nativeFetch('/api/desktop/conversations', {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: snapshot,
                });
                if (!response.ok) {
                  const data = await response.json().catch(() => ({}));
                  throw new Error(data.detail || '对话记录保存失败。');
                }
                desktopStateError = null;
              } catch (error) {
                if (desktopStatePending === null) desktopStatePending = snapshot;
                desktopStateError = error;
                showToast(error.message || '对话记录保存失败，请重试。');
                return;
              }
            }
          })().finally(() => { desktopStateWriter = null; });
          return desktopStateWriter;
        }
        let smsCountdown = 0;
        let smsTimer = null;
        let capsLockHintTimer = null;
        let capsLockEnabled = false;
        let pendingProfileAvatar = '';
        let textContextState = null;
        let toastTimer = null;
        let state = null; workspace.reset();
        let sending = false;
        let activeRequestController = null;
        let selectedFiles = new Set();
        let loadingAttachments = false;
        const attachmentUploads = new Map();
        let knowledgeBases = [];
        let editingKnowledgeBaseId = null;
        let knowledgeDocuments = [];
        let loadedDocumentKnowledgeBaseId = null;
        let selectedKnowledgeDocuments = new Set();
        let modelServices = [];
        let knowledgeModelOptions = null;
        let modelServicesRevision = 0;
        let chatModels = [];
        let defaultChatModelId = '';
        let activeModelServiceId = '';
        let activeSettingsSection = 'services';
        let agentSettings = null;
        let agentSettingsRuntime = null;
        let discoveredLocalProviders = [];
        let discoveredGatewayModels = [];
        let showArchivedConversations = false;
        let loadedNotes = [];
  
        function newConversation() { return { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title: '新对话', messages: [], files: [], pendingAttachmentNames: [], knowledgeBaseIds: [], executionMode: 'auto', chatModelId: '', conversationInstructions: '', responseStyle: 'balanced', draft: '', editingMessageId: '', pinned: false, archived: false }; }
        function scopedStorageKey() { return authUser ? `${STORAGE_KEY}:user-${encodeURIComponent(String(authUser.id))}` : `${STORAGE_KEY}:guest`; }
        function displayName(user = authUser) { return String(user?.nickname || user?.username || '本机账户'); }
        function renderUserAvatar(element, user = authUser, avatarOverride) {
          const avatar = avatarOverride === undefined ? String(user?.avatar || '') : String(avatarOverride || '');
          const label = displayName(user);
          element.textContent = avatar ? '' : (label.slice(0, 1).toUpperCase() || '用');
          element.style.backgroundImage = avatar ? `url("${avatar.replace(/"/g, '%22')}")` : '';
          element.classList.toggle('has-image', Boolean(avatar));
        }
        function passwordToggleIcon(visible) {
          return visible
            ? '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3l18 18"></path><path d="M10.7 10.7a2 2 0 0 0 2.6 2.6"></path><path d="M9.9 4.8A10.7 10.7 0 0 1 12 4.6c6.1 0 9.6 7.4 9.6 7.4a16.7 16.7 0 0 1-3.1 4.2M6.6 6.6C3.9 8.5 2.4 12 2.4 12s3.5 7.4 9.6 7.4c1.4 0 2.7-.4 3.8-1"></path></svg>'
            : '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.4 12S5.9 4.6 12 4.6s9.6 7.4 9.6 7.4-3.5 7.4-9.6 7.4S2.4 12 2.4 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
        function setPasswordToggleState(button, visible) {
          const targetId = button.dataset.passwordToggle;
          const label = targetId === 'authConfirmPassword' ? '确认密码' : '密码';
          button.innerHTML = passwordToggleIcon(visible);
          button.setAttribute('aria-label', `${visible ? '隐藏' : '显示'}${label}`);
          button.title = `${visible ? '隐藏' : '显示'}${label}`;
        }
        function resetPasswordVisibility() {
          hideCapsLockHint();
          document.querySelectorAll('[data-password-toggle]').forEach((button) => {
            const input = document.getElementById(button.dataset.passwordToggle);
            if (input) input.classList.add('password-masked');
            setPasswordToggleState(button, false);
          });
        }
        function togglePasswordVisibility(button) {
          const input = document.getElementById(button.dataset.passwordToggle);
          if (!input) return;
          const visible = input.classList.contains('password-masked');
          input.classList.toggle('password-masked', !visible);
          setPasswordToggleState(button, visible);
          input.focus();
        }
        function hideCapsLockHint() {
          if (capsLockHintTimer) clearTimeout(capsLockHintTimer);
          capsLockHintTimer = null;
          capsLockHint.hidden = true;
        }
        function showCapsLockHint(input) {
          if (!input || !capsLockEnabled) return;
          const rect = input.getBoundingClientRect();
          const maxLeft = Math.max(12, window.innerWidth - 292);
          capsLockHint.style.left = `${Math.max(12, Math.min(rect.left, maxLeft))}px`;
          capsLockHint.style.top = `${Math.min(rect.bottom + 7, window.innerHeight - 44)}px`;
          capsLockHint.hidden = false;
          if (capsLockHintTimer) clearTimeout(capsLockHintTimer);
          capsLockHintTimer = later(hideCapsLockHint, 2600);
        }
        function updateCapsLockHint(event) {
          if (typeof event?.getModifierState === 'function') {
            capsLockEnabled = Boolean(event.getModifierState('CapsLock'));
          }
          if (capsLockEnabled) showCapsLockHint(event.currentTarget);
          else hideCapsLockHint();
        }
        function readRememberedAuthIdentifiers() {
          try {
            const value = JSON.parse(localStorage.getItem(AUTH_IDENTIFIER_KEY) || '{}');
            const legacyUsername = String(value?.username || '').trim();
            const generatedPhoneUsername = /^(?:手机用户|phone_user)_\d+(?:_\d+)?$/i.test(legacyUsername);
            const passwordUsername = String(value?.passwordUsername || (generatedPhoneUsername ? '' : legacyUsername)).trim();
            return {
              passwordUsername,
              phoneNumber: String(value?.phoneNumber || value?.phone || '').trim(),
              preferredMethod: ['password', 'phone'].includes(value?.preferredMethod) ? value.preferredMethod : (['password', 'phone'].includes(value?.method) ? value.method : 'password'),
            };
          } catch (_) { return { passwordUsername: '', phoneNumber: '', preferredMethod: 'password' }; }
        }
        function rememberAuthIdentifiers(updates = {}) {
          const current = readRememberedAuthIdentifiers();
          const next = {
            passwordUsername: updates.passwordUsername === undefined ? current.passwordUsername : String(updates.passwordUsername || '').trim(),
            phoneNumber: updates.phoneNumber === undefined ? current.phoneNumber : String(updates.phoneNumber || '').trim(),
            preferredMethod: ['password', 'phone'].includes(updates.preferredMethod) ? updates.preferredMethod : current.preferredMethod,
          };
          localStorage.setItem(AUTH_IDENTIFIER_KEY, JSON.stringify(next));
          return next;
        }
        function restoreAuthIdentifiers() {
          const remembered = readRememberedAuthIdentifiers();
          authUsername.value = remembered.passwordUsername;
          phoneNumber.value = remembered.phoneNumber;
          return remembered;
        }
        function setAuthMethod(method) {
          authMethod = ['password', 'phone'].includes(method) ? method : 'password';
          authTabs.forEach((tab) => { const active = tab.dataset.authMethod === authMethod; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); });
          authForm.hidden = authMethod !== 'password';
          phoneAuthForm.hidden = authMethod !== 'phone';
          authSwitch.hidden = authMethod !== 'password';
          authMessage.textContent = '';
          phoneMessage.textContent = '';
        }
        function showPhoneMessage(message, success = false) {
          phoneMessage.textContent = message;
          phoneMessage.classList.toggle('success', success);
          phoneMessage.classList.toggle('info', !success);
        }
        function resetSmsState({ clearFields = false, clearMessage = false } = {}) {
          if (smsTimer) clearInterval(smsTimer);
          smsTimer = null;
          smsCountdown = 0;
          sendSmsButton.disabled = false;
          sendSmsButton.textContent = '获取验证码';
          phoneSubmit.disabled = false;
          if (clearFields) {
            phoneNumber.value = '';
            phoneCode.value = '';
          }
          if (clearMessage) {
            phoneMessage.textContent = '';
            phoneMessage.classList.remove('success', 'info');
          }
        }
        function resetAuthTransientState({ preserveIdentifiers = true } = {}) {
          resetSmsState({ clearFields: false, clearMessage: true });
          if (!preserveIdentifiers) {
            authUsername.value = '';
            phoneNumber.value = '';
          }
          phoneCode.value = '';
          authPassword.value = '';
          authConfirmPassword.value = '';
          authSubmit.disabled = false;
          authMessage.textContent = '';
          authMessage.classList.remove('success', 'info');
          resetPasswordVisibility();
        }
        async function sendSmsCode() {
          const phone = phoneNumber.value.trim();
          if (!/^1[3-9]\d{9}$/.test(phone)) { showPhoneMessage('请输入有效的 11 位中国大陆手机号。'); phoneNumber.focus(); return; }
          sendSmsButton.disabled = true;
          try {
            const response = await nativeFetch('/api/auth/sms/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, purpose: 'login' }) });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || '验证码发送失败。');
            const devHint = data.dev_code ? ` 开发模式验证码：${data.dev_code}` : '';
            showPhoneMessage(`${data.message || '验证码已发送。'}${devHint}`, true);
            smsCountdown = Math.max(1, Number(data.resend_in) || 60);
            sendSmsButton.textContent = `${smsCountdown}s 后重发`;
            clearInterval(smsTimer);
            smsTimer = repeat(() => {
              smsCountdown -= 1;
              if (smsCountdown <= 0) resetSmsState();
              else sendSmsButton.textContent = `${smsCountdown}s 后重发`;
            }, 1000);
          } catch (error) {
            showPhoneMessage(error.message || '验证码发送失败。');
            sendSmsButton.disabled = false;
          }
        }
        async function submitPhoneAuth(event) {
          event.preventDefault();
          const phone = phoneNumber.value.trim();
          const code = phoneCode.value.trim();
          if (!/^1[3-9]\d{9}$/.test(phone)) { showPhoneMessage('请输入有效的 11 位中国大陆手机号。'); return; }
          if (!/^\d{6}$/.test(code)) { showPhoneMessage('验证码必须是 6 位数字。'); return; }
          phoneSubmit.disabled = true;
          try {
            const response = await nativeFetch('/api/auth/phone/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code }) });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || '手机号登录失败。');
            rememberAuthIdentifiers({ phoneNumber: phone, preferredMethod: 'phone' });
            await finishAuth(data.user, 'phone');
          } catch (error) {
            showPhoneMessage(error.message || '手机号登录失败。');
          } finally { phoneSubmit.disabled = false; }
        }
        function setAuthMode(mode) {
          authMode = mode === 'register' ? 'register' : 'login';
          const registering = authMode === 'register';
          authTitle.textContent = registering ? '创建本地智能体账户' : '登录你的本地智能体';
          authSubtitle.textContent = registering ? '账户和数据只保存在这台电脑上，注册完成后会自动登录。' : '请输入本机账户信息继续使用个人知识库与事务助手。';
          authConfirmLabel.hidden = !registering;
          authConfirmLabel.style.display = registering ? 'grid' : 'none';
          authConfirmPassword.required = registering;
          authConfirmPassword.value = '';
          authPassword.value = '';
          resetPasswordVisibility();
          authUsername.autocomplete = 'off';
          authPassword.autocomplete = 'off';
          authConfirmPassword.autocomplete = 'off';
          authSubmit.textContent = registering ? '注册并登录' : '登录';
          authSwitch.textContent = registering ? '已有账户？返回登录' : '没有账户？创建本地账户';
          authMessage.textContent = '';
          authMessage.classList.remove('success');
        }
        function showAuthScreen(mode = 'login', message = '') {
          imageViewer.close();
          resetAuthTransientState({ preserveIdentifiers: true });
          const remembered = restoreAuthIdentifiers();
          setAuthMode(mode);
          setAuthMethod(mode === 'register' ? 'password' : remembered.preferredMethod);
          document.body.classList.add('auth-locked');
          document.body.classList.remove('auth-checking');
          accountMenu.hidden = true;
          accountDropdown.hidden = true;
          profileModal.hidden = true;
          theme.reset();
          avatarPreviewModal.hidden = true;
          theme.reset();
          authMessage.textContent = message;
          authMessage.classList.remove('success');
          (authMethod === 'phone' ? phoneNumber : authUsername).focus();
        }
        function updateAccountMenu(user) {
          const label = displayName(user);
          renderUserAvatar(accountAvatar, user);
          accountName.textContent = label;
          accountDropdownName.textContent = label;
          accountDropdownMeta.textContent = `${user?.username || '本地账户'} · 数据独立保存`;
        }
        function mergeDesktopHistory(remote, local) {
          if (!remote) return local;
          if (!local) return remote;
          const conversations = new Map(remote.conversations.map(item => [item.id, item]));
          for (const legacy of local.conversations || []) {
            const current = conversations.get(legacy.id);
            if (!current) { conversations.set(legacy.id, legacy); continue; }
            const messages = new Map((legacy.messages || []).map(item => [item.id, item]));
            for (const message of current.messages || []) messages.set(message.id, message);
            conversations.set(legacy.id, { ...legacy, ...current, messages: [...messages.values()] });
          }
          return { ...remote, conversations: [...conversations.values()] };
        }
        async function finishAuth(user, method = authMethod) {
          const identifiers = { preferredMethod: method };
          if (method === 'password' && authUsername.value.trim()) identifiers.passwordUsername = authUsername.value.trim();
          if (method === 'phone' && phoneNumber.value.trim()) identifiers.phoneNumber = phoneNumber.value.trim();
          rememberAuthIdentifiers(identifiers);
          resetAuthTransientState({ preserveIdentifiers: true });
          const sessionVersion = ++authSessionVersion;
          authUser = user;
          desktopStateEnabled = false;
          desktopStatePending = null;
          desktopStateError = null;
          const storedResponse = await nativeFetch('/api/desktop/conversations', { cache: 'no-store' });
          if (sessionVersion !== authSessionVersion) return;
          if (storedResponse.ok) {
            const stored = await storedResponse.json();
            const importedKey = `${scopedStorageKey()}:desktop-imported`;
            const local = loadState();
            const previouslySaved = localStorage.getItem(scopedStorageKey());
            const initial = localStorage.getItem(importedKey) ? (stored.state || local)
              : mergeDesktopHistory(stored.state, previouslySaved ? local : null) || local;
            const initialSave = await nativeFetch('/api/desktop/conversations', {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initial),
            });
            if (!initialSave.ok) throw new Error('对话记录保存失败，请检查数据目录后重试。');
            localStorage.setItem(scopedStorageKey(), JSON.stringify(initial));
            localStorage.setItem(importedKey, '1');
            desktopStateEnabled = true;
          } else if (storedResponse.status !== 404) {
            const error = await storedResponse.json().catch(() => ({}));
            throw new Error(error.detail || '无法读取对话记录，请重试。');
          }
          modelServices = []; knowledgeModelOptions = null;
          chatModels = [];
          defaultChatModelId = '';
          activeModelServiceId = '';
          activeSettingsSection = 'services';
          agentSettings = null;
          agentSettingsRuntime = null;
          discoveredLocalProviders = [];
          discoveredGatewayModels = [];
          theme.reset();
          document.body.classList.remove('auth-locked', 'auth-checking');
          accountMenu.hidden = false;
          accountDropdown.hidden = true;
          updateAccountMenu(user);
          conversationCount.textContent = `本机账户 · ${displayName(user)}`;
          state = loadState();
          render();
          refreshAttachments();
          refreshKnowledgeBases();
          loadModelStatus(sessionVersion, String(user.id));
          theme.load();
        }
  
        function closeProfileModal() {
          profileModal.hidden = true;
          profileAvatarInput.value = '';
          profileMessage.textContent = '';
          profileMessage.classList.remove('success');
        }
        function openProfileModal() {
          if (!authUser) return;
          accountDropdown.hidden = true;
          accountButton.classList.remove('active');
          profileUsername.value = authUser.username || '';
          profileNickname.value = displayName(authUser);
          pendingProfileAvatar = String(authUser.avatar || '');
          renderUserAvatar(profileAvatarPreview, authUser, pendingProfileAvatar);
          profileMessage.textContent = '';
          profileMessage.classList.remove('success');
          profileModal.hidden = false;
          profileNickname.focus();
        }
        function openAvatarPreview() {
          const avatar = pendingProfileAvatar || String(authUser?.avatar || '');
          if (!avatar) {
            profileMessage.textContent = '请先选择头像后再放大查看。';
            return;
          }
          avatarPreviewImage.src = avatar;
          avatarPreviewModal.hidden = false;
          closeAvatarPreview.focus();
        }
        function closeAvatarPreviewModal() {
          avatarPreviewModal.hidden = true;
          avatarPreviewImage.removeAttribute('src');
          profileAvatarPreview.focus();
        }
        function selectProfileAvatar(file) {
          if (!file) return;
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { profileMessage.textContent = '头像仅支持 PNG、JPG、WebP 图片。'; return; }
          if (file.size <= 0 || file.size > 1_000_000) { profileMessage.textContent = '头像不能为空且不能超过 1 MB。'; return; }
          const reader = new FileReader();
          reader.onload = () => { pendingProfileAvatar = String(reader.result || ''); renderUserAvatar(profileAvatarPreview, authUser, pendingProfileAvatar); profileMessage.textContent = ''; };
          reader.onerror = () => { profileMessage.textContent = '头像读取失败，请重新选择。'; };
          reader.readAsDataURL(file);
        }
        async function saveProfileDetails(event) {
          event.preventDefault();
          const nickname = profileNickname.value.trim();
          if (nickname.length < 1 || nickname.length > 20) { profileMessage.textContent = '昵称长度需为 1-20 位。'; profileNickname.focus(); return; }
          const submit = document.querySelector('#saveProfile');
          submit.disabled = true;
          profileMessage.textContent = '正在保存…';
          profileMessage.classList.remove('success');
          try {
            const response = await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, avatar: pendingProfileAvatar }) });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || '个人资料保存失败。');
            authUser = data.user;
            updateAccountMenu(authUser);
            conversationCount.textContent = `本机账户 · ${displayName(authUser)}`;
            profileMessage.textContent = data.message || '个人资料已保存。';
            profileMessage.classList.add('success');
            later(closeProfileModal, 450);
          } catch (error) { profileMessage.textContent = error.message || '个人资料保存失败。'; }
          finally { submit.disabled = false; }
        }
        async function submitAuth(event) {
          event.preventDefault();
          const username = authUsername.value.trim();
          const password = authPassword.value;
          const usernamePattern = /^[A-Za-z][A-Za-z0-9_]{1,15}$/;
          if (!usernamePattern.test(username)) {
            authMessage.textContent = '用户名需为 2-16 位，以英文字母开头，仅可包含英文字母、数字和下划线。';
            authMessage.classList.remove('success');
            return;
          }
          if (password.length < 8 || password.length > 20) {
            authMessage.textContent = '密码长度需为 8-20 位。';
            authMessage.classList.remove('success');
            return;
          }
          if (authMode === 'register') {
            if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|`~]/.test(password)) {
              authMessage.textContent = '密码需同时包含大写字母、小写字母、数字和特殊符号。';
              authMessage.classList.remove('success');
              return;
            }
            if (password.toLowerCase().includes(username.toLowerCase())) {
              authMessage.textContent = '密码不能包含完整用户名。';
              authMessage.classList.remove('success');
              return;
            }
            if (/(.)\1\1/.test(password)) {
              authMessage.textContent = '密码不能包含连续 3 个相同字符。';
              authMessage.classList.remove('success');
              return;
            }
          }
          if (authMode === 'register' && password !== authConfirmPassword.value) {
            authMessage.textContent = '两次输入的密码不一致。';
            authMessage.classList.remove('success');
            return;
          }
          authSubmit.disabled = true;
          authMessage.textContent = '正在处理…';
          authMessage.classList.remove('success');
          try {
            const response = await nativeFetch(`/api/auth/${authMode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || '认证失败，请稍后重试。');
            authMessage.textContent = data.message || '操作成功。';
            authMessage.classList.add('success');
            rememberAuthIdentifiers({ passwordUsername: username, preferredMethod: 'password' });
            await finishAuth(data.user, 'password');
          } catch (error) {
            authMessage.textContent = error.message || '认证失败，请稍后重试。';
            authMessage.classList.remove('success');
          } finally {
            authSubmit.disabled = false;
          }
        }
        async function bootAuth() {
          const queryParameters = new URLSearchParams(window.location.search);
          const authError = queryParameters.get('auth_error');
          const authErrorMessages = {
            desktop_account_in_use: '该账户已在另一个窗口中运行，请使用已打开的窗口，或登录其他账户。',
          };
          try {
            const response = await nativeFetch('/api/auth/status');
            const data = await response.json();
            if (!response.ok) {
              showAuthScreen('login', data.detail || '无法读取登录状态，请重试。');
              if (authMethod === 'phone') showPhoneMessage(data.detail || '请登录其他账户。');
              return;
            }
            if (data.authenticated && data.user) {
              const remembered = readRememberedAuthIdentifiers();
              await finishAuth(data.user, remembered.preferredMethod);
              if (authError) window.history.replaceState({}, '', window.location.pathname);
              return;
            }
            showAuthScreen(data.registered ? 'login' : 'register', authErrorMessages[authError] || '');
            if (authError) window.history.replaceState({}, '', window.location.pathname);
          } catch (error) {
            showAuthScreen('login', '无法连接本地服务，请确认后端已启动。');
          }
        }
        window.fetch = async (input, init) => {
          const response = await nativeFetch(input, init);
          const url = typeof input === 'string' ? input : input?.url || '';
          if (response.status === 401 && !url.includes('/api/auth/')) showAuthScreen('login', '登录已失效，请重新登录。');
          if (response.status === 409) {
            const conflict = await response.clone().json().catch(() => ({}));
            if (conflict.code === 'desktop_account_in_use') {
              authSessionVersion += 1;
              authUser = null;
              state = null; workspace.reset();
              showAuthScreen('login', conflict.detail);
            }
          }
          return response;
        };
        function loadState() {
          try {
            const scopedKey = scopedStorageKey();
            const scopedRaw = localStorage.getItem(scopedKey);
            const previousUsernameKey = authUser ? `${STORAGE_KEY}:${encodeURIComponent(authUser.username)}` : '';
            const previousUsernameRaw = previousUsernameKey ? localStorage.getItem(previousUsernameKey) : null;
            const legacyRaw = Number(authUser?.id) === 1 ? (localStorage.getItem(LEGACY_STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)) : null;
            const saved = JSON.parse(scopedRaw || previousUsernameRaw || legacyRaw || 'null');
            if (saved?.conversations?.length && saved.activeId) {
              saved.conversations.forEach((conversation) => {
                if (!Array.isArray(conversation.messages)) conversation.messages = [];
                conversation.messages.forEach((message) => { if (!message.id) message.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; });
                if (!Array.isArray(conversation.files)) conversation.files = [];
                if (!Array.isArray(conversation.pendingAttachmentNames)) {
                  const sentNames = new Set(conversation.messages.flatMap((message) => Array.isArray(message.attachments) ? message.attachments : []));
                  conversation.pendingAttachmentNames = conversation.files.map((file) => file.filename).filter((name) => !sentNames.has(name));
                } else conversation.pendingAttachmentNames = conversation.pendingAttachmentNames.filter((name) => typeof name === 'string');
                if (!Array.isArray(conversation.knowledgeBaseIds)) conversation.knowledgeBaseIds = [];
                delete conversation.sendAttachments;
                if (!['auto', 'plan'].includes(conversation.executionMode)) conversation.executionMode = 'auto';
                if (typeof conversation.chatModelId !== 'string') conversation.chatModelId = '';
                if (typeof conversation.conversationInstructions !== 'string') conversation.conversationInstructions = '';
                if (!['balanced', 'concise', 'structured', 'coach'].includes(conversation.responseStyle)) conversation.responseStyle = 'balanced';
                if (typeof conversation.draft !== 'string') conversation.draft = '';
                if (typeof conversation.pinned !== 'boolean') conversation.pinned = false;
                if (typeof conversation.archived !== 'boolean') conversation.archived = false;
              });
              if (authUser && !scopedRaw) localStorage.setItem(scopedKey, JSON.stringify(saved));
              return saved;
            }
          } catch (_) { /* Start clean if browser storage was cleared or corrupted. */ }
          const conversation = newConversation();
          return { conversations: [conversation], activeId: conversation.id };
        }
        function saveState() {
          if (!authUser || !state) return;
          const snapshot = JSON.stringify(state);
          localStorage.setItem(scopedStorageKey(), snapshot);
          if (desktopStateEnabled) { desktopStatePending = snapshot; flushDesktopState(); }
        }
        function setSidebarCollapsed(collapsed) {
          const next = Boolean(collapsed);
          appShell.classList.toggle('sidebar-collapsed', next);
          appShell.classList.remove('sidebar-peek');
          sidebarToggle.textContent = next ? '›' : '‹';
          sidebarToggle.title = next ? '固定展开对话导航' : '折叠对话导航';
          sidebarToggle.setAttribute('aria-label', sidebarToggle.title);
          sidebarToggle.setAttribute('aria-expanded', String(!next));
          localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
        }
        setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
        function openConversationPreferencesModal() {
          closeTopPanels('preferences');
          const current = activeConversation();
          conversationInstructions.value = current.conversationInstructions || '';
          conversationResponseStyle.value = current.responseStyle || 'balanced';
          conversationPreferencesModal.hidden = false;
          openConversationPreferences.classList.add('active');
          conversationInstructions.focus();
        }
        function closeConversationPreferencesModal() {
          conversationPreferencesModal.hidden = true;
          openConversationPreferences.classList.remove('active');
        }
        function closeTopPanels(except = '') {
          if (except !== 'preferences') closeConversationPreferencesModal();
          if (except !== 'lens') contextLens.hidden = true;
          if (except !== 'knowledge') { knowledgeModal.hidden = true; knowledgeSettings.hidden = true; }
          if (except !== 'model') setModelPicker(false);
          if (except !== 'account') {
            accountDropdown.hidden = true;
            accountButton.classList.remove('active');
            accountButton.setAttribute('aria-expanded', 'false');
          }
          if (except !== 'tasks') tasksModal.hidden = true;
          if (except !== 'notes' && !notesModal.hidden) { notesModal.hidden = true; closeNoteEditor(); }
        }
        function initializeKnowledgeWorkspaceDrag() {
          const handle = knowledgeWorkspace?.querySelector('.knowledge-workspace-header');
          if (!handle) return;
          let drag = null;
          listen(handle, 'pointerdown', (event) => {
            if (event.button !== 0 || event.target.closest('button') || window.matchMedia('(max-width: 720px)').matches) return;
            drag = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: Number(knowledgeWorkspace.dataset.offsetX || 0),
              originY: Number(knowledgeWorkspace.dataset.offsetY || 0),
            };
            knowledgeWorkspace.classList.add('dragging');
            handle.setPointerCapture?.(event.pointerId);
            event.preventDefault();
          });
          listen(handle, 'pointermove', (event) => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            const rect = knowledgeWorkspace.getBoundingClientRect();
            const maxX = Math.max(0, (window.innerWidth - rect.width) / 2);
            const maxY = Math.max(0, (window.innerHeight - rect.height) / 2);
            const x = Math.max(-maxX, Math.min(maxX, drag.originX + event.clientX - drag.startX));
            const y = Math.max(-maxY, Math.min(maxY, drag.originY + event.clientY - drag.startY));
            knowledgeWorkspace.dataset.offsetX = String(x);
            knowledgeWorkspace.dataset.offsetY = String(y);
            knowledgeWorkspace.style.transform = `translate(${x}px, ${y}px)`;
          });
          const finish = (event) => {
            if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
            drag = null;
            knowledgeWorkspace.classList.remove('dragging');
          };
          listen(handle, 'pointerup', finish);
          listen(handle, 'pointercancel', finish);
        }
        function saveConversationPreferences() {
          const current = activeConversation();
          current.conversationInstructions = conversationInstructions.value.trim().slice(0, 2000);
          current.responseStyle = conversationResponseStyle.value;
          saveState();
          closeConversationPreferencesModal();
          render(false);
          showToast('对话偏好已保存。');
        }
        async function exportState() {
          const current = activeConversation();
          if (!current) { showToast('当前没有可导出的对话。'); return; }
          const now = new Date();
          const pad = (value) => String(value).padStart(2, '0');
          const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
          const safeTitle = String(current.title || '未命名对话').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\s+/g, '-').slice(0, 36) || '未命名对话';
          const filename = `personal-agent-${safeTitle}-${timestamp}.json`;
          const backup = {
            format: 'personal-agent-conversation-backup',
            version: 1,
            scope: 'conversation',
            exportedAt: new Date().toISOString(),
            account: { id: authUser?.id || null, username: authUser?.username || '' },
            state: { conversations: [current], activeId: current.id },
          };
          const content = JSON.stringify(backup, null, 2);
          try {
            if (window.pywebview?.api?.save_backup_json) {
              const result = await window.pywebview.api.save_backup_json(filename, content);
              if (result?.cancelled) return;
              if (!result?.success) throw new Error(result?.message || '保存备份失败');
              showToast(`当前对话 JSON 已保存到：${result.path}`);
              return;
            }
            const blob = new Blob([content], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
            showToast('当前运行方式不支持系统保存对话框，已使用浏览器下载。');
          } catch (error) { showToast(error.message || '导出失败'); }
        }
        async function importState(file) {
          if (!file) return;
          try {
            const parsed = JSON.parse(await file.text());
             if (Array.isArray(parsed?.items) && !parsed?.conversations && !parsed?.state) throw new Error('所选文件是测试数据清单，不是对话备份。请先点击“导出当前对话 JSON”，再选择由本软件生成的 JSON 文件。');
            const restoredState = parsed?.format === 'personal-agent-conversation-backup' ? parsed.state : parsed;
             if (!restoredState || !Array.isArray(restoredState.conversations) || !restoredState.conversations.length) throw new Error('该 JSON 不是有效的对话备份：未找到 conversations。请使用“导出当前对话 JSON”生成的文件。');
            const incoming = restoredState.conversations.filter((item) => item && item.id && Array.isArray(item.messages)).map((item) => ({ ...newConversation(), ...item, files: Array.isArray(item.files) ? item.files : [], knowledgeBaseIds: Array.isArray(item.knowledgeBaseIds) ? item.knowledgeBaseIds : [], executionMode: ['auto', 'plan'].includes(item.executionMode) ? item.executionMode : 'auto', chatModelId: typeof item.chatModelId === 'string' ? item.chatModelId : '', conversationInstructions: typeof item.conversationInstructions === 'string' ? item.conversationInstructions : '', responseStyle: ['balanced', 'concise', 'structured', 'coach'].includes(item.responseStyle) ? item.responseStyle : 'balanced', draft: typeof item.draft === 'string' ? item.draft : '', pinned: item.pinned === true, archived: item.archived === true }));
            if (!incoming.length) throw new Error('备份中没有结构有效的对话记录。');
            const byId = new Map(state.conversations.map((item) => [item.id, item])); incoming.forEach((item) => byId.set(item.id, item)); state.conversations = [...byId.values()]; state.activeId = restoredState.activeId && byId.has(restoredState.activeId) ? restoredState.activeId : incoming[0].id; saveState(); render(); refreshAttachments(); showToast(`已恢复 ${incoming.length} 个对话。`);
          } catch (error) { showToast(error.message || '备份文件无法读取'); }
          finally { stateImportInput.value = ''; }
        }
        function conversationById(id) { return state.conversations.find((item) => item.id === id); }
        function activeConversation() { return conversationById(state.activeId) || state.conversations[0]; }
        function conversationMatches(conversation, query) {
          if (!query) return true;
          const haystack = [conversation.title, conversation.conversationInstructions || '', ...(conversation.messages || []).map((message) => message.content || '')].join(' ').toLowerCase();
          return haystack.includes(query.toLowerCase());
        }
        function visibleConversations() {
          const query = conversationSearch?.value?.trim() || '';
          return state.conversations
            .filter((conversation) => Boolean(conversation.archived) === showArchivedConversations)
            .filter((conversation) => conversationMatches(conversation, query))
            .sort((left, right) => Number(right.pinned) - Number(left.pinned));
        }
        function render(scrollToEnd = true) {
          closeCodeViewer();
          document.body.classList.remove('code-block-expanded');
          const current = activeConversation();
          state.activeId = current.id;
          const hasConversationPreferences = Boolean(current.conversationInstructions?.trim()) || current.responseStyle !== 'balanced';
          openConversationPreferences.classList.toggle('active', hasConversationPreferences);
          openConversationPreferences.textContent = hasConversationPreferences ? '⚙ 对话偏好 · 已设' : '⚙ 对话偏好';
          const visible = visibleConversations();
          const viewTotal = state.conversations.filter((item) => Boolean(item.archived) === showArchivedConversations).length;
          conversationCount.textContent = `${visible.length}/${viewTotal}`;
          toggleArchived.textContent = showArchivedConversations ? '返回对话' : '显示归档';
          toggleArchived.title = showArchivedConversations ? '返回未归档对话' : '只显示已归档对话';
          toggleArchived.setAttribute('aria-pressed', String(showArchivedConversations));
          toggleArchived.classList.toggle('active', showArchivedConversations);
          workspace.conversations = structuredClone(visible);
          welcome.hidden = current.messages.length > 0;
          workspace.current = structuredClone(current);
          renderAttachments(current);
          renderKnowledgeBases();
          renderComposerContext();
          renderChatModelStatus();
          renderContextLens();
          question.value = current.draft || '';
          executionMode.textContent = current.executionMode === 'plan' ? '计划模式' : '自动执行';
          executionMode.classList.toggle('plan', current.executionMode === 'plan');
          executionMode.title = current.executionMode === 'plan' ? '计划模式：先拆解与审批，不直接写入' : '自动执行：按需调用本地工具';
          resizeComposer();
          saveState();
          if (scrollToEnd) requestAnimationFrame(() => { chatBody.scrollTop = chatBody.scrollHeight; });
        }
        
        function renderAttachments(conversation) {
          const pendingNames = new Set(conversation.pendingAttachmentNames || []);
          const files = (conversation.files || []).filter((file) => pendingNames.has(file.filename));
          selectedFiles = new Set([...selectedFiles].filter((name) => files.some((file) => file.filename === name)));
          const uploading = attachmentUploads.has(conversation.id);
          attachmentPanel.hidden = !files.length && !loadingAttachments && !uploading;
          attachmentCount.textContent = uploading ? '· 图片/文件上传中，请稍候…' : (files.length ? `· ${files.length} 个` : (loadingAttachments ? '· 正在加载…' : ''));
          workspace.attachments = structuredClone(files);
          workspace.selectedFiles = [...selectedFiles];
          deleteSelected.disabled = selectedFiles.size === 0;
          deleteSelected.textContent = selectedFiles.size ? `删除已选 (${selectedFiles.size})` : '删除已选';
        }
        async function openConversationFile(filename, conversationId = state.activeId) {
          if (!filename || !conversationId) return;
          const url = `/api/conversations/${encodeURIComponent(conversationId)}/files/${encodeURIComponent(filename)}`;
          const file = conversationById(conversationId)?.files?.find(item => item.filename === filename);
          if (file?.kind === 'image') { imageViewer.open(url); return; }
          try {
            const response = await fetch(`${url}/open`, { method: 'POST' });
            if (response.ok) return;
            const data = await response.json().catch(() => ({}));
            if (response.status === 404) throw new Error('附件文件已不存在。对话JSON备份只保存消息记录，不能恢复被删除的附件，请重新上传原文件。');
            if (response.status !== 400 && response.status !== 403) throw new Error(data.detail || '无法打开附件');
            const opened = window.open(url, '_blank', 'noopener');
            if (!opened) window.location.href = url;
          } catch (error) { showToast(error.message || '无法打开附件'); }
        }
        function renderComposerContext() {
          const current = activeConversation();
          const selected = (current.knowledgeBaseIds || []).map(knowledgeBaseById).filter(Boolean);
          composerContext.hidden = selected.length === 0;
          composerContext.innerHTML = selected.length ? `<span class="composer-context-label">本次引用：</span>${selected.map((base) => `<span class="composer-context-chip">▤ ${escapeHtml(base.name)}<button data-remove-composer-kb="${base.id}" type="button" aria-label="移除 ${escapeAttribute(base.name)}">×</button></span>`).join('')}` : '';
        }
        function renderContextLens() {
          if (!contextLensBody) return;
          const current = activeConversation();
          const userMessages = (current.messages || []).filter((message) => message.role === 'user');
          const assistantMessages = (current.messages || []).filter((message) => message.role === 'assistant');
          const latestUser = userMessages[userMessages.length - 1];
          const latestText = latestUser?.content?.replace(/\s+/g, ' ').trim() || '';
          const selectedBases = (current.knowledgeBaseIds || []).map(knowledgeBaseById).filter(Boolean);
          const files = current.files || [];
          const toolCount = assistantMessages.reduce((total, message) => total + (message.toolsUsed || []).length, 0);
          const focus = latestText ? latestText.slice(0, 150) : '还没有形成当前焦点，先输入一个想推进的问题。';
          const suggestions = [];
          if (!latestText) {
            suggestions.push('帮我把今天想完成的事情拆成三个最小行动');
          } else if (/总结|整理|提炼|归纳|重点/.test(latestText)) {
            suggestions.push('把刚才的内容提炼成 3 个可执行行动');
            suggestions.push('指出其中最容易被忽略的一个风险');
          } else if (/学习|计划|练习|复习/.test(latestText)) {
            suggestions.push('把这个目标拆成今天 30 分钟可以完成的步骤');
            suggestions.push('根据刚才的内容生成一个复盘问题');
          } else if (selectedBases.length) {
            suggestions.push('只根据当前引用资料，给出 3 个关键结论');
            suggestions.push('从当前资料中找出还需要补充的信息');
          } else {
            suggestions.push('帮我梳理这次对话的重点和下一步');
            suggestions.push('用一个反例检查刚才的结论');
          }
          if (latestText.includes('问题') && !suggestions.includes('列出这个问题的可能原因和验证顺序')) suggestions.push('列出这个问题的可能原因和验证顺序');
          const uniqueSuggestions = [...new Set(suggestions)].slice(0, 3);
          const baseChips = selectedBases.length
            ? selectedBases.map((base) => `<span class="lens-chip">▤ ${escapeHtml(base.name)} · ${base.document_count} 文档</span>`).join('')
            : '<span class="lens-chip muted">本轮未选择知识库</span>';
          const fileChips = files.length
            ? files.slice(0, 5).map((file) => `<span class="lens-chip">⌇ ${escapeHtml(file.filename)}</span>`).join('')
            : '<span class="lens-chip muted">本轮没有附件</span>';
          contextLensBody.innerHTML = `<div class="lens-focus"><span class="lens-eyebrow">当前焦点</span><p>${escapeHtml(focus)}</p></div><div class="lens-stats"><div class="lens-stat"><b>${userMessages.length}</b><small>我的输入</small></div><div class="lens-stat"><b>${assistantMessages.length}</b><small>助手回应</small></div><div class="lens-stat"><b>${toolCount}</b><small>工具动作</small></div></div><section class="lens-section"><div class="lens-section-title"><span>引用资料</span><small>${selectedBases.length} 个知识库</small></div><div class="lens-chip-list">${baseChips}</div></section><section class="lens-section"><div class="lens-section-title"><span>随行附件</span><small>${files.length} 个文件</small></div><div class="lens-chip-list">${fileChips}${files.length > 5 ? `<span class="lens-chip muted">另有 ${files.length - 5} 个</span>` : ''}</div></section><section class="lens-section"><div class="lens-section-title"><span>下一步</span><small>点击即发送到当前对话</small></div><div class="lens-next-list">${uniqueSuggestions.map((prompt) => `<button class="lens-next" data-lens-prompt="${escapeAttribute(prompt)}" type="button">${escapeHtml(prompt)}　↗</button>`).join('')}</div></section>`;
        }
        function renderComposerKnowledgePicker() {
          const selected = new Set(activeConversation().knowledgeBaseIds || []);
          composerKnowledgeList.innerHTML = knowledgeBases.length ? `<div class="composer-knowledge-list">${knowledgeBases.map((base) => `<button class="composer-knowledge-option${selected.has(base.id) ? ' selected' : ''}" data-composer-kb="${base.id}" type="button" aria-pressed="${selected.has(base.id)}"><span>▤ ${escapeHtml(base.name)}</span><small>${base.document_count} 个文档</small></button>`).join('')}</div>` : '<div class="composer-knowledge-empty">还没有知识库，请先创建一个。</div><button class="composer-manage-kb" data-composer-create-kb type="button">＋ 新建知识库</button>';
        }
        function setComposerTools(open) {
          composerTools.hidden = !open;
          if (!open) { composerToolMain.hidden = false; composerKnowledgePicker.hidden = true; }
        }
        function addMessage(message, conversationId = state.activeId) {
          const conversation = conversationById(conversationId);
          if (!conversation) return null;
          const item = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...message };
          conversation.messages.push(item);
          if (message.role === 'user' && conversation.title === '新对话') conversation.title = String(message.content || '').replace(/\s+/g, ' ').slice(0, 18) || (message.attachments?.[0] ? `附件 · ${message.attachments[0]}`.slice(0, 18) : '新对话');
          if (state.activeId === conversationId) render(); else saveState();
          return item.id;
        }
        function updateMessage(conversationId, messageId, patch) {
          const message = conversationById(conversationId)?.messages.find((item) => item.id === messageId);
          if (!message) return;
          Object.assign(message, patch);
          if (state.activeId === conversationId) render(); else saveState();
        }
        async function saveMessageAsNote(messageId) {
          const conversation = activeConversation();
          const message = conversation.messages.find((item) => item.id === messageId);
          if (!message || (!message.content && !message.images?.length)) return;
          const suggested = message.content.replace(/\s+/g, ' ').trim().slice(0, 28) || '对话结论';
          const title = window.prompt('笔记标题', suggested);
          if (title === null) return;
          if (!title.trim()) { showToast('笔记标题不能为空。'); return; }
          const session = authSessionVersion;
          try {
            const images = [];
            for (const image of message.images || []) {
              images.push(await storeImage(image));
              if (session !== authSessionVersion) return;
            }
            const content = [message.content || '', ...images.map((source, index) => `![生成图片 ${index + 1}](${source})`)].filter(Boolean).join('\n\n');
            const response = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim(), content }) });
            const data = await response.json();
            if (session !== authSessionVersion) return;
            if (!response.ok) throw new Error(data.detail || '保存笔记失败');
            if (images.length) { message.images = images; saveState(); render(false); }
            showToast(`已保存笔记“${data.title || title.trim()}”${images.length ? '（包含图片）' : ''}，可在左侧“我的笔记”中打开。`);
          } catch (error) { showToast(error.message || '保存笔记失败'); }
        }
        function modeLabel(mode) { return mode === 'plan' ? '计划草案' : mode === 'agent' ? 'Agent 工具回答' : mode === 'image' ? '图片生成' : mode === 'llm' ? '模型回答' : '检索式回答'; }
        function prepareInterruptedEdit(userMessageId) {
          const current = activeConversation();
          const message = current.messages.find((item) => item.id === userMessageId && item.role === 'user');
          if (!message) { showToast('未找到要修改的问题。'); return; }
          current.editingMessageId = userMessageId;
          current.draft = '';
          question.value = '';
          saveState();
          render(false);
          requestAnimationFrame(() => messages.querySelector('[data-inline-edit-form] textarea')?.focus());
          showToast('请直接在原问题位置修改，然后重新发送。');
        }
        async function sendMessage(prefilled) {
          const current = activeConversation();
          const content = (typeof prefilled === 'string' ? prefilled : question.value).trim();
          if (sending) return;
          if (attachmentUploads.has(current.id)) { showToast('图片或附件还在上传，请完成后再发送。'); return; }
          if (Array.from(content).length > 1000) { showToast('问题最多1000个字，当前内容超出限制。请缩短文字后发送；原文已保留。附件上传按文件大小限制，不按这1000字限制。'); return; }
          const conversationId = current.id;
          const execution = current.executionMode || 'auto';
          const editingIndex = current.editingMessageId ? current.messages.findIndex((message) => message.id === current.editingMessageId && message.role === 'user') : -1;
          const pendingAttachmentNames = (current.pendingAttachmentNames || []).filter((name) => (current.files || []).some((file) => file.filename === name));
          const originalAttachments = editingIndex >= 0 && Array.isArray(current.messages[editingIndex].attachments) ? current.messages[editingIndex].attachments : [];
          const attachmentFilenames = [...new Set([...originalAttachments, ...pendingAttachmentNames])];
          if (attachmentFilenames.length > 8 || attachmentFilenames.filter(name => isImageFile({ name })).length > 4) { showToast('每条消息最多发送 8 个附件，其中最多 4 张图片。请移除多余附件后发送。'); return; }
          if (!content && !attachmentFilenames.length) { showToast('请输入消息，或添加至少一个附件。'); return; }
          const requestQuestion = content || '请阅读并说明随本条消息发送的附件内容。';
          const historyMessages = editingIndex >= 0 ? current.messages.slice(0, editingIndex) : current.messages;
          const history = buildChatHistory(historyMessages);
          const knowledgeBaseIds = current.knowledgeBaseIds || [];
          const requestedChatModelId = current.chatModelId || defaultChatModelId || '';
          sending = true; activeRequestController = new AbortController(); ask.disabled = false; ask.textContent = '■'; ask.title = '停止生成';
          current.draft = '';
          current.pendingAttachmentNames = (current.pendingAttachmentNames || []).filter((name) => !attachmentFilenames.includes(name));
          selectedFiles = new Set();
          if (!prefilled) question.value = '';
          resizeComposer();
          let userMessageId = '';
          if (editingIndex >= 0) {
            const userMessage = current.messages[editingIndex];
            userMessage.content = content;
            userMessage.attachments = attachmentFilenames;
            userMessageId = userMessage.id;
            current.messages = current.messages.slice(0, editingIndex + 1);
            current.editingMessageId = '';
            render();
          } else {
            userMessageId = addMessage({ role: 'user', content, attachments: attachmentFilenames }, conversationId);
          }
          const messageId = addMessage({ role: 'assistant', content: '', mode: execution === 'plan' ? '正在制定计划…' : '正在思考…', streaming: true, plan: execution === 'plan', question: requestQuestion }, conversationId);
          try {
            const response = await fetch('/api/ask/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: activeRequestController.signal, body: JSON.stringify({ question: requestQuestion, history, conversation_id: conversationId, attachment_filenames: attachmentFilenames, knowledge_base_ids: knowledgeBaseIds, execution_mode: execution, chat_model_id: requestedChatModelId, conversation_instructions: current.conversationInstructions || '', response_style: current.responseStyle || 'balanced' }) });
            await consumeSSE(response, (event) => {
              if (event.type === 'status') updateMessage(conversationId, messageId, { mode: event.content, streaming: true });
              if (event.type === 'meta') {
                const mismatch = requestedChatModelId && event.model_id && requestedChatModelId !== event.model_id && !event.fallback_used;
                const warning = mismatch ? `模型校验失败：请求使用 ${requestedChatModelId}，后台实际解析为 ${event.model_id}。` : event.warning;
                updateMessage(conversationId, messageId, { mode: modeLabel(event.mode), toolsUsed: event.tools_used, trace: event.trace || [], sources: event.sources, images: event.images || [], warning, modelId: event.model_id, provider: event.provider, model: event.model, answerOrigin: event.answer_origin, knowledgeUsed: event.knowledge_used === true, knowledgeBaseIds: event.knowledge_base_ids || [], streaming: true });
              }
              if (event.type === 'delta') { const item = conversationById(conversationId)?.messages.find((message) => message.id === messageId); updateMessage(conversationId, messageId, { content: `${item?.content || ''}${event.content}` }); }
              if (event.type === 'done') updateMessage(conversationId, messageId, { streaming: false });
              if (event.type === 'error') updateMessage(conversationId, messageId, { content: `暂时无法完成这次请求：${event.message}`, warning: '请检查后端服务与模型配置后重试。', streaming: false, mode: '', error: true });
            });
          } catch (error) {
            if (error.name === 'AbortError') {
              const target = conversationById(conversationId);
              if (target) { target.draft = ''; target.editingMessageId = userMessageId; }
              updateMessage(conversationId, messageId, { content: '已暂停生成。请直接修改上方原问题，再从该位置重新发送。', warning: '', streaming: false, mode: '', error: false, interrupted: true, relatedUserMessageId: userMessageId });
              if (state.activeId === conversationId) requestAnimationFrame(() => messages.querySelector('[data-inline-edit-form] textarea')?.focus());
            }
            else updateMessage(conversationId, messageId, { content: `暂时无法完成这次请求：${error.message}`, warning: '请检查后端服务与模型配置后重试。', streaming: false, mode: '', error: true });
          } finally { sending = false; activeRequestController = null; ask.disabled = false; ask.textContent = '↑'; ask.title = '发送'; question.focus(); }
        }
        function buildChatHistory(items) {
          return items.filter((item) => ['user', 'assistant'].includes(item.role) && !item.error && !item.interrupted && !item.streaming).map((item) => {
            let text = String(item.content || '').trim();
            if (!text && item.role === 'user' && item.attachments?.length) text = '历史消息：用户发送了附件，请阅读附件。';
            if (text.length > 12000) text = text.slice(0, 6000) + '\n[较长历史内容已省略中间部分]\n' + text.slice(-5900);
            return { role: item.role, content: text };
          }).filter((item) => item.content).slice(-10);
        }
        async function consumeSSE(response, onEvent) {
          if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.detail || '请求失败'); }
          const reader = response.body?.getReader();
          if (!reader) throw new Error('浏览器不支持流式响应');
          const decoder = new TextDecoder(); let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
            const events = buffer.split('\n\n'); buffer = events.pop() || '';
            events.forEach((raw) => { const line = raw.split('\n').find((item) => item.startsWith('data: ')); if (line) onEvent(JSON.parse(line.slice(6))); });
            if (done) break;
          }
        }
        async function refreshAttachments(conversationId = state.activeId) {
          const conversation = conversationById(conversationId); if (!conversation) return;
          if (state.activeId === conversationId) { loadingAttachments = true; renderAttachments(conversation); }
          try {
            const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/files`);
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取附件');
            const target = conversationById(conversationId);
            if (target) {
              target.files = data.files || [];
              const available = new Set(target.files.map((file) => file.filename));
              target.pendingAttachmentNames = (target.pendingAttachmentNames || []).filter((name) => available.has(name));
            }
          } catch (error) { if (state.activeId === conversationId) showToast(error.message || '无法读取附件'); }
          finally { if (state.activeId === conversationId) { loadingAttachments = false; render(false); } else saveState(); }
        }
        function fileAsBase64(file) {
          return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error(`无法读取 ${file.name}`)); reader.readAsDataURL(file); });
        }
        async function uploadFiles(files) {
          const selected = Array.from(files || []); if (!selected.length) return;
          if (selected.length > 8) { showToast('一次最多上传 8 个文件。'); return; }
          const empty = selected.find((file) => file.size <= 0);
          if (empty) { showToast(`${empty.name} 是空文件，不能上传。`); return; }
          const oversized = selected.find((file) => file.size > (isImageFile(file) ? MAX_CHAT_IMAGE_BYTES : MAX_FILE_BYTES));
          if (oversized) { showToast(`${oversized.name} 超过 ${isImageFile(oversized) ? 16 : 2} MB 限制。`); return; }
          const conversationId = activeConversation().id;
          const sessionVersion = authSessionVersion;
          const previous = attachmentUploads.get(conversationId) || Promise.resolve();
          const job = previous.then(async () => {
          if (sessionVersion !== authSessionVersion || !conversationById(conversationId)) return;
          const current = conversationById(conversationId);
          const pendingNames = new Set(current.pendingAttachmentNames || []);
          const pending = current.files.filter(file => pendingNames.has(file.filename));
          if (pending.length + selected.length > 8 || pending.filter(file => file.kind === 'image').length + selected.filter(isImageFile).length > 4) {
            showToast('每条消息最多发送 8 个附件，其中最多 4 张图片。请先发送或移除待发送附件。'); return;
          }
          try {
            const payload = await Promise.all(selected.map(async (file) => ({ filename: file.name, data_base64: await fileAsBase64(file) })));
            if (sessionVersion !== authSessionVersion) return;
            const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: payload }) });
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '上传失败');
            if (sessionVersion !== authSessionVersion) return;
            const target = conversationById(conversationId);
            if (target) {
              target.files = [...(target.files || []).filter((oldFile) => !(data.files || []).some((file) => file.filename === oldFile.filename)), ...data.files];
              target.pendingAttachmentNames = [...new Set([...(target.pendingAttachmentNames || []), ...data.files.map((file) => file.filename)])];
            }
            if (state.activeId === conversationId) render(false); else saveState();
            if (state.activeId === conversationId) showToast(`已添加 ${data.files.length} 个附件，可继续输入文字后发送。`);
          } catch (error) { if (sessionVersion === authSessionVersion) showToast(error.message || '上传失败，请重新粘贴或选择图片。'); }
          });
          attachmentUploads.set(conversationId, job);
          renderAttachments(activeConversation());
          try { await job; }
          finally {
            if (attachmentUploads.get(conversationId) === job) attachmentUploads.delete(conversationId);
            fileInput.value = '';
            if (sessionVersion === authSessionVersion && state.activeId === conversationId) renderAttachments(activeConversation());
          }
        }
        function pastedImageFiles(blobs) {
          const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
          return blobs.map((blob, index) => new File([blob], `粘贴图片-${Date.now()}-${index + 1}.${extensions[blob.type] || 'png'}`, { type: blob.type }));
        }
        async function deleteFiles(filenames, conversationId = state.activeId) {
          if (!filenames.length) return;
          try {
            const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/files`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filenames }) });
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '删除失败');
            const target = conversationById(conversationId);
            if (target) {
              target.files = (target.files || []).filter((file) => !data.deleted.includes(file.filename));
              target.pendingAttachmentNames = (target.pendingAttachmentNames || []).filter((name) => !data.deleted.includes(name));
            }
            selectedFiles = new Set(); if (state.activeId === conversationId) render(false); else saveState();
            showToast(`已删除 ${data.deleted.length} 个文件。`);
          } catch (error) { showToast(error.message || '删除失败'); }
        }
        let codeViewer = null;
        let codeViewerTrigger = null;
        function closeCodeViewer() {
          if (!codeViewer) return;
          const viewer = codeViewer; codeViewer = null;
          viewer.close(); viewer.remove();
          if (codeViewerTrigger?.isConnected) codeViewerTrigger.focus();
          codeViewerTrigger = null;
        }
        function openCodeViewer(block, trigger) {
          closeCodeViewer();
          const viewer = document.createElement('dialog');
          viewer.className = 'code-viewer'; viewer.setAttribute('aria-label', '代码全屏查看');
          const copy = document.createElement('section'); copy.className = 'code-block';
          const toolbar = document.createElement('div'); toolbar.className = 'code-block-toolbar';
          const title = block.querySelector('.code-block-title').cloneNode(true);
          title.querySelector('.code-block-chevron')?.remove();
          toolbar.append(title, block.querySelector('.code-block-actions').cloneNode(true));
          copy.append(toolbar, block.querySelector('.code-block-body').cloneNode(true));
          const expand = copy.querySelector('[data-expand-code]');
          if (expand) { expand.title = '关闭全屏'; expand.setAttribute('aria-label', '关闭全屏'); }
          viewer.append(copy); document.body.append(viewer); codeViewer = viewer; codeViewerTrigger = trigger;
          listen(viewer, 'cancel', event => { event.preventDefault(); closeCodeViewer(); });
          listen(viewer, 'click', event => {
            if (event.target === viewer || event.target.closest('[data-expand-code]')) { event.preventDefault(); closeCodeViewer(); return; }
            const button = event.target.closest('[data-copy-code]');
            if (button) { event.preventDefault(); copyPlainText(copy.querySelector('code')?.textContent || ''); }
          });
          viewer.showModal(); expand?.focus();
        }
        let deletionDialog = null;
        function confirmConversationDeletion(title, options = {}) {
          if (deletionDialog) return Promise.resolve(false);
          return new Promise(resolve => {
            const dialog = document.createElement('dialog'); deletionDialog = dialog; dialog.className = 'delete-conversation-dialog';
            dialog.setAttribute('aria-label', options.heading || '确认删除对话');
            const heading = document.createElement('h2'); heading.textContent = options.heading || '删除这个对话？';
            const description = document.createElement('p'); description.textContent = options.description || `“${title}”的消息和附件将被删除。导出的JSON只保存消息记录，不能恢复已删除的附件文件。`;
            const actions = document.createElement('div'); actions.className = 'delete-conversation-actions';
            const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = '取消';
            const confirm = document.createElement('button'); confirm.type = 'button'; confirm.textContent = options.action || '确认删除'; confirm.className = 'confirm-delete';
            const finish = result => { dialog.close(); dialog.remove(); deletionDialog = null; resolve(result); };
            listen(cancel, 'click', () => finish(false)); listen(confirm, 'click', () => finish(true));
            listen(dialog, 'cancel', event => { event.preventDefault(); finish(false); });
            actions.append(cancel, confirm); dialog.append(heading, description, actions); document.body.append(dialog); dialog.showModal(); cancel.focus();
          });
        }
        async function deleteConversation(conversationId) {
          const target = conversationById(conversationId);
          if (!target || !(await confirmConversationDeletion(target.title || '新对话'))) return;
          const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
          if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.detail || '删除对话失败'); }
          state.conversations = state.conversations.filter((item) => item.id !== conversationId);
          if (!state.conversations.length) state.conversations.push(newConversation());
          if (state.activeId === conversationId) state.activeId = state.conversations[0].id;
          selectedFiles = new Set(); render(); refreshAttachments(state.activeId);
        }
        function renameConversation(conversationId) {
          const conversation = conversationById(conversationId);
          if (!conversation) return;
          const nextTitle = window.prompt('给这段对话起一个名字', conversation.title || '新对话');
          if (nextTitle === null) return;
          const title = nextTitle.trim().slice(0, 60);
          if (!title) { showToast('对话名称不能为空。'); return; }
          conversation.title = title;
          saveState();
          render(false);
        }
        function toggleConversationPin(conversationId) {
          const conversation = conversationById(conversationId);
          if (!conversation) return;
          conversation.pinned = !conversation.pinned;
          saveState();
          render(false);
          showToast(conversation.pinned ? '对话已固定到顶部。' : '已取消固定。');
        }
        function toggleConversationArchive(conversationId) {
          const conversation = conversationById(conversationId);
          if (!conversation) return;
          conversation.archived = !conversation.archived;
          if (state.activeId === conversationId && conversation.archived !== showArchivedConversations) {
            const next = state.conversations.find((item) => item.id !== conversationId && item.archived === showArchivedConversations);
            if (next) state.activeId = next.id;
          }
          saveState();
          render(false);
          refreshAttachments(state.activeId);
          showToast(conversation.archived ? '对话已归档，可在侧栏显示归档后找回。' : '对话已移出归档。');
        }
        function currentChatModel() {
          const currentId = activeConversation()?.chatModelId || defaultChatModelId;
          return chatModels.find((item) => item.id === currentId) || chatModels[0] || null;
        }
        function renderChatModelStatus() {
          const model = currentChatModel();
          if (!model) { modelStatus.textContent = '选择大模型'; return; }
          modelStatus.textContent = `${model.provider || '模型服务'} · ${model.model || model.name}${model.configured ? '' : '（未配置）'}`;
          modelStatus.title = model.configured ? `当前模型：${model.name || model.model}，点击切换` : `模型尚未配置 API Key，点击查看设置`;
        }
        function updateImageGenerationAction() {
          if (!generateImageAction) return;
          const model = currentChatModel();
          const supported = Boolean(model?.configured && /z[-_ ]?image|qwen[-_ ]?image|wan|flux|stable[-_ ]?diffusion|sdxl|文生图|图片生成/i.test(`${model.provider || ''} ${model.model || ''}`));
          generateImageAction.disabled = !supported;
          generateImageAction.classList.toggle('muted', !supported);
          const hint = generateImageAction.querySelector('small');
          if (hint) hint.textContent = supported ? '使用当前图片模型生成' : '需要配置图片模型';
        }
        function renderChatModelPicker() {
          const selectedId = activeConversation()?.chatModelId || defaultChatModelId;
          chatModelList.innerHTML = chatModels.length ? chatModels.map((model) => {
            const selected = model.id === selectedId;
            const configured = model.configured;
            const status = configured ? (selected ? '✓ 当前使用' : '已配置') : '未配置';
            return `<button class="chat-model-option ${selected ? 'selected ' : ''}${configured ? '' : 'unconfigured'}" data-chat-model="${escapeAttribute(model.id)}" type="button" aria-pressed="${selected}"><span><span class="chat-model-name">${escapeHtml(model.name || model.model)}</span><small class="chat-model-provider">${escapeHtml(model.provider || '')} · ${escapeHtml(model.model || '')}</small></span><span class="chat-model-status ${configured ? 'ready' : ''}">${status}</span></button>`;
          }).join('') : '<div class="lens-empty">还没有可用模型，请先添加一个自定义模型服务。</div>';
        }
        function setModelPicker(open) {
          modelPicker.hidden = !open;
          modelStatus.classList.toggle('active', open);
          modelStatus.setAttribute('aria-expanded', String(open));
          if (open) renderChatModelPicker();
        }
        function selectChatModel(modelId) {
          const model = chatModels.find((item) => item.id === modelId);
          if (!model) return;
          activeConversation().chatModelId = modelId;
          saveState();
          setModelPicker(false);
          render(false);
          updateImageGenerationAction();
          showToast(model.configured ? `已切换到 ${model.provider || '模型服务'} / ${model.model || model.name}；下一条回答会显示实际模型。` : `已选择 ${model.name || model.model}，但尚未配置，暂时无法用于对话。`);
        }
        async function loadChatModels(expectedSession = authSessionVersion, expectedUserId = String(authUser?.id || '')) {
          try {
            const response = await fetch('/api/chat-models', { cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || '无法读取大模型列表');
            const statusResponse = await fetch('/api/model', { cache: 'no-store' });
            const status = await statusResponse.json();
            if (expectedSession !== authSessionVersion || String(authUser?.id || '') !== expectedUserId) return;
            chatModels = Array.isArray(data) ? data : [];
            const aliases = { 'deepseek-v4-flash': 'deepseek', 'deepseek-chat': 'deepseek', 'gpt-4o-mini': 'openai', 'qwen-plus': 'qwen' };
            defaultChatModelId = aliases[status.model_id] || status.model_id || chatModels[0]?.id || '';
            let migrated = false;
            state.conversations.forEach((conversation) => {
              if (conversation.chatModelId && aliases[conversation.chatModelId]) { conversation.chatModelId = aliases[conversation.chatModelId]; migrated = true; }
              if (conversation.chatModelId && !chatModels.some((item) => item.id === conversation.chatModelId)) { conversation.chatModelId = ''; migrated = true; }
            });
            if (migrated) saveState();
            renderChatModelStatus();
            updateImageGenerationAction();
            if (!modelPicker.hidden) renderChatModelPicker();
          } catch (error) { modelStatus.textContent = '本地 Agent'; showToast(error.message || '无法读取大模型列表'); }
        }
        async function loadModelStatus(expectedSession = authSessionVersion, expectedUserId = String(authUser?.id || '')) { await loadChatModels(expectedSession, expectedUserId); }
        function modelServiceProviderGroups(services = modelServices) {
          const groups = new Map();
          services.forEach((service) => {
            const name = String(service.name || '未命名服务商').trim() || '未命名服务商';
            const key = name.toLocaleLowerCase();
            if (!groups.has(key)) groups.set(key, { key, name, services: [] });
            groups.get(key).services.push(service);
          });
          return [...groups.values()].map((group) => ({
            ...group,
            models: group.services.filter((service) => !service.provider_only),
            configured: group.services.some((service) => !service.provider_only && service.configured),
            custom: group.services.every((service) => service.custom),
            providerType: group.services.find((service) => service.provider_only)?.service_type || group.services[0]?.service_type || '综合服务',
          }));
        }
        function providerIconLabel(name = '') {
          const normalized = String(name).trim().toLowerCase();
          const known = [
            [/deepseek/, 'DS'], [/openai|chatgpt/, 'AI'], [/qwen|dashscope|通义/, 'QW'],
            [/ollama/, 'OL'], [/lm\s*studio/, 'LM'], [/anthropic|claude/, 'AN'],
            [/google|gemini/, 'GG'], [/siliconflow|baai/, 'SF'], [/cohere/, 'CO'],
            [/jina/, 'JI'], [/mineru/, 'MI'], [/unstructured/, 'UN'], [/llamacloud/, 'LA'], [/voyage/, 'VA'],
          ];
          const matched = known.find(([pattern]) => pattern.test(normalized));
          if (matched) return matched[1];
          const compact = String(name).trim().replace(/\s+/g, '');
          return (/^[\u4e00-\u9fff]/.test(compact) ? compact.slice(0, 1) : compact.slice(0, 2).toUpperCase()) || 'AI';
        }
        function activeModelProvider(groups = modelServiceProviderGroups()) {
          return groups.find((group) => group.services.some((service) => service.id === activeModelServiceId)) || null;
        }
        function renderModelServices() {
          const directoryScrollTop = modelServiceDirectory.scrollTop;
          const previousProviderKey = modelServiceList.dataset.providerKey;
          const modelScrollTop = modelServiceList.querySelector('.provider-model-list')?.scrollTop || 0;
          const query = (modelServiceSearch.value || '').trim().toLowerCase();
          const groups = modelServiceProviderGroups();
          const visible = groups.filter((group) => !query || `${group.name} ${group.services.map((service) => `${service.description} ${service.model} ${service.service_type}`).join(' ')}`.toLowerCase().includes(query));
          if (!activeModelServiceId || !modelServices.some((service) => service.id === activeModelServiceId)) activeModelServiceId = visible[0]?.services[0]?.id || groups[0]?.services[0]?.id || '';
          if (query && !visible.some((group) => group.services.some((service) => service.id === activeModelServiceId))) activeModelServiceId = visible[0]?.services[0]?.id || '';
          const activeGroup = activeModelProvider(groups);
          modelServiceDirectory.innerHTML = visible.map((group) => {
            const representative = group.services[0];
            const active = group === activeGroup;
            return `<button class="model-service-item ${active ? 'active ' : ''}${group.configured ? 'configured ' : ''}${group.custom ? 'custom' : ''}" data-provider-select="${escapeAttribute(representative.id)}" type="button"><span class="service-icon provider-logo" aria-hidden="true">${escapeHtml(providerIconLabel(group.name))}</span><span class="service-name">${escapeHtml(group.name)}<small>${group.models.length} 个模型 · ${escapeHtml(group.providerType)}</small></span><span class="service-dot"></span></button>`;
          }).join('') || '<p class="settings-empty">没有匹配的服务商</p>';
          modelServiceDirectory.scrollTop = directoryScrollTop;
          if (!activeGroup) { modelServiceHeading.textContent = '模型服务'; modelServiceDescription.textContent = '请先添加一个服务商'; modelServiceList.innerHTML = '<p class="settings-empty">暂时没有可配置的模型服务。</p>'; delete modelServiceList.dataset.providerKey; return; }
          const representative = activeGroup.services.find((service) => service.provider_only) || activeGroup.services[0];
          modelServiceHeading.textContent = activeGroup.name;
          modelServiceDescription.textContent = `${activeGroup.models.length} 个模型 · ${activeGroup.providerType}`;
          const providerToolbar = `<div class="model-provider-toolbar"><div><strong>${escapeHtml(activeGroup.name)}</strong><small>左侧管理服务商，右侧管理该服务商下的模型连接</small></div><div class="model-provider-actions"><button data-provider-edit type="button">编辑服务商</button><button data-provider-add-model type="button">＋ 添加模型</button><button class="service-danger" data-provider-delete type="button">删除服务商</button></div></div>`;
          const models = activeGroup.models.map((service) => `<article class="service-card ${service.configured ? 'configured' : ''}" data-service-id="${escapeAttribute(service.id)}"><div><div class="model-card-heading"><h4>${escapeHtml(service.model || service.service_type || '未命名模型')}</h4><span class="model-origin-badge">${service.custom ? '自定义' : '内置'}</span></div><p>${escapeHtml(service.description || '')}</p><p>${escapeHtml(service.service_type || '模型服务')} · ${escapeHtml(activeGroup.name)}</p></div><div class="service-fields"><label>API Key<div class="secret-field"><input data-service-key class="secret-input-masked" name="agent-provider-token-${escapeAttribute(service.id)}" type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" spellcheck="false" value="${service.configured ? '••••••••••••' : ''}" data-key-loaded="false" /><button class="secret-toggle" data-service-reveal type="button" aria-label="显示 API Key" title="显示/隐藏 API Key">◉</button></div></label><label>完整 API 接口地址<input data-service-url name="provider-api-url-${escapeAttribute(service.id)}" type="url" autocomplete="off" data-lpignore="true" data-1p-ignore="true" value="${escapeAttribute(service.endpoint_url || service.base_url || service.default_base_url || '')}" /></label><small class="form-help">模型标识与完整接口地址共同决定具体调用。</small><footer><span class="service-status ${service.configured ? 'ready' : ''}">${service.configured ? `✓ 已配置 ${escapeHtml(service.api_key_hint || '')}` : '未配置'}</span><span><button class="service-edit" data-model-edit type="button">编辑模型</button> <button class="service-clear" data-service-clear type="button" ${service.configured ? '' : 'disabled'}>清除 Key</button> <button class="service-danger" data-model-delete type="button">删除模型</button> <button class="service-save" data-service-save type="button">保存连接</button></span></footer></div></article>`).join('');
          modelServiceList.innerHTML = `${providerToolbar}<div class="provider-model-list">${models || settingsEmpty('＋', '该服务商还没有模型', '点击“添加模型”，选择服务商并填写模型连接资料。')}</div>`;
          modelServiceList.dataset.providerKey = activeGroup.key;
          if (previousProviderKey === activeGroup.key) modelServiceList.querySelector('.provider-model-list').scrollTop = modelScrollTop;
        }
        async function refreshModelServices(expectedSession = authSessionVersion, expectedUserId = String(authUser?.id || '')) {
          const revision = ++modelServicesRevision;
          try {
            const [servicesResponse, catalogResponse] = await Promise.all([
              fetch('/api/model-services', { cache: 'no-store' }),
              fetch('/api/model-catalog', { cache: 'no-store' }),
            ]);
            const [data, catalog] = await Promise.all([servicesResponse.json(), catalogResponse.json()]);
            if (!servicesResponse.ok || !catalogResponse.ok) throw new Error(data.detail || catalog.detail || '无法读取模型服务');
            if (revision !== modelServicesRevision || expectedSession !== authSessionVersion || String(authUser?.id || '') !== expectedUserId) return;
            modelServices = Array.isArray(data) ? data : [];
            knowledgeModelOptions = catalog.models || {};
            renderModelServices();
            syncKnowledgeModelOptions();
          } catch (error) {
            if (revision === modelServicesRevision && expectedSession === authSessionVersion && String(authUser?.id || '') === expectedUserId) showToast(error.message || '无法读取模型服务');
          }
        }
        function knowledgeModelChoices(field) {
          const kind = field === 'embedding_model' ? 'embedding' : field;
          const local = {
            document_processor: { id: '内置文本解析', name: '内置文本解析' },
            embedding: { id: '本地关键词检索', name: '不使用（本地关键词检索）' },
            reranker: { id: '不使用', name: '不使用' },
          };
          const choices = knowledgeModelOptions?.[kind];
          return Array.isArray(choices) && choices.length ? choices : [local[kind]];
        }
        function knowledgeModelOptionsHtml(field, selected) {
          return knowledgeModelChoices(field).map((item) => `<option value="${escapeAttribute(item.id)}" ${item.id === selected ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('');
        }
        function syncKnowledgeModelOptions() {
          const form = knowledgeSettings.querySelector('#knowledgeSettingsForm');
          const removed = [];
          for (const field of ['document_processor', 'embedding_model', 'reranker']) {
            const choices = knowledgeModelChoices(field);
            const valid = (value) => choices.some((item) => item.id === value);
            for (const base of knowledgeModelOptions ? knowledgeBases : []) {
              if (base.settings && !valid(base.settings[field])) base.settings[field] = choices[0].id;
            }
            const select = form?.elements[field];
            if (select) {
              const previous = select.value;
              select.innerHTML = knowledgeModelOptionsHtml(field, previous);
              if (!valid(previous)) { select.value = choices[0].id; removed.push(field); }
            }
          }
          // Update only model selects, preserving unsaved chunk sizes and Top K.
          const previous = knowledgeEmbedding.value;
          knowledgeEmbedding.innerHTML = knowledgeModelOptionsHtml('embedding_model', previous);
          if (!knowledgeModelChoices('embedding_model').some((item) => item.id === previous)) knowledgeEmbedding.value = '本地关键词检索';
          if (removed.length && form) form.dataset.modelRemoved = 'true';
          updateKnowledgeProviderStatus(form);
          updateKnowledgeCreateHint();
        }
        async function revealModelServiceKey(serviceId, input, toggle = null) {
          if (!input) return;
          if (input.dataset.keyLoaded === 'true') {
            const masked = input.classList.toggle('secret-input-masked');
            if (toggle) toggle.textContent = masked ? '◉' : '◉̸';
            return;
          }
          try {
            const response = await fetch(`/api/model-services/${encodeURIComponent(serviceId)}/reveal-key`, { method: 'POST' });
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取 API Key');
            input.value = data.api_key || ''; input.dataset.keyLoaded = 'true'; input.classList.remove('secret-input-masked');
            if (toggle) toggle.textContent = '◉̸';
          } catch (error) { showToast(error.message || '无法读取 API Key'); }
        }
        async function saveModelService(card, clearApiKey = false) {
          const service = modelServices.find((item) => item.id === card.dataset.serviceId); if (!service) return;
          const keyInput = card.querySelector('[data-service-key]'); const key = keyInput.dataset.keyLoaded === 'true' ? keyInput.value.trim() : ''; const baseUrl = card.querySelector('[data-service-url]').value.trim();
          try { const response = await fetch(`/api/model-services/${encodeURIComponent(service.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: key, base_url: baseUrl, model: service.model || '', enabled: true, clear_api_key: clearApiKey }) }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || '保存模型服务失败'); await refreshModelServices(); await loadChatModels(); showToast(clearApiKey ? 'API Key 已清除。' : '模型服务配置已保存。'); }
          catch (error) { showToast(error.message || '保存模型服务失败'); }
        }
        function updateModelServiceRequirement(mode = 'create') {
          const editing = mode === 'edit';
          const providerMode = editing ? modelServiceEditModal.dataset.mode === 'provider' : modelServiceCreateModal.dataset.mode === 'provider';
          const typeInput = document.querySelector(editing ? '#modelServiceEditType' : '#modelServiceType');
          const modelInput = document.querySelector(editing ? '#modelServiceEditModel' : '#modelServiceModel');
          const label = document.querySelector(editing ? '#modelServiceEditModelLabel' : '#modelServiceModelLabel');
          if (providerMode) { modelInput.required = false; modelInput.setCustomValidity(''); return; }
          const serviceType = typeInput.value;
          const required = ['大模型', '嵌入模型', '重排模型'].includes(serviceType);
          modelInput.required = required;
          modelInput.setCustomValidity('');
          label.textContent = required ? '模型标识（必填）' : '模型标识（可留空）';
          modelInput.placeholder = '';
        }
        function validateModelServiceForm(mode = 'create') {
          const editing = mode === 'edit';
          const form = editing ? modelServiceEditForm : modelServiceCreateForm;
          const providerMode = editing ? modelServiceEditModal.dataset.mode === 'provider' : modelServiceCreateModal.dataset.mode === 'provider';
          const error = document.querySelector(editing ? '#modelServiceEditError' : '#modelServiceCreateError');
          error.textContent = '';
          if (providerMode) {
            const nameInput = document.querySelector(editing ? '#modelServiceEditName' : '#modelServiceName');
            const providerType = document.querySelector(editing ? '#modelServiceEditProviderType' : '#modelServiceProviderType');
            nameInput.setCustomValidity(nameInput.value.trim() ? '' : '请填写服务商名称。');
            providerType.setCustomValidity(providerType.value ? '' : '请选择服务商类型。');
            if (!nameInput.value.trim()) { error.textContent = '请填写服务商名称。'; nameInput.reportValidity(); nameInput.focus(); return false; }
            if (!providerType.value) { error.textContent = '请选择服务商类型。'; providerType.reportValidity(); providerType.focus(); return false; }
            return form.reportValidity();
          }
          const typeInput = document.querySelector(editing ? '#modelServiceEditType' : '#modelServiceType');
          const modelInput = document.querySelector(editing ? '#modelServiceEditModel' : '#modelServiceModel');
          const providerInput = document.querySelector(editing ? '#modelServiceEditProvider' : '#modelServiceProvider');
          const urlInput = document.querySelector(editing ? '#modelServiceEditUrl' : '#modelServiceUrl');
          updateModelServiceRequirement(mode);
          if (!providerInput.value) { error.textContent = '请选择模型所属的服务商。'; providerInput.reportValidity(); providerInput.focus(); return false; }
          if (['大模型', '嵌入模型', '重排模型'].includes(typeInput.value) && !modelInput.value.trim()) {
            error.textContent = '请填写服务商提供的模型标识。';
            modelInput.setCustomValidity(error.textContent);
            modelInput.reportValidity();
            modelInput.focus();
            return false;
          }
          modelInput.setCustomValidity('');
          if (!urlInput.value.trim()) { error.textContent = '请填写完整 API 接口地址。'; urlInput.reportValidity(); urlInput.focus(); return false; }
          return form.reportValidity();
        }
        function providerSelectOptions(selectedId = '') {
          return modelServiceProviderGroups().map((group) => {
            const representative = group.services.find((service) => service.provider_only) || group.services[0];
            return `<option value="${escapeAttribute(representative.id)}" ${group.services.some((service) => service.id === selectedId) ? 'selected' : ''}>${escapeHtml(group.name)}</option>`;
          }).join('');
        }
        function syncBoundedProviderSelect(select) {
          const wrapper = select.closest('.bounded-provider-select');
          const trigger = wrapper.querySelector('.bounded-provider-trigger');
          const list = wrapper.querySelector('.bounded-provider-options');
          const options = [...select.options];
          wrapper.querySelector('.bounded-provider-value').textContent = select.selectedOptions[0]?.textContent || '请选择服务商';
          list.innerHTML = options.map((option, index) => `<button class="bounded-provider-option" type="button" role="option" data-option-index="${index}" aria-selected="${option.selected}">${escapeHtml(option.textContent)}</button>`).join('');
          list.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
        }
        function setupBoundedProviderSelect(select) {
          const wrapper = select.closest('.bounded-provider-select');
          const trigger = wrapper.querySelector('.bounded-provider-trigger');
          const list = wrapper.querySelector('.bounded-provider-options');
          const close = () => { list.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
          const open = () => {
            document.querySelectorAll('.bounded-provider-options').forEach((other) => { other.hidden = true; other.closest('.bounded-provider-select').querySelector('.bounded-provider-trigger').setAttribute('aria-expanded', 'false'); });
            list.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
          };
          listen(trigger, 'click', () => list.hidden ? open() : close());
          listen(trigger, 'keydown', (event) => { if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); (list.querySelector('[aria-selected="true"]') || list.querySelector('[role="option"]'))?.focus(); } });
          listen(list, 'click', (event) => {
            const option = event.target.closest('[data-option-index]');
            if (!option) return;
            select.selectedIndex = Number(option.dataset.optionIndex);
            select.dispatchEvent(new Event('change', { bubbles: true }));
            syncBoundedProviderSelect(select);
            trigger.focus();
          });
          listen(list, 'keydown', (event) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); trigger.focus(); return; }
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const options = [...list.querySelectorAll('[role="option"]')];
            const index = options.indexOf(document.activeElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
            options[next]?.focus();
          });
          listen(document, 'click', (event) => { if (!wrapper.contains(event.target)) close(); });
          listen(select, 'change', () => { wrapper.querySelector('.bounded-provider-value').textContent = select.selectedOptions[0]?.textContent || '请选择服务商'; });
        }
        function selectedProvider(select) {
          const id = select?.value || '';
          return modelServiceProviderGroups().find((group) => group.services.some((service) => service.id === id)) || null;
        }
        function setModelDialogFields(modal, mode, editing = false) {
          const providerMode = mode === 'provider';
          const providerSelector = editing ? '[data-edit-provider-only]' : '[data-provider-only]';
          const modelSelector = editing ? '[data-edit-model-only]' : '[data-model-only]';
          modal.querySelectorAll(providerSelector).forEach((element) => { element.hidden = !providerMode; element.querySelectorAll('input,select').forEach((control) => { control.disabled = !providerMode; }); });
          modal.querySelectorAll(modelSelector).forEach((element) => { element.hidden = providerMode; element.querySelectorAll('input,select').forEach((control) => { control.disabled = providerMode; }); });
        }
        function resetModelServiceCreateDialog(serviceType = '综合服务', provider = null) {
          modelServiceCreateForm.reset();
          const addingModel = Boolean(provider);
          modelServiceCreateModal.dataset.mode = addingModel ? 'model' : 'provider';
          setModelDialogFields(modelServiceCreateModal, addingModel ? 'model' : 'provider');
          modelServiceCreateForm.setAttribute('aria-label', addingModel ? `添加 ${provider.name} 模型` : '添加自定义服务商');
          document.querySelector('#modelServiceCreateTitle').textContent = addingModel ? `添加 ${provider.name} 模型` : '添加服务商';
          document.querySelector('#modelServiceCreateSubtitle').textContent = addingModel ? '选择所属服务商并填写模型连接资料。' : '只需填写名称和类型；模型在右侧单独添加。';
          document.querySelector('#submitModelServiceCreate').textContent = addingModel ? '添加模型' : '添加服务商';
          const nameInput = document.querySelector('#modelServiceName');
          const typeInput = document.querySelector('#modelServiceType');
          const modelInput = document.querySelector('#modelServiceModel');
          const source = provider?.models?.[0] || provider?.services?.find((service) => !service.provider_only) || null;
          const providerSelect = document.querySelector('#modelServiceProvider');
          nameInput.value = addingModel ? provider.name : '';
          document.querySelector('#modelServiceProviderType').value = addingModel ? '' : (serviceType === '综合服务' ? '' : serviceType);
          providerSelect.innerHTML = providerSelectOptions(source?.id || provider?.services?.[0]?.id || '');
          syncBoundedProviderSelect(providerSelect);
          typeInput.value = addingModel ? (source?.service_type || (provider?.providerType === '综合服务' ? '大模型' : provider?.providerType) || '大模型') : '大模型';
          document.querySelector('#modelServiceUrl').value = addingModel ? (source?.endpoint_url || source?.base_url || source?.default_base_url || '') : '';
          document.querySelector('#modelServiceCreateDescription').value = addingModel ? `${provider.name} 模型` : '';
          document.querySelector('#modelServiceCreateError').textContent = '';
          modelInput.value = '';
          const keyInput = document.querySelector('#modelServiceKey');
          keyInput.value = '';
          keyInput.dataset.keyLoaded = 'false';
          keyInput.classList.add('secret-input-masked');
          updateModelServiceRequirement('create');
        }
        function openModelServiceCreateDialog(serviceType = '综合服务', provider = null) {
          resetModelServiceCreateDialog(serviceType, provider);
          modelServiceCreateModal.hidden = false;
          document.querySelector(provider ? '#modelServiceModel' : '#modelServiceName').focus();
        }
        function closeModelServiceCreateDialog() {
          modelServiceCreateModal.hidden = true;
          resetModelServiceCreateDialog();
        }
        function closeModelServiceEditDialog() {
          modelServiceEditModal.hidden = true;
          modelServiceEditForm.reset();
          delete modelServiceEditModal.dataset.builtIn;
          delete modelServiceEditModal.dataset.mode;
          delete modelServiceEditModal.dataset.providerIds;
          document.querySelector('#modelServiceEditError').textContent = '';
        }
        function markModelServiceDraftDirty(card) {
          const status = card?.querySelector('.service-status');
          const saveButton = card?.querySelector('[data-service-save]');
          if (!status || !saveButton) return;
          card.dataset.dirty = 'true';
          status.classList.remove('ready');
          status.classList.add('dirty');
          status.textContent = '有未保存修改（对话仍使用上次保存的配置）';
          saveButton.textContent = '保存修改';
        }
        async function createModelService() {
          if (!validateModelServiceForm('create')) return;
          const addingModel = modelServiceCreateModal.dataset.mode === 'model';
          const provider = addingModel ? selectedProvider(document.querySelector('#modelServiceProvider')) : null;
          const payload = addingModel
            ? { name: provider.name, service_type: document.querySelector('#modelServiceType').value, model: document.querySelector('#modelServiceModel').value.trim(), base_url: document.querySelector('#modelServiceUrl').value.trim(), api_key: document.querySelector('#modelServiceKey').value.trim(), description: document.querySelector('#modelServiceCreateDescription').value.trim(), provider_only: false }
            : { name: document.querySelector('#modelServiceName').value.trim(), service_type: document.querySelector('#modelServiceProviderType').value, model: '', base_url: '', api_key: '', description: '', provider_only: true };
          try {
            const response = await fetch('/api/model-services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '添加服务商失败');
            closeModelServiceCreateDialog(); activeModelServiceId = data.service?.id || ''; await refreshModelServices(); await loadChatModels(); showToast(addingModel ? `模型已添加到 ${provider.name}。` : '服务商已添加，请在右侧继续添加模型。');
          } catch (error) { showToast(error.message || '添加服务商失败'); }
        }
        async function deleteModelService(service) {
          if (!service || !(await confirmConversationDeletion(service.model || service.name, { heading: '删除这个模型？', description: '确认后将删除该模型的连接配置。服务商和其他模型会保留。', action: '删除模型' }))) return;
          try { await requestModelServiceDelete(service.id); const group = activeModelProvider(); activeModelServiceId = group?.services.find((item) => item.id !== service.id)?.id || ''; await refreshModelServices(); await loadChatModels(); showToast('模型已删除。'); }
          catch (error) { showToast(error.message || '删除模型失败'); }
        }
        async function requestModelServiceDelete(serviceId) {
          const response = await fetch(`/api/model-services/${encodeURIComponent(serviceId)}`, { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || '删除模型服务失败');
          return data;
        }
        async function deleteModelProvider(provider) {
          if (!provider) return;
          const count = provider.models.length;
          const description = count
            ? `“${provider.name}”下绑定了 ${count} 个模型。是否连同这些模型及其连接配置一起删除？`
            : `确定删除服务商“${provider.name}”吗？`;
          if (!(await confirmConversationDeletion(provider.name, { heading: '删除这个服务商？', description, action: count ? '连同模型一起删除' : '删除服务商' }))) return;
          try {
            const response = await fetch(`/api/model-providers/${encodeURIComponent(provider.services[0].id)}?cascade=${count > 0}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || '删除服务商失败');
            activeModelServiceId = ''; await refreshModelServices(); await loadChatModels();
            showToast(count ? '服务商及其绑定模型已删除。' : '服务商已删除。');
          } catch (error) { showToast(error.message || '删除服务商失败'); }
        }
        function openModelServiceEditor(service, mode = 'model', provider = null) {
          if (!service) return;
          modelServiceEditForm.reset();
          const editingProvider = mode === 'provider';
          modelServiceEditModal.dataset.mode = editingProvider ? 'provider' : 'model';
          setModelDialogFields(modelServiceEditModal, editingProvider ? 'provider' : 'model', true);
          modelServiceEditForm.setAttribute('aria-label', editingProvider ? `编辑 ${provider?.name || service.name} 服务商` : `编辑 ${service.model || service.name} 模型`);
          modelServiceEditModal.dataset.providerIds = JSON.stringify((provider?.services || [service]).map((item) => item.id));
          modelServiceEditModal.dataset.builtIn = service.custom ? 'false' : 'true';
          document.querySelector('#modelServiceEditTitle').textContent = editingProvider ? '编辑服务商' : '编辑模型';
          document.querySelector('#modelServiceEditSubtitle').textContent = editingProvider ? '只编辑服务商名称和类型；组内模型连接保持不变。' : '可更换所属服务商，并修改当前模型的连接资料。';
          document.querySelector('#submitModelServiceEdit').textContent = editingProvider ? '保存服务商' : '保存模型';
          document.querySelector('#modelServiceEditId').value = service.id;
          const nameInput = document.querySelector('#modelServiceEditName');
          const typeInput = document.querySelector('#modelServiceEditType');
          const modelInput = document.querySelector('#modelServiceEditModel');
          const descriptionInput = document.querySelector('#modelServiceEditDescription');
          nameInput.value = service.name || '';
          document.querySelector('#modelServiceEditProviderType').value = provider?.providerType || service.service_type || '综合服务';
          document.querySelector('#modelServiceEditProvider').innerHTML = providerSelectOptions(service.id);
          syncBoundedProviderSelect(document.querySelector('#modelServiceEditProvider'));
          typeInput.value = service.service_type || '综合服务';
          modelInput.value = service.model || '';
          document.querySelector('#modelServiceEditUrl').value = service.endpoint_url || service.base_url || service.default_base_url || '';
          descriptionInput.value = service.description || '';
          const keyInput = document.querySelector('#modelServiceEditKey'); keyInput.value = service.configured ? '••••••••••••' : ''; keyInput.dataset.keyLoaded = 'false';
          keyInput.classList.add('secret-input-masked');
          updateModelServiceRequirement('edit');
          document.querySelector('#modelServiceEditError').textContent = '';
          modelServiceEditModal.hidden = false;
          document.querySelector(editingProvider ? '#modelServiceEditName' : '#modelServiceEditModel').focus();
        }
        async function saveModelServiceProfile() {
          if (!validateModelServiceForm('edit')) return;
          const id = document.querySelector('#modelServiceEditId').value;
          const editingProvider = modelServiceEditModal.dataset.mode === 'provider';
          const keyInput = document.querySelector('#modelServiceEditKey');
          try {
            const ids = editingProvider ? JSON.parse(modelServiceEditModal.dataset.providerIds || '[]') : [id];
            for (const serviceId of ids) {
              const service = modelServices.find((item) => item.id === serviceId);
              if (!service) continue;
              const targetProvider = editingProvider ? null : selectedProvider(document.querySelector('#modelServiceEditProvider'));
              const payload = editingProvider
                ? { name: document.querySelector('#modelServiceEditName').value.trim(), base_url: service.endpoint_url || service.base_url || '', api_key: '', description: service.description || '', enabled: service.enabled !== false, service_type: service.provider_only ? document.querySelector('#modelServiceEditProviderType').value : service.service_type, model: service.model || '', provider_only: Boolean(service.provider_only) }
                : { name: targetProvider.name, base_url: document.querySelector('#modelServiceEditUrl').value.trim(), api_key: keyInput.dataset.keyLoaded === 'true' ? keyInput.value.trim() : '', description: document.querySelector('#modelServiceEditDescription').value.trim(), enabled: true, service_type: document.querySelector('#modelServiceEditType').value, model: document.querySelector('#modelServiceEditModel').value.trim(), provider_only: false };
              const response = await fetch(`/api/model-services/${encodeURIComponent(serviceId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              const data = await response.json(); if (!response.ok) throw new Error(data.detail || '保存模型服务失败');
            }
            closeModelServiceEditDialog(); await refreshModelServices(); await loadChatModels(); showToast(editingProvider ? '服务商资料已同步到组内模型。' : '模型配置已更新。');
          }
          catch (error) { showToast(error.message || '保存服务商资料失败'); }
        }
        function settingsPageHeader(title, description, action = '') {
          const visuals = {
            '默认模型': { icon: '✦', kicker: '对话模型', chip: '已接入对话' },
            '本地模型': { icon: '◈', kicker: '模型运行', chip: '本机检测' },
            'API 网关': { icon: '⇄', kicker: '模型接入', chip: 'OpenAI 兼容' },
            'MCP': { icon: '⌁', kicker: '工具连接', chip: '配置与基础检查' },
            '文档处理': { icon: '▧', kicker: '知识库', chip: '用于新建知识库' },
            'OCR': { icon: '⌖', kicker: '文字识别', chip: '偏好与引擎检测' },
          };
          const visual = visuals[title] || { icon: '⚙', kicker: '设置', chip: '当前账户' };
          return `<header class="agent-settings-header"><div class="agent-settings-header-main"><span class="settings-header-icon" aria-hidden="true">${visual.icon}</span><div><span class="settings-kicker">${escapeHtml(visual.kicker)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div></div><div class="agent-settings-header-actions"><span class="settings-capability-chip">${escapeHtml(visual.chip)}</span>${action}</div></header>`;
        }
        function settingsCardHead(title, description, badge = '', tone = '') {
          const badgeClass = tone ? ` ${escapeAttribute(tone)}` : '';
          return `<div class="settings-card-head"><div><h4>${escapeHtml(title)}</h4><p>${escapeHtml(description)}</p></div>${badge ? `<span class="settings-badge${badgeClass}">${escapeHtml(badge)}</span>` : ''}</div>`;
        }
        function settingsSwitch(inputAttributes, checked, title, description = '', tone = '') {
          return `<label class="settings-switch ${tone}"><span class="settings-switch-copy"><strong>${escapeHtml(title)}</strong>${description ? `<small>${escapeHtml(description)}</small>` : ''}</span><input ${inputAttributes} type="checkbox" ${checked ? 'checked' : ''} /><span class="settings-switch-control" aria-hidden="true"></span></label>`;
        }
        function settingsEmpty(icon, title, description = '') {
          return `<div class="settings-empty-panel"><div><span class="settings-empty-icon" aria-hidden="true">${icon}</span><strong>${escapeHtml(title)}</strong>${description ? `<div>${escapeHtml(description)}</div>` : ''}</div></div>`;
        }
        function configuredModelOptions(selectedId = '', includeEmpty = true) {
          const options = chatModels.filter((item) => item.configured).map((item) => `<option value="${escapeAttribute(item.id)}" ${item.id === selectedId ? 'selected' : ''}>${escapeHtml(item.provider || '模型服务')} · ${escapeHtml(item.model || item.name)}</option>`).join('');
          return `${includeEmpty ? `<option value="" ${selectedId ? '' : 'selected'}>跟随首个可用模型</option>` : ''}${options}`;
        }
        async function loadAgentSettings(renderCurrent = true) {
          const response = await fetch('/api/agent-settings', { cache: 'no-store' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || '无法读取智能体设置');
          agentSettings = data.settings || {};
          agentSettingsRuntime = data.runtime || {};
          if (renderCurrent && activeSettingsSection !== 'services') renderAgentSettingsSection();
          return agentSettings;
        }
        function renderDefaultModelSettings() {
          const value = agentSettings?.defaults || {};
          const fallbackOptions = `<option value="" ${value.fallback_model_id ? '' : 'selected'}>不设置备用模型</option>${configuredModelOptions(value.fallback_model_id, false)}`;
          agentSettingsContent.innerHTML = `<div class="agent-settings-page">${settingsPageHeader('默认模型', '决定新对话从哪个模型开始，并为调用失败准备一次自动降级。')}<div class="settings-capability-note"><span class="settings-note-icon">✓</span><div><strong>会真正作用于对话。</strong> 保存后，新建对话会使用这里的默认模型和生成参数；已有对话保留自己的显式选择。</div></div><form class="settings-card settings-form" id="defaultModelSettingsForm">${settingsCardHead('新对话默认值', '先选择首选与备用模型，再调整回答的随机性和长度。', '当前账户', 'info')}<div class="settings-card-body"><section class="settings-subsection"><div class="settings-subsection-title"><span class="settings-step-number">1</span>选择模型</div><div class="settings-form-grid"><label>默认对话模型<select name="chat_model_id">${configuredModelOptions(value.chat_model_id || '')}</select><small>只显示已经保存连接且处于启用状态的模型。</small></label><label>备用模型<select name="fallback_model_id">${fallbackOptions}</select><small>首选模型调用失败时，可自动尝试一次备用模型。</small></label></div></section><div class="settings-divider"></div><section class="settings-subsection"><div class="settings-subsection-title"><span class="settings-step-number">2</span>生成参数</div><div class="settings-form-grid"><label>温度<input name="temperature" type="number" min="0" max="2" step="0.1" value="${escapeAttribute(value.temperature ?? 0.4)}" /><small>数值越低越稳定，越高越有发散性；建议从 0.4 开始。</small></label><label>最大输出 Token<input name="max_tokens" type="number" min="128" max="16384" step="128" value="${escapeAttribute(value.max_tokens ?? 1200)}" /><small>限制单次回答长度；过小可能导致回答被截断。</small></label></div></section>${settingsSwitch('name="auto_fallback"', Boolean(value.auto_fallback), '主模型失败时自动切换', '需要先选择一个与首选模型不同的备用模型。')}</div><footer class="settings-card-footer"><div class="settings-inline-message" data-settings-message></div><div class="settings-actions"><button class="settings-primary" type="submit">保存默认值</button></div></footer></form></div>`;
          agentSettingsContent.querySelector('[name="max_tokens"]').step = '1';
        }
        function formatModelSize(size) {
          const bytes = Number(size || 0);
          if (!bytes) return '';
          return bytes >= 1073741824 ? `${(bytes / 1073741824).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1048576))} MB`;
        }
        function renderLocalModelSettings() {
          const registered = modelServices.filter((item) => item.local_provider);
          const statusCards = (agentSettingsRuntime?.local_model_presets || []).map((item) => {
            const found = discoveredLocalProviders.find((entry) => entry.provider === item.provider);
            const ready = Boolean(found?.available);
            const status = found ? (ready ? `已发现 ${found.models.length} 个` : '未运行') : '待检测';
            return `<div class="settings-status-card"><div class="settings-status-copy"><span class="settings-status-card-icon">${item.provider === 'ollama' ? 'O' : 'L'}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.url)}</small></div></div><span class="settings-badge ${ready ? 'ready' : (found ? 'warning' : '')}">${status}</span></div>`;
          }).join('');
          const discoveredRows = discoveredLocalProviders.flatMap((provider) => (provider.models || []).map((model) => ({ ...model, provider: provider.provider, providerName: provider.name, baseUrl: provider.base_url }))).map((item) => {
            const imported = registered.some((service) => service.local_provider === item.provider && service.model === item.id);
            return `<div class="settings-list-row"><div><strong>${escapeHtml(item.providerName)} · ${escapeHtml(item.id)}</strong><small>${escapeHtml(item.baseUrl)}${formatModelSize(item.size) ? ` · ${formatModelSize(item.size)}` : ''}</small></div><button class="settings-secondary" data-local-import data-provider="${escapeAttribute(item.provider)}" data-model="${escapeAttribute(item.id)}" data-base-url="${escapeAttribute(item.baseUrl)}" type="button" ${imported ? 'disabled' : ''}>${imported ? '已添加' : '添加到模型服务'}</button></div>`;
          }).join('');
          const registeredRows = registered.map((item) => `<div class="settings-list-row"><div><strong>${escapeHtml(item.name)} · ${escapeHtml(item.model)}</strong><small>${escapeHtml(item.endpoint_url || item.base_url || '')} · 可在“模型服务”中编辑或删除</small></div><span class="settings-badge ready">已接入</span></div>`).join('');
          agentSettingsContent.innerHTML = `<div class="agent-settings-page">${settingsPageHeader('本地模型', '扫描当前电脑上的 Ollama 与 LM Studio，并把选中的模型加入模型服务。', '<button class="settings-primary" data-local-discover type="button">扫描本机服务</button>')}<div class="settings-capability-note"><span class="settings-note-icon">⌂</span><div><strong>扫描范围仅限本机。</strong> 应用只访问 127.0.0.1，不会扫描局域网；模型添加成功后可直接在新对话中选择。</div></div><section class="settings-status-grid">${statusCards}</section><div class="settings-two-column"><section class="settings-card">${settingsCardHead('发现的模型', '先启动本地服务，再点击页面右上角的扫描按钮。', `${discoveredLocalProviders.reduce((sum, item) => sum + (item.models || []).length, 0)} 个`)}<div class="settings-card-body"><div class="settings-list settings-scroll-list" tabindex="0" aria-label="发现的本地模型列表">${discoveredRows || settingsEmpty('⌕', '尚未发现模型', '启动 Ollama 或 LM Studio 后重新扫描。')}</div></div></section><section class="settings-card">${settingsCardHead('已接入模型', '这些模型已经加入模型服务，并会出现在对话模型选择器中。', `${registered.length} 个`)}<div class="settings-card-body"><div class="settings-list settings-scroll-list" tabindex="0" aria-label="已接入的本地模型列表">${registeredRows || settingsEmpty('＋', '还没有接入本地模型', '从左侧发现列表中选择模型并添加。')}</div></div></section></div></div>`;
        }
        function renderGatewaySettings() {
          const value = agentSettings?.gateway || {};
          const rows = discoveredGatewayModels.map((model) => `<div class="settings-list-row"><div><strong>${escapeHtml(model)}</strong><small>导入后由用户在对话中显式选择，不会自动接管其他模型。</small></div><button class="settings-secondary" data-gateway-import data-model="${escapeAttribute(model)}" type="button">导入模型</button></div>`).join('');
          agentSettingsContent.innerHTML = `<div class="agent-settings-page">${settingsPageHeader('API 网关', '连接 OpenAI 兼容接口，读取模型列表后按需导入；网关不会在后台替换现有模型。')}<div class="settings-workflow" aria-label="网关操作流程"><div class="settings-workflow-step"><b>1</b><span>填写并保存连接</span></div><div class="settings-workflow-step"><b>2</b><span>测试并读取模型</span></div><div class="settings-workflow-step"><b>3</b><span>选择模型导入使用</span></div></div><form class="settings-card settings-form" id="gatewaySettingsForm">${settingsCardHead('网关连接', 'API Key 只保存在当前账户的数据目录，页面不会回传完整密钥。', value.configured ? '密钥已配置' : '未配置', value.configured ? 'ready' : 'warning')}<div class="settings-card-body">${settingsSwitch('name="enabled"', Boolean(value.enabled), '启用这份网关配置', '关闭后，已经从该网关导入的模型也会暂时停用。')}<div class="settings-form-grid"><label>OpenAI 兼容基础地址<input name="base_url" type="url" placeholder="https://gateway.example.com/v1" value="${escapeAttribute(value.base_url || '')}" /><small>填写到 /v1；测试时会请求该地址下的 /models。</small></label><label>API Key<input name="api_key" type="password" autocomplete="new-password" placeholder="${value.configured ? `已配置 ${escapeAttribute(value.api_key_hint || '')}；留空保持不变` : '填写网关密钥'}" /><small>${value.configured ? '当前密钥已安全保存；不修改时请保持留空。' : '远程网关通常需要 Bearer API Key。'}</small></label><label>请求超时（秒）<input name="timeout_seconds" type="number" min="5" max="300" value="${escapeAttribute(value.timeout_seconds ?? 60)}" /><small>应用于模型列表测试与该网关导入模型的对话请求；超时按每次请求计算。</small></label><label>最大重试次数<input name="max_retries" type="number" min="0" max="5" value="${escapeAttribute(value.max_retries ?? 1)}" /><small>模型列表对网络错误、限流和服务端故障重试；对话交由兼容客户端按此次数重试。</small></label></div>${settingsSwitch('name="clear_api_key"', false, '保存时清除已有 API Key', '这是危险操作；勾选并保存后，远程网关模型将无法调用。', 'danger')}</div><footer class="settings-card-footer"><div class="settings-inline-message" data-settings-message></div><div class="settings-actions"><button class="settings-secondary" data-gateway-test type="button">保存并测试连接</button><button class="settings-primary" type="submit">仅保存设置</button></div></footer></form><section class="settings-card">${settingsCardHead('可导入的网关模型', '连接测试通过后，按需把模型加入“模型服务”。', `${discoveredGatewayModels.length} 个`)}<div class="settings-card-body"><div class="settings-list settings-scroll-list" tabindex="0" aria-label="可导入的网关模型列表">${rows || settingsEmpty('⇄', '还没有读取网关模型', '完成连接配置后，点击“保存并测试连接”。')}</div></div></section></div>`;
        }
        function mcpServerCard(server) {
          const isHttp = server.transport === 'streamable_http';
          return `<article class="mcp-settings-card" data-mcp-card data-id="${escapeAttribute(server.id || '')}"><div class="settings-form-grid"><label class="settings-field">连接名称<input data-mcp-name value="${escapeAttribute(server.name || '')}" placeholder="例如：本地文件工具" /></label><label class="settings-field">传输方式<select data-mcp-transport><option value="stdio" ${isHttp ? '' : 'selected'}>stdio（本地命令）</option><option value="streamable_http" ${isHttp ? 'selected' : ''}>Streamable HTTP</option></select></label><label class="settings-field">超时（秒）<input data-mcp-timeout type="number" min="3" max="180" value="${escapeAttribute(server.timeout_seconds ?? 30)}" /></label><label class="settings-field"><span data-mcp-target-label>${isHttp ? 'MCP 地址' : '启动命令'}</span><input data-mcp-target value="${escapeAttribute(isHttp ? (server.url || '') : (server.command || ''))}" placeholder="${isHttp ? 'https://example.com/mcp' : 'npx / 可执行文件路径'}" /></label><label class="settings-field">参数（JSON 数组或空格分隔）<input data-mcp-args value="${escapeAttribute(JSON.stringify(server.args || []))}" ${isHttp ? 'disabled' : ''} placeholder="stdio 命令的附加参数" /></label>${settingsSwitch('data-mcp-enabled', server.enabled !== false, '启用这个连接', '停用后仍保留配置，但不会参与后续接入。')}</div><div class="mcp-card-foot"><small>${server.id ? '连接已保存，可以执行基础检查。' : '请先保存全部连接，再执行基础检查。'}</small><div class="settings-row-actions"><button class="settings-secondary" data-mcp-check type="button" ${server.id ? '' : 'disabled'}>基础检查</button><button class="settings-secondary" data-mcp-connect type="button" ${server.id ? '' : 'disabled'}>连接测试</button><button class="settings-danger" data-mcp-delete type="button">删除</button></div></div></article>`;
        }
        function renderMcpSettings() {
          const servers = Array.isArray(agentSettings?.mcp_servers) ? agentSettings.mcp_servers : [];
          agentSettingsContent.innerHTML = `<div class="agent-settings-page">${settingsPageHeader('MCP', '管理本地 stdio 与远程 Streamable HTTP 连接资料。', '<button class="settings-secondary" data-mcp-add type="button">＋ 添加连接</button>')}<div class="settings-capability-note warning"><span class="settings-note-icon">!</span><div><strong>当前能力边界：</strong> 基础检查只验证命令或地址；连接测试会实际完成协议握手并读取工具列表。仅支持无需额外认证的连接，尚不会把第三方工具注册到对话 Agent。</div></div><section class="settings-card settings-form">${settingsCardHead('MCP 连接', '每个连接单独设置传输方式、目标与超时；列表较长时可直接滚动。', `${servers.length} 个`)}<div class="settings-card-body"><div class="settings-list settings-scroll-list" data-mcp-list tabindex="0" aria-label="MCP 连接列表">${servers.length ? servers.map(mcpServerCard).join('') : settingsEmpty('⌁', '还没有 MCP 连接', '点击右上角“添加连接”开始配置。')}</div></div><footer class="settings-card-footer"><div class="settings-inline-message" data-settings-message></div><div class="settings-actions"><button class="settings-primary" data-mcp-save type="button">保存全部连接</button></div></footer></section></div>`;
        }
        function renderAgentSettingsSection() {
          if (!agentSettings) { agentSettingsContent.innerHTML = '<div class="settings-empty-panel">正在读取设置…</div>'; return; }
          if (activeSettingsSection === 'defaults') renderDefaultModelSettings();
          else if (activeSettingsSection === 'local') renderLocalModelSettings();
          else if (activeSettingsSection === 'gateway') renderGatewaySettings();
          else if (activeSettingsSection === 'mcp') renderMcpSettings();
        }
        async function switchModelSettingsSection(section) {
          const supported = ['services', 'defaults', 'local', 'gateway', 'mcp'];
          activeSettingsSection = supported.includes(section) ? section : 'services';
          const showingServices = activeSettingsSection === 'services';
          modelSettingsLayout.classList.toggle('section-page', !showingServices);
          modelServiceWorkspace.hidden = !showingServices;
          agentSettingsContent.hidden = showingServices;
          modelSettingsNav.querySelectorAll('[data-settings-section]').forEach((button) => {
            const active = button.dataset.settingsSection === activeSettingsSection;
            button.classList.toggle('active', active);
            if (active) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
          });
          if (showingServices) { renderModelServices(); return; }
          agentSettingsContent.innerHTML = '<div class="settings-empty-panel">正在读取设置…</div>';
          try { await loadAgentSettings(false); renderAgentSettingsSection(); }
          catch (error) { agentSettingsContent.innerHTML = `<div class="settings-empty-panel">${escapeHtml(error.message || '无法读取设置')}</div>`; }
        }
        function settingsMessage(text, type = '') {
          const target = agentSettingsContent.querySelector('[data-settings-message]');
          if (!target) return;
          target.textContent = text;
          target.className = `settings-inline-message ${type}`;
        }
        function knowledgeBaseById(id) { return knowledgeBases.find((item) => item.id === id); }
        function formatKnowledgeTime(value) {
          const timestamp = Date.parse(value || '');
          if (Number.isNaN(timestamp)) return '刚刚';
          const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
          if (minutes < 1) return '刚刚';
          if (minutes < 60) return `${minutes} 分钟前`;
          if (minutes < 1440) return `${Math.round(minutes / 60)} 小时前`;
          return new Date(timestamp).toLocaleDateString('zh-CN');
        }
        function renderKnowledgeBases() {
          const current = activeConversation();
          const selected = new Set(current?.knowledgeBaseIds || []);
          knowledgeButton.textContent = selected.size ? `▤ 知识库 · ${selected.size}` : '▤ 知识库';
          renderContextLens();
          if (knowledgeModal.hidden) return;
          if (editingKnowledgeBaseId && !knowledgeBaseById(editingKnowledgeBaseId)) editingKnowledgeBaseId = null;
          if (!editingKnowledgeBaseId && knowledgeBases.length) editingKnowledgeBaseId = knowledgeBases[0].id;
          knowledgeList.innerHTML = knowledgeBases.length
            ? knowledgeBases.map((base) => `<button class="knowledge-library-item ${base.id === editingKnowledgeBaseId ? 'active' : ''}" data-kb-open="${base.id}" type="button"><span>${escapeHtml(base.name)}</span><small>${base.document_count}</small></button>`).join('')
            : '<p class="settings-empty">还没有知识库</p>';
          const base = knowledgeBaseById(editingKnowledgeBaseId);
          renderKnowledgeContent(base, selected);
          if (!knowledgeSettings.hidden) renderKnowledgeSettings(base);
        }
        function renderKnowledgeContent(base, selected) {
          if (!base) {
            knowledgeContent.innerHTML = '<div class="knowledge-content-inner empty-knowledge"><span class="empty-icon">▤</span><h3>还没有知识库</h3><p>新建一个资料库，开始管理文档和对话引用。</p><button class="primary-button" data-open-create type="button">＋ 新建知识库</button></div>';
            return;
          }
          const documents = loadedDocumentKnowledgeBaseId === base.id ? knowledgeDocuments : [];
          selectedKnowledgeDocuments = new Set([...selectedKnowledgeDocuments].filter((name) => documents.some((item) => item.filename === name)));
          const selectedCount = selectedKnowledgeDocuments.size;
          const table = documents.length ? `<div class="data-source-header"><strong>数据源 · ${documents.length}</strong><button class="delete-documents" data-delete-documents type="button" ${selectedCount ? '' : 'disabled'}>${selectedCount ? `删除已选 (${selectedCount})` : '删除已选'}</button></div><table class="document-table"><thead><tr><th><input class="document-check" data-document-select-all type="checkbox" ${documents.length && selectedCount === documents.length ? 'checked' : ''} aria-label="选择全部数据源" /></th><th>名称</th><th>类型</th><th>状态</th><th>更新时间</th><th aria-label="操作"></th></tr></thead><tbody>${documents.map((document) => `<tr><td><input class="document-check" data-document-select="${escapeAttribute(document.filename)}" type="checkbox" ${selectedKnowledgeDocuments.has(document.filename) ? 'checked' : ''} aria-label="选择 ${escapeAttribute(document.filename)}" /></td><td title="${escapeAttribute(document.filename)}">▧&nbsp; ${escapeHtml(document.filename)}</td><td>文件</td><td><span class="document-ready">✓ 就绪</span></td><td>${escapeHtml(formatKnowledgeTime(document.updated_at))}</td><td><div class="document-row-actions"><button class="document-more" data-document-menu type="button" aria-label="打开文档操作">•••</button><div class="document-action-menu" hidden><button data-document-action="source" data-document-name="${escapeAttribute(document.filename)}" type="button">预览原文</button><button data-document-action="chunks" data-document-name="${escapeAttribute(document.filename)}" type="button">查看 Chunks</button><button data-document-action="reparse" data-document-name="${escapeAttribute(document.filename)}" type="button">重新解析</button></div></div></td></tr>`).join('')}</tbody></table>` : `<div class="empty-knowledge"><span class="empty-icon">▧</span><h3>暂无数据源</h3><p>上传第一个数据源，便可用于当前对话检索。</p><div class="empty-source-actions"><button class="outline-button" data-source-action="file" type="button">▧ 文件</button><button class="outline-button" data-source-action="directory" type="button">▱ 目录</button><button class="outline-button" data-source-action="note" type="button" disabled title="将在后续版本支持">▤ 笔记</button><button class="outline-button" data-source-action="link" type="button" disabled title="将在后续版本支持">⌁ 链接</button></div></div>`;
          knowledgeContent.innerHTML = `<div class="knowledge-content-inner"><div class="knowledge-title-row"><div><h2>${escapeHtml(base.name)}</h2><p class="knowledge-updated">更新于 ${escapeHtml(formatKnowledgeTime(base.updated_at))}</p></div><button class="outline-button" data-open-settings type="button">☷ 设置</button></div><div class="knowledge-toolbar"><div class="knowledge-toolbar-left"><span>资料只在你勾选它的对话中参与检索</span><label class="use-knowledge"><input data-kb-select="${base.id}" type="checkbox" ${selected.has(base.id) ? 'checked' : ''} /> 当前对话使用</label></div><div class="data-source-wrap"><button class="outline-button" data-toggle-sources type="button">＋ 添加数据源</button><div class="source-menu" id="sourceMenu" hidden><button data-source-action="file" type="button">▧ 上传文件</button><button data-source-action="directory" type="button">▱ 上传目录</button><button disabled type="button">▤ 导入笔记（待支持）</button><button disabled type="button">⌁ 添加链接（待支持）</button></div></div></div>${table}</div>`;
        }
        function renderKnowledgeSettings(base) {
          if (!base) { knowledgeSettings.hidden = true; return; }
          const settings = base.settings || {};
          const options = (name) => knowledgeModelOptionsHtml(name, settings[name]);
          const topK = Number(settings.top_k) || 3;
          const chunkSize = Number(settings.chunk_size) || 1024;
          const chunkOverlap = Number(settings.chunk_overlap) || 200;
          knowledgeSettings.innerHTML = `<form class="settings-form" id="knowledgeSettingsForm" data-kb-id="${base.id}"><div class="settings-drawer-header"><h2>知识库设置</h2><button class="modal-close" data-close-settings type="button" aria-label="关闭设置">×</button></div><div class="settings-scroll"><label>文档处理<select name="document_processor">${options('document_processor')}</select></label><label>嵌入模型<select name="embedding_model">${options('embedding_model')}</select></label><label>重排模型<select name="reranker">${options('reranker')}</select></label><p class="settings-note" data-knowledge-provider-status></p><button class="outline-button" data-open-model-settings type="button">⚙ 打开模型服务设置</button><label class="range-setting"><span class="settings-range-label"><span>Top K</span><output data-top-k-value>${topK}</output></span><input name="top_k" type="range" min="1" max="50" value="${topK}" /><small>返回前 <span data-top-k-hint>${topK}</span> 条候选资料（只影响问答检索，不影响 Chunks）</small></label><h3 class="settings-section-title">高级设置</h3><label class="settings-toggle">智能分段 <input name="smart_chunking" type="checkbox" ${settings.smart_chunking !== false ? 'checked' : ''} /></label><p class="settings-help">开启后会优先按标题、段落和列表结构切块；关闭后按分段大小和重叠大小切块。Chunks 数量由文档结构、内容长度和这里的参数决定，与模型是否配置成功无关。</p><label>分隔符<input name="separator" maxlength="20" value="${escapeAttribute(settings.separator || '\n\n')}" /></label><div class="settings-inline"><label>分段大小<div class="settings-input-with-unit"><input name="chunk_size" type="number" min="128" max="4096" value="${chunkSize}" /><span class="settings-unit">tokens</span></div></label><label>重叠大小<div class="settings-input-with-unit"><input name="chunk_overlap" type="number" min="0" max="1024" value="${chunkOverlap}" /><span class="settings-unit">tokens</span></div></label></div><p class="settings-help">分段大小和重叠大小按近似 token 计算。修改后请点击“重新解析”让已有文件重新生成 Chunks。</p></div><div class="settings-actions"><button class="primary-button" type="submit">保存</button><button data-kb-delete="${base.id}" class="delete-kb" type="button">删除知识库</button></div></form>`;
          updateKnowledgeProviderStatus(knowledgeSettings.querySelector('#knowledgeSettingsForm'));
        }
        function updateKnowledgeProviderStatus(form) {
          if (!form) return;
          const status = form.querySelector('[data-knowledge-provider-status]');
          if (!status) return;
          const fields = [['document_processor', '文档处理'], ['embedding_model', '嵌入模型'], ['reranker', '重排模型']];
          const lines = fields.map(([field, label]) => {
            const selected = form.elements[field]?.value || '';
            const model = knowledgeModelChoices(field).find((item) => item.id === selected);
            if (!model) return `<span class="warning-text">⚠ ${escapeHtml(label)}：所选模型已不可用，请重新选择</span>`;
            const state = model.id.startsWith('service:') ? '已配置' : '无需配置';
            return `<span class="document-ready">✓ ${escapeHtml(label)}：${escapeHtml(model.name)}（${state}）</span>`;
          });
          if (form.dataset.modelRemoved === 'true') lines.push('<span class="warning-text">原选模型已不可用，已切回本地默认方式。请确认选项后保存。</span>');
          status.innerHTML = lines.join('<br />');
        }
        async function refreshKnowledgeBases() {
          try {
            const response = await fetch('/api/knowledge-bases');
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || '无法读取知识库');
            knowledgeBases = Array.isArray(data) ? data : [];
            const knownIds = new Set(knowledgeBases.map((item) => item.id));
            state.conversations.forEach((conversation) => { conversation.knowledgeBaseIds = (conversation.knowledgeBaseIds || []).filter((id) => knownIds.has(id)); });
            if (editingKnowledgeBaseId && !knownIds.has(editingKnowledgeBaseId)) editingKnowledgeBaseId = null;
            if (!editingKnowledgeBaseId && knowledgeBases.length) editingKnowledgeBaseId = knowledgeBases[0].id;
            renderKnowledgeBases(); saveState();
            // The composer can be opened before this request finishes. Refresh
            // its picker as soon as the list arrives so the first click is useful.
            if (!composerKnowledgePicker.hidden) renderComposerKnowledgePicker();
            if (!knowledgeModal.hidden && editingKnowledgeBaseId) await refreshKnowledgeDocuments(editingKnowledgeBaseId);
          } catch (error) { showToast(error.message || '无法读取知识库'); }
        }
        async function refreshKnowledgeDocuments(id = editingKnowledgeBaseId) {
          if (!id) { knowledgeDocuments = []; loadedDocumentKnowledgeBaseId = null; renderKnowledgeBases(); return; }
          try {
            const response = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}/documents`);
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取数据源');
            if (id !== editingKnowledgeBaseId) return;
            knowledgeDocuments = data.documents || []; loadedDocumentKnowledgeBaseId = id; renderKnowledgeBases();
          } catch (error) { showToast(error.message || '无法读取数据源'); }
        }
        async function selectKnowledgeBase(id) {
          if (!knowledgeBaseById(id)) return;
          editingKnowledgeBaseId = id; knowledgeDocuments = []; loadedDocumentKnowledgeBaseId = null; selectedKnowledgeDocuments = new Set();
          renderKnowledgeBases(); await refreshKnowledgeDocuments(id);
        }
        async function createKnowledgeBase(name, embeddingModel) {
          const response = await fetch('/api/knowledge-bases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, settings: { embedding_model: embeddingModel } }) });
          const data = await response.json(); if (!response.ok) throw new Error(data.detail || '创建知识库失败');
          editingKnowledgeBaseId = data.id;
          await refreshKnowledgeBases();
          showToast(`已创建知识库“${data.name}”。`);
        }
        function updateKnowledgeCreateHint() {
          const external = knowledgeEmbedding.value !== '本地关键词检索';
          const configured = knowledgeModelChoices('embedding_model').length > 1;
          knowledgeCreateHint.textContent = external
            ? '将使用所选模型已保存的连接配置。'
            : configured ? '使用本地关键词检索，无需模型；也可选择上方已配置的嵌入模型。'
            : '尚未配置嵌入模型，可先使用本地关键词检索。需要嵌入模型时，点击下方按钮添加。';
          openKnowledgeCreateModelSettings.hidden = configured;
        }
        function resetKnowledgeCreateDialog() {
          document.querySelector('#knowledgeCreate').reset();
          knowledgeEmbedding.value = '本地关键词检索';
          knowledgeCreateMessage.textContent = '';
          openKnowledgeCreateModelSettings.hidden = true;
          updateKnowledgeCreateHint();
        }
        async function openKnowledgeCreateDialog() {
          syncKnowledgeModelOptions();
          resetKnowledgeCreateDialog();
          knowledgeCreateModal.hidden = false;
          document.querySelector('#knowledgeName').focus();
          await refreshModelServices();
        }
        function closeKnowledgeCreateDialog() {
          knowledgeCreateModal.hidden = true;
          resetKnowledgeCreateDialog();
        }
        async function saveKnowledgeBaseSettings(form) {
          const id = form.dataset.kbId;
          const formData = new FormData(form);
          const settings = { document_processor: formData.get('document_processor'), embedding_model: formData.get('embedding_model'), reranker: formData.get('reranker'), top_k: Number(formData.get('top_k')), smart_chunking: formData.get('smart_chunking') === 'on', separator: formData.get('separator'), chunk_size: Number(formData.get('chunk_size')), chunk_overlap: Number(formData.get('chunk_overlap')) };
          const response = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) });
          const data = await response.json(); if (!response.ok) throw new Error(data.detail || '保存设置失败');
          knowledgeSettings.hidden = true;
          await refreshKnowledgeBases(); showToast('知识库设置已保存，设置面板已关闭。');
        }
        async function uploadKnowledgeDocuments(files) {
          const id = knowledgeFileInput.dataset.knowledgeBaseId;
          const selected = Array.from(files || []); if (!id || !selected.length) return;
          if (selected.length > 8) { showToast('一次最多上传 8 个文档。'); return; }
          const empty = selected.find((file) => file.size <= 0);
          if (empty) { showToast(`${empty.name} 是空文件，不能添加到知识库。`); return; }
          const oversized = selected.find((file) => file.size > MAX_FILE_BYTES);
          if (oversized) { showToast(`${oversized.name} 超过 2 MB 限制。`); return; }
          try {
            const payload = await Promise.all(selected.map(async (file) => ({ filename: file.name, data_base64: await fileAsBase64(file) })));
            const response = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files: payload }) });
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '上传知识库文档失败');
            await refreshKnowledgeBases(); showToast(`已添加 ${data.length} 个知识库文档。`);
          } catch (error) { showToast(error.message || '上传知识库文档失败'); }
          finally { knowledgeFileInput.value = ''; knowledgeFileInput.dataset.knowledgeBaseId = ''; }
        }
        async function removeKnowledgeBase(id) {
          const base = knowledgeBaseById(id);
          if (!base || !window.confirm(`删除知识库“${base.name}”及其全部文档？此操作无法恢复。`)) return;
          const response = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}`, { method: 'DELETE' });
          const data = await response.json(); if (!response.ok) throw new Error(data.detail || '删除知识库失败');
          state.conversations.forEach((conversation) => { conversation.knowledgeBaseIds = (conversation.knowledgeBaseIds || []).filter((item) => item !== id); });
          editingKnowledgeBaseId = null; knowledgeDocuments = []; loadedDocumentKnowledgeBaseId = null; knowledgeSettings.hidden = true; await refreshKnowledgeBases(); render(false); showToast('知识库已删除。');
        }
        async function deleteKnowledgeDocuments() {
          const id = editingKnowledgeBaseId; const filenames = [...selectedKnowledgeDocuments];
          if (!id || !filenames.length || !window.confirm(`删除选中的 ${filenames.length} 个数据源？此操作无法恢复。`)) return;
          const response = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}/documents`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filenames }) });
          const data = await response.json(); if (!response.ok) throw new Error(data.detail || '删除数据源失败');
          selectedKnowledgeDocuments = new Set(); await refreshKnowledgeBases(); showToast(`已删除 ${data.deleted.length} 个数据源。`);
        }
        async function inspectKnowledgeDocument(filename, mode) {
          const id = editingKnowledgeBaseId;
          if (!id || !filename) return;
          try {
            const encodedId = encodeURIComponent(id);
            const encodedName = encodeURIComponent(filename);
            if (mode === 'chunks') {
              const response = await fetch(`/api/knowledge-bases/${encodedId}/documents/${encodedName}/chunks`);
              const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取文档分块');
              const chunks = Array.isArray(data.chunks) ? data.chunks : [];
              documentInspectTitle.textContent = data.filename || filename;
              documentInspectSubtitle.textContent = `${data.total ?? chunks.length} 个 chunks`;
              documentInspectBody.innerHTML = chunks.length ? `<div class="document-preview-note">分块由文档标题、段落、内容长度和知识库分段参数决定。短文档可能只有 1 个 Chunk；这不代表 MinerU 或嵌入模型配置失败。</div><div class="document-chunks-list">${chunks.map((chunk, index) => { const text = String(chunk || ''); const tokens = Number(data.token_counts?.[index]) || Math.max(1, Math.ceil(text.trim().length / 4)); return `<article class="document-chunk"><div class="document-chunk-meta"><span class="document-chunk-index">${index + 1}</span><span>${tokens} tokens</span></div><p class="document-chunk-content">${escapeHtml(text)}</p></article>`; }).join('')}</div>` : '<div class="document-chunk-empty">当前文档没有可用的解析分块。</div>';
              documentInspectModal.hidden = false;
              return;
            }
            const suffix = filename.toLowerCase().split('.').pop() || '';
            const rawUrl = `/api/knowledge-bases/${encodedId}/documents/${encodedName}/raw`;
            documentInspectTitle.textContent = filename;
            documentInspectSubtitle.textContent = '原始文件预览';
            if (suffix === 'pdf') {
              documentInspectBody.innerHTML = `<iframe class="document-original-frame" title="${escapeAttribute(filename)}" src="${rawUrl}#toolbar=1&navpanes=0"></iframe>`;
              documentInspectModal.hidden = false;
              return;
            }
            const response = await fetch(`/api/knowledge-bases/${encodedId}/documents/${encodedName}/source`);
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取原文');
            const note = suffix === 'docx' ? '<div class="document-preview-note">文件已上传成功。桌面端内置预览暂不能直接呈现 DOCX 版式，以下为从原文件读取的正文内容。</div>' : '';
            documentInspectBody.innerHTML = `${note}<pre class="document-original-text">${escapeHtml(data.content || '当前文件没有可预览的文本内容。')}</pre>`;
            documentInspectModal.hidden = false;
          } catch (error) { showToast(error.message || '无法读取文档'); }
        }
        async function reparseKnowledgeDocument(filename) {
          const id = editingKnowledgeBaseId;
          if (!id || !filename) return;
          try {
            const response = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}/documents/${encodeURIComponent(filename)}/reparse`, { method: 'POST' });
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '重新解析失败');
            await refreshKnowledgeDocuments(id); showToast(`“${filename}”已重新解析。`);
          } catch (error) { showToast(error.message || '重新解析失败'); }
        }
        function resizeComposer() {
          question.style.height = 'auto';
          const limit = Math.max(80, Math.min(200, window.innerHeight * .26));
          const multiline = question.scrollHeight > 55;
          document.querySelector('#composer').classList.toggle('multiline', multiline);
          question.style.height = `${Math.min(question.scrollHeight, limit)}px`;
          question.style.overflowY = question.scrollHeight > limit ? 'auto' : 'hidden';
        }
        function positionContextLens() {
          if (contextLens.hidden) return;
          const anchor = document.querySelector('#openContextLens').getBoundingClientRect();
          const host = contextLens.offsetParent?.getBoundingClientRect();
          if (!host) return;
          const width = contextLens.getBoundingClientRect().width;
          const desiredLeft = anchor.left + (anchor.width / 2) - (width / 2);
          const left = Math.max(host.left + 12, Math.min(desiredLeft, host.right - width - 12));
          contextLens.style.left = `${left - host.left}px`;
          contextLens.style.right = 'auto';
          contextLens.style.transform = 'none';
          contextLens.style.top = `${anchor.bottom - host.top + 10}px`;
          contextLens.style.maxHeight = `${Math.max(180, window.innerHeight - anchor.bottom - 24)}px`;
        }
        listen(window, 'resize', () => { resizeComposer(); positionContextLens(); });
        observeResize(document.querySelector('.chat-header'), positionContextLens);
        function showToast(text, duration = 3200) {
          toast.textContent = String(text || '操作完成。');
          toast.classList.add('show');
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = later(() => toast.classList.remove('show'), duration);
        }
        async function runGlobalSearch() {
          const query = globalSearchInput.value.trim();
          if (!query) { globalSearchResults.innerHTML = '<div class="lens-empty">输入关键词开始搜索。</div>'; return; }
          const localResults = [];
          state.conversations.forEach((conversation) => (conversation.messages || []).forEach((message) => {
            if (String(message.content || '').toLowerCase().includes(query.toLowerCase())) localResults.push({ kind: '对话', title: conversation.title, excerpt: String(message.content).slice(0, 220) });
          }));
          globalSearchResults.innerHTML = '<div class="lens-empty">正在搜索本地资料…</div>';
          try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '搜索失败');
            const results = [...localResults, ...(data.results || [])];
            globalSearchResults.innerHTML = results.length ? results.map((item) => `<article class="search-result"><strong><span class="search-kind">${escapeHtml(item.kind || '资料')}</span>${escapeHtml(item.title || '未命名')}</strong><small>${escapeHtml(item.excerpt || '')}</small></article>`).join('') : '<div class="lens-empty">没有找到匹配内容。</div>';
          } catch (error) { globalSearchResults.innerHTML = `<div class="warning">${escapeHtml(error.message || '搜索失败')}</div>`; }
        }
        async function openNotesModal() {
          closeTopPanels('notes');
          notesModal.hidden = false;
          notesSearchInput.value = '';
          closeNoteEditor();
          await loadNotes();
        }
        
        
        async function copyPlainText(value) {
          const text = String(value || '');
          try {
            if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
            else {
              const input = document.createElement('textarea');
              input.value = text; input.style.position = 'fixed'; input.style.opacity = '0';
              document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove();
            }
            showToast('已复制到剪贴板。');
          } catch (_) { showToast('复制失败，请检查系统剪贴板权限。'); }
        }
        function selectedTextForTarget(target) {
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            const start = Number(target.selectionStart || 0); const end = Number(target.selectionEnd || 0);
            return target.value.slice(start, end);
          }
          return String(window.getSelection?.()?.toString() || '');
        }
        function editableContextTarget(target) {
          return target?.closest?.('textarea, input:not([type="button"]):not([type="submit"]), [contenteditable="true"]') || null;
        }
        function hideTextContextMenu() { textContextMenu.hidden = true; textContextState = null; }
        function insertTextAtCursor(target, text) {
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            const start = Number(target.selectionStart ?? target.value.length); const end = Number(target.selectionEnd ?? start);
            target.setRangeText(text, start, end, 'end');
            target.dispatchEvent(new Event('input', { bubbles: true }));
            target.focus();
            return;
          }
          target.focus();
          document.execCommand('insertText', false, text);
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
        function blobAsDataUrl(blob) {
          return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = reject; reader.readAsDataURL(blob); });
        }
        async function pasteFromContextMenu() {
          const target = textContextState?.editable;
          if (!target) return;
          try {
            if ((target === noteEditorContent || target === question) && navigator.clipboard?.read) {
              const items = await navigator.clipboard.read();
              const images = [];
              for (const item of items) {
                const imageType = item.types.find((type) => /^image\/(png|jpeg|webp)$/.test(type));
                if (imageType) images.push(await item.getType(imageType));
              }
              if (images.length) {
                if (target === question) await uploadFiles(pastedImageFiles(images));
                else await addNoteImages(images);
                return;
              }
            }
            const text = await navigator.clipboard.readText();
            insertTextAtCursor(target, text);
          } catch (error) { showToast(error.message || '粘贴失败，请检查系统剪贴板权限。'); }
        }
        function noteImageMarkup(src, name = '截图') {
          return `<span class="note-image" contenteditable="false"><img src="${escapeAttribute(src)}" alt="${escapeAttribute(name)}" /><span class="note-image-name" title="${escapeAttribute(name)}">${escapeHtml(name)}</span><button class="note-image-remove" type="button" data-remove-note-image aria-label="移除图片" title="移除图片">×</button></span>`;
        }
        async function removeNoteImage(button) {
          const image = button?.closest('.note-image');
          if (!image) return;
          const version = noteEditorVersion;
          const name = image.querySelector('img')?.alt || '图片';
          if (!(await confirmConversationDeletion(name, { heading: '移除这张图片？', description: '确认后将从当前笔记正文移除这张图片，保存笔记后生效。', action: '移除图片' }))) return;
          if (version !== noteEditorVersion || !image.isConnected) return;
          image.remove(); noteSelection = null; noteEditorContent.focus();
        }
        function editableNoteMarkup(content) {
          return renderNoteMarkup(content, noteImageMarkup);
        }
        function noteEditorMarkdown() {
          const read = node => {
            if (node.nodeType === Node.TEXT_NODE) return node.textContent;
            if (node.nodeType !== Node.ELEMENT_NODE) return '';
            if (node.matches('.note-image')) {
              const img = node.querySelector('img');
              return img ? `![${(img.alt || '图片').replace(/[\[\]\r\n]/g, '')}](${img.getAttribute('src')})` : '';
            }
            if (node.tagName === 'BR') return '\n';
            if (node.tagName === 'BUTTON') return '';
            return Array.from(node.childNodes).map(read).join('') + (/^(DIV|P)$/.test(node.tagName) ? '\n' : '');
          };
          return Array.from(noteEditorContent.childNodes).map(read).join('').trim();
        }
        function rememberNoteSelection() {
          const selection = window.getSelection();
          if (selection?.rangeCount && noteEditorContent.contains(selection.anchorNode)) noteSelection = selection.getRangeAt(0).cloneRange();
        }
        function restoreNoteSelection() {
          noteEditorContent.focus();
          const selection = window.getSelection();
          const range = noteSelection && noteEditorContent.contains(noteSelection.startContainer) ? noteSelection : document.createRange();
          if (range !== noteSelection) { range.selectNodeContents(noteEditorContent); range.collapse(false); }
          selection.removeAllRanges(); selection.addRange(range);
        }
        async function addNoteImages(files) {
          const version = noteEditorVersion;
          rememberNoteSelection(); noteImagesPending++;
          document.querySelector('#saveNoteButton').disabled = true;
          try {
            for (const file of files) {
              if (!/^image\/(png|jpeg|webp)$/.test(file.type) || !file.size || file.size > 16_000_000) throw new Error('请选择 PNG、JPG 或 WebP；单张图片不能超过 16 MB。');
              const src = await storeImage(await blobAsDataUrl(file));
              if (version !== noteEditorVersion || noteEditor.hidden) return;
              if (noteEditorMarkdown().length + src.length > 4_400_000) throw new Error('当前笔记的图片总量过大，请分成两篇笔记保存。');
              restoreNoteSelection();
              document.execCommand('insertHTML', false, noteImageMarkup(src, file.name || '粘贴截图') + '<br>');
              rememberNoteSelection();
            }
          } catch (error) { showToast(error.message || '插入图片失败'); }
          finally { noteImagesPending--; document.querySelector('#saveNoteButton').disabled = noteImagesPending > 0; }
        }
        function previewNoteImage(image) {
          imageViewer.open(image.getAttribute('src'));
        }
        async function discardNoteChanges() {
          if (noteEditor.hidden || noteOriginal === JSON.stringify([noteEditorTitle.value, noteEditorMarkdown()])) return true;
          return confirmConversationDeletion('', { heading: '放弃未保存的笔记？', description: '本次修改还没有保存，放弃后无法恢复。', action: '放弃修改' });
        }
        async function closeNotesModal() {
          if (!(await discardNoteChanges())) return;
          notesModal.hidden = true; closeNoteEditor();
        }
        async function openNoteEditor(note = null) {
          if (!(await discardNoteChanges())) return;
          noteEditorVersion++; noteSelection = null;
          noteEditorId.value = note?.id || '';
          noteEditorTitle.value = note?.title || '';
          noteEditorContent.innerHTML = editableNoteMarkup(note ? noteBody(note) : '');
          noteOriginal = JSON.stringify([noteEditorTitle.value, noteEditorMarkdown()]);
          document.querySelector('#noteEditorHeading').textContent = note ? '编辑笔记' : '新建笔记';
          document.querySelector('#saveNoteButton').textContent = note ? '保存修改' : '保存笔记';
          noteEditor.hidden = false;
          noteEditor.scrollIntoView({ block: 'nearest' }); noteEditorTitle.focus();
        }
        function closeNoteEditor() {
          noteEditorVersion++; noteSelection = null;
          noteEditor.hidden = true; noteEditor.reset(); noteEditorId.value = ''; noteEditorContent.innerHTML = ''; noteOriginal = '';
        }
        async function saveEditedNote() {
          const id = noteEditorId.value;
          const title = noteEditorTitle.value.trim(); const content = noteEditorMarkdown();
          if (noteImagesPending) { showToast('图片正在插入，请稍后保存。'); return; }
          if (!title || !content) { showToast('笔记标题和正文都不能为空。'); return; }
          if (content.length > 4_500_000) { showToast('笔记过大，请减少图片或拆成两篇。'); return; }
          const button = document.querySelector('#saveNoteButton'); button.disabled = true;
          try {
            const response = await fetch(id ? `/api/notes/${encodeURIComponent(id)}` : '/api/notes', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) });
            const data = await response.json();
            if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : '保存笔记失败，请检查输入。');
            closeNoteEditor(); notesSearchInput.value = ''; await loadNotes();
            showToast(`笔记“${data.title || title}”已保存。`);
          } finally { button.disabled = false; }
        }
        async function deleteNote(noteId) {
          const note = loadedNotes.find((item) => item.id === noteId);
          const title = note?.title || '这条笔记';
          if (!noteId || !(await confirmConversationDeletion(title, { heading: '删除这篇笔记？', description: `“${title}”及其笔记图片将被删除，无法恢复。` }))) return;
          const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.detail || '删除笔记失败');
          if (noteEditorId.value === noteId) closeNoteEditor();
          await loadNotes();
          showToast(`笔记“${data.title || title}”已删除。`);
        }
        async function loadNotes() {
          const query = notesSearchInput.value.trim();
          workspace.notesStatus = '正在读取当前账户的笔记…'; workspace.notesError = false;
          try {
            const response = await fetch(`/api/notes?query=${encodeURIComponent(query)}`, { cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || '无法读取笔记');
            loadedNotes = Array.isArray(data.notes) ? data.notes : [];
            workspace.notes = structuredClone(loadedNotes); workspace.notesStatus = "";
          } catch (error) { workspace.notesStatus = error.message || '无法读取笔记'; workspace.notesError = true; }
        }
        function taskFormData() {
          return { title: document.querySelector('#taskTitle').value.trim(), due_date: document.querySelector('#taskDue').value,
            priority: document.querySelector('#taskPriority').value, status: document.querySelector('#taskStatus').value,
            description: document.querySelector('#taskDescription').value.trim() };
        }
        async function discardTaskChanges() {
          if (taskEditor.hidden || taskEditor.dataset.original === JSON.stringify(taskFormData())) return true;
          return confirmConversationDeletion('', { heading: '放弃未保存的任务？', description: '本次修改还没有保存，放弃后无法恢复。', action: '放弃修改' });
        }
        async function closeTasksModal() { if (await discardTaskChanges()) { tasksModal.hidden = true; taskEditor.hidden = true; taskLoadVersion++; } }
        async function openTaskEditor(task = null) {
          if (!(await discardTaskChanges())) return;
          taskEditor.reset(); document.querySelector('#taskEditorId').value = task?.id || '';
          document.querySelector('#taskTitle').value = task?.title || '';
          document.querySelector('#taskDescription').value = task?.description || '';
          const due = task?.due_date || '';
          document.querySelector('#taskDue').value = due.slice(0, 10);
          document.querySelector('#taskPriority').value = task?.priority || '普通';
          document.querySelector('#taskStatus').value = task?.status || '未完成';
          ['#taskDue', '#taskPriority', '#taskStatus'].forEach((selector) =>
            document.querySelector(selector).dispatchEvent(new Event('change', { bubbles: true })));
          document.querySelector('#taskEditorHeading').textContent = task ? '编辑任务' : '新建任务';
          taskEditor.dataset.original = JSON.stringify(taskFormData()); taskEditor.hidden = false;
          taskEditor.scrollIntoView({ block: 'nearest' }); document.querySelector('#taskTitle').focus();
        }
        async function taskRequest(url, method, body) {
          const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
          const data = await response.json();
          if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail.map(item => item.msg).join('；') : '任务保存失败，请稍后重试。');
          return data;
        }
        async function saveTask() {
          const id = document.querySelector('#taskEditorId').value; const data = taskFormData();
          if (!data.title) { showToast('请填写任务标题。'); return; }
          const button = document.querySelector('#saveTaskButton'); button.disabled = true;
          try {
            await taskRequest(id ? `/api/tasks/${encodeURIComponent(id)}` : '/api/tasks', id ? 'PUT' : 'POST', data);
            taskEditor.hidden = true; taskEditor.reset();
            document.querySelector('#taskSearch').value = ''; document.querySelector('#taskFilter').value = '全部';
            await loadTasks(); showToast('任务已保存。');
          } catch (error) { showToast(error.message); } finally { button.disabled = false; }
        }
        async function loadTasks() {
          const version = ++taskLoadVersion;
          const query = document.querySelector('#taskSearch').value.trim(); const filter = document.querySelector('#taskFilter').value;
          workspace.tasksStatus = '正在读取任务…'; workspace.tasksError = false;
          try {
            const response = await fetch(`/api/tasks?query=${encodeURIComponent(query)}&status=${encodeURIComponent(filter)}`, { cache: 'no-store' });
            const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取任务');
            if (version !== taskLoadVersion) return;
            loadedTasks = data.tasks || []; document.querySelector('#taskCount').textContent = `当前显示 ${loadedTasks.length} 个任务`;
            workspace.tasks = structuredClone(loadedTasks); workspace.tasksStatus = "";
          } catch (error) { if (version === taskLoadVersion) { workspace.tasksStatus = error.message; workspace.tasksError = true; } }
        }
        async function openTasksModal() {
          closeTopPanels('tasks'); tasksModal.hidden = false; taskEditor.hidden = true;
          document.querySelector('#taskSearch').value = ''; document.querySelector('#taskFilter').value = '全部'; await loadTasks();
        }
        listen(document.querySelector('#openTasks'), 'click', openTasksModal);
        listen(document.querySelector('#closeTasks'), 'click', closeTasksModal);
        listen(document.querySelector('#newTask'), 'click', () => openTaskEditor());
        listen(document.querySelector('#cancelTaskEdit'), 'click', async () => { if (await discardTaskChanges()) taskEditor.hidden = true; });
        listen(taskEditor, 'submit', event => { event.preventDefault(); saveTask(); });
        listen(document.querySelector('#searchTasks'), 'click', loadTasks);
        listen(document.querySelector('#taskFilter'), 'change', loadTasks);
        listen(document.querySelector('#taskSearch'), 'keydown', event => { if (event.key === 'Enter' && !event.isComposing) loadTasks(); });
        listen(taskList, 'click', async event => {
          const button = event.target.closest('button'); if (!button) return;
          const id = button.dataset.taskEdit || button.dataset.taskStatus || button.dataset.taskDelete;
          const task = loadedTasks.find(item => String(item.id) === id); if (!task) return;
          if (button.dataset.taskEdit) { openTaskEditor(task); return; }
          try {
            if (button.dataset.taskDelete) {
              if (!(await confirmConversationDeletion(task.title, { heading: '删除这个任务？', description: `“${task.title}”将被永久删除。` }))) return;
              await taskRequest(`/api/tasks/${task.id}`, 'DELETE');
            } else {
              await taskRequest(`/api/tasks/${task.id}`, 'PUT', { title: task.title, due_date: task.due_date, priority: task.priority, description: task.description || '', status: task.status === '已完成' ? '未完成' : '已完成' });
            }
            if (document.querySelector('#taskEditorId').value === id) taskEditor.hidden = true;
            await loadTasks(); showToast(button.dataset.taskDelete ? '任务已删除。' : '任务状态已保存。');
          } catch (error) { showToast(error.message); }
        });
        function renderBriefTask(task) {
          return `<article class="brief-card"><div class="brief-task-heading"><strong>#${task.id} · ${escapeHtml(task.title)}</strong><button class="brief-task-complete" data-complete-task="${task.id}" type="button" title="标记为已完成">完成</button></div><small>${escapeHtml(task.status)} · ${escapeHtml(task.due_date || '无截止日期')} · 优先级 ${escapeHtml(task.priority || '普通')}</small></article>`;
        }
        async function completeBriefTask(taskId) {
          try {
            const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/complete`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || '完成待办失败');
            showToast(`待办 #${taskId} 已完成。`);
            await openDailyBrief();
          } catch (error) { showToast(error.message || '完成待办失败'); }
        }
        async function openDailyBrief() {
          dailyBriefModal.hidden = false; dailyBriefBody.innerHTML = '<div class="lens-empty">正在整理你的本地资料…</div>';
          try {
            const response = await fetch('/api/brief'); const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取今日简报');
            const counts = data.counts || {};
            const taskLines = (data.due_today || []).concat(data.overdue || []).slice(0, 8);
            const noteLines = (data.notes || []).slice(0, 5);
            dailyBriefBody.innerHTML = `<div class="brief-grid"><div class="brief-stat"><b>${counts.open_tasks || 0}</b><span>未完成待办</span></div><div class="brief-stat"><b>${counts.due_today || 0}</b><span>今日到期</span></div><div class="brief-stat"><b>${counts.overdue || 0}</b><span>已逾期</span></div><div class="brief-stat"><b>${counts.knowledge_bases || 0}</b><span>知识库</span></div></div><section class="brief-section"><h3>需要优先处理</h3><div class="brief-list">${taskLines.length ? taskLines.map(renderBriefTask).join('') : '<div class="lens-empty">今天没有需要优先处理的待办。</div>'}</div></section><section class="brief-section"><h3>最近笔记</h3><div class="brief-list">${noteLines.length ? noteLines.map((note) => `<article class="brief-card"><strong>${escapeHtml(note.title || '未命名笔记')}</strong><small>${escapeHtml(note.excerpt || '')}</small></article>`).join('') : '<div class="lens-empty">还没有本地笔记。</div>'}</div></section><section class="brief-section"><h3>建议的复盘动作</h3><button class="lens-next" data-brief-prompt="请根据我今天的待办和最近笔记，生成一个 10 分钟的复盘清单。" type="button">生成 10 分钟复盘清单　↗</button></section>`;
          } catch (error) { dailyBriefBody.innerHTML = `<div class="warning">${escapeHtml(error.message || '无法读取今日简报')}</div>`; }
        }
        async function openContextGraph() {
          contextGraphModal.hidden = false; contextGraphBody.innerHTML = '<div class="lens-empty">正在绘制你的本地脉络…</div>';
          try {
            const response = await fetch('/api/context-graph'); const data = await response.json(); if (!response.ok) throw new Error(data.detail || '无法读取个人脉络');
            const nodes = data.nodes || []; const edges = data.edges || [];
            contextGraphBody.innerHTML = `<div class="graph-summary">${data.summary?.nodes || nodes.length} 个节点 · ${data.summary?.edges || edges.length} 条关系。关系全部来自本地文件与本地任务，不会上传。</div><div class="graph-list">${nodes.map((node) => { const related = edges.filter((edge) => edge.from === node.id || edge.to === node.id).length; return `<article class="graph-node"><strong><span class="graph-kind">${escapeHtml(node.kind || '节点')}</span>${escapeHtml(node.label || '未命名')}</strong><small>${escapeHtml(node.meta || '')} · ${related} 条关系</small></article>`; }).join('')}</div>`;
          } catch (error) { contextGraphBody.innerHTML = `<div class="warning">${escapeHtml(error.message || '无法读取个人脉络')}</div>`; }
        }
        
        
        
        
        
        
        
  
        listen(document.querySelector('#newChat'), 'click', () => { const item = newConversation(); state.conversations.unshift(item); state.activeId = item.id; showArchivedConversations = false; selectedFiles = new Set(); render(); refreshAttachments(item.id); question.focus(); });
        listen(conversationSearch, 'input', () => render(false));
        listen(toggleArchived, 'click', () => {
          showArchivedConversations = !showArchivedConversations;
          const firstInView = state.conversations.find((item) => item.archived === showArchivedConversations);
          if (firstInView && activeConversation().archived !== showArchivedConversations) state.activeId = firstInView.id;
          render(false);
        });
        listen(document.querySelector('#exportState'), 'click', exportState);
        listen(document.querySelector('#importState'), 'click', () => stateImportInput.click());
        listen(stateImportInput, 'change', () => importState(stateImportInput.files?.[0]));
        
        
        
        listen(deleteSelected, 'click', () => deleteFiles([...selectedFiles]));
        listen(document.querySelector('.suggestions'), 'click', (event) => { const prompt = event.target.closest('[data-prompt]')?.dataset.prompt; if (prompt) sendMessage(prompt); });
        listen(ask, 'click', () => { if (sending) { activeRequestController?.abort(); return; } sendMessage(); });
        listen(question, 'input', () => { activeConversation().draft = question.value; saveState(); resizeComposer(); });
        listen(question, 'paste', event => {
          const images = Array.from(event.clipboardData?.files || []).filter(file => file.type.startsWith('image/'));
          if (!images.length) return; // Keep the browser's normal text paste and undo behavior.
          event.preventDefault();
          const text = event.clipboardData.getData('text/plain');
          if (text) insertTextAtCursor(question, text);
          uploadFiles(pastedImageFiles(images));
        });
        listen(question, 'keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); sendMessage(); } });
        listen(executionMode, 'click', () => { const current = activeConversation(); current.executionMode = current.executionMode === 'plan' ? 'auto' : 'plan'; saveState(); render(false); question.focus(); });
        listen(messages, 'click', (event) => {
          const copyCodeButton = event.target.closest('[data-copy-code]');
          if (copyCodeButton) {
            event.preventDefault();
            event.stopPropagation();
            const code = copyCodeButton.closest('.code-block')?.querySelector('code')?.textContent || '';
            copyPlainText(code);
            copyCodeButton.classList.add('copied');
            copyCodeButton.setAttribute('aria-label', '已复制');
            copyCodeButton.title = '已复制';
            later(() => {
              if (!copyCodeButton.isConnected) return;
              copyCodeButton.classList.remove('copied');
              copyCodeButton.setAttribute('aria-label', '复制这段代码');
              copyCodeButton.title = '复制代码';
            }, 1200);
            return;
          }
          const expandCodeButton = event.target.closest('[data-expand-code]');
          if (expandCodeButton) {
            event.preventDefault();
            event.stopPropagation();
            const block = expandCodeButton.closest('.code-block');
            if (!block) return;
            openCodeViewer(block, expandCodeButton);
            return;
          }
          const attachmentName = event.target.closest('[data-message-file-open]')?.dataset.messageFileOpen;
          if (attachmentName) { openConversationFile(attachmentName); return; }
          if (event.target.closest('[data-inline-edit-cancel]')) { activeConversation().editingMessageId = ''; saveState(); render(false); return; }
          const editInterruptedId = event.target.closest('[data-edit-interrupted]')?.dataset.editInterrupted;
          if (editInterruptedId) { prepareInterruptedEdit(editInterruptedId); return; }
          const saveNoteId = event.target.closest('[data-save-note]')?.dataset.saveNote;
          if (saveNoteId) { saveMessageAsNote(saveNoteId); return; }
          const imageAction = event.target.closest('[data-generated-image-preview]');
          if (imageAction) {
            const data = imageAction.dataset;
            const id = data.generatedImagePreview;
            const source = activeConversation().messages.find(item => item.id === id)?.images?.[Number(data.generatedImageIndex)];
            if (!source) return;
            imageViewer.open(source);
            return;
          }
          const retry = event.target.closest('[data-retry-message]')?.dataset.retryMessage;
          if (retry) { activeConversation().executionMode = 'auto'; saveState(); sendMessage(retry); return; }
          const approve = event.target.closest('[data-approve-plan]')?.dataset.approvePlan;
          if (approve) { activeConversation().executionMode = 'auto'; saveState(); sendMessage(`请按刚才的计划执行：${approve}`); }
        });
        listen(messages, 'submit', (event) => {
          const form = event.target.closest('[data-inline-edit-form]');
          if (!form) return;
          event.preventDefault();
          const content = form.querySelector('textarea')?.value || '';
          sendMessage(content);
        });
        listen(document.querySelector('#openNotes'), 'click', openNotesModal);
        listen(document.querySelector('#closeNotes'), 'click', closeNotesModal);
        listen(document.querySelector('#newNote'), 'click', () => openNoteEditor());
        listen(document.querySelector('#runNotesSearch'), 'click', loadNotes);
        listen(notesSearchInput, 'keydown', (event) => { if (event.key === 'Enter') loadNotes(); });
        listen(notesList, 'click', (event) => { if (event.target.matches('.note-card-body img')) previewNoteImage(event.target); });
        listen(notesList, 'keydown', (event) => {
          if (['Enter', ' '].includes(event.key) && event.target.matches('.note-card-body img')) { event.preventDefault(); previewNoteImage(event.target); }
        });
        
        listen(document.querySelector('#cancelNoteEdit'), 'click', async () => { if (await discardNoteChanges()) closeNoteEditor(); });
        listen(noteEditor, 'submit', (event) => { event.preventDefault(); saveEditedNote().catch((error) => showToast(error.message || '修改笔记失败')); });
        listen(document, 'selectionchange', rememberNoteSelection);
        listen(document.querySelector('#insertNoteImage'), 'click', () => { rememberNoteSelection(); document.querySelector('#noteImageInput').click(); });
        listen(document.querySelector('#noteImageInput'), 'change', async event => { await addNoteImages(Array.from(event.target.files)); event.target.value = ''; });
        listen(noteEditorContent, 'paste', event => {
          const images = Array.from(event.clipboardData?.files || []);
          event.preventDefault();
          if (images.length) { addNoteImages(images); return; }
          insertTextAtCursor(noteEditorContent, event.clipboardData?.getData('text/plain') || '');
        });
        listen(noteEditorContent, 'dragover', event => event.preventDefault());
        listen(noteEditorContent, 'drop', event => { event.preventDefault(); if (event.dataTransfer.files.length) addNoteImages(Array.from(event.dataTransfer.files)); else insertTextAtCursor(noteEditorContent, event.dataTransfer.getData('text/plain')); });
        listen(noteEditorContent, 'click', event => {
          const remove = event.target.closest('[data-remove-note-image]');
          if (remove) { event.preventDefault(); event.stopPropagation(); removeNoteImage(remove); return; }
          if (event.target.matches('img')) previewNoteImage(event.target);
        });
        
        listen(document, 'contextmenu', (event) => {
          if (event.target.matches('img')) { hideTextContextMenu(); return; }
          const surface = event.target.closest('.message-content, .note-card-body, textarea, input, [contenteditable="true"]');
          if (!surface) { hideTextContextMenu(); return; }
          const editable = editableContextTarget(event.target);
          const selectedText = selectedTextForTarget(editable || surface);
          if (!selectedText && !editable) { hideTextContextMenu(); return; }
          event.preventDefault();
          textContextState = { target: surface, editable, selectedText };
          const copyButton = textContextMenu.querySelector('[data-text-context="copy"]');
          const pasteButton = textContextMenu.querySelector('[data-text-context="paste"]');
          copyButton.disabled = !selectedText;
          pasteButton.disabled = !editable;
          textContextMenu.hidden = false;
          const left = Math.min(event.clientX, window.innerWidth - textContextMenu.offsetWidth - 8);
          const top = Math.min(event.clientY, window.innerHeight - textContextMenu.offsetHeight - 8);
          textContextMenu.style.left = `${Math.max(8, left)}px`;
          textContextMenu.style.top = `${Math.max(8, top)}px`;
        });
        listen(textContextMenu, 'click', (event) => {
          const action = event.target.closest('[data-text-context]')?.dataset.textContext;
          if (!action) return;
          const context = textContextState;
          if (action === 'copy' && context?.selectedText) copyPlainText(context.selectedText);
          if (action === 'paste') pasteFromContextMenu();
          hideTextContextMenu();
        });
        listen(document, 'click', (event) => { if (!textContextMenu.contains(event.target)) hideTextContextMenu(); });
        listen(document, 'scroll', hideTextContextMenu, true);
        listen(document, 'keydown', (event) => { if (event.key === 'Escape') hideTextContextMenu(); });
        listen(document.querySelector('#openContextLens'), 'click', () => { closeTopPanels('lens'); renderContextLens(); contextLens.hidden = false; positionContextLens(); });
        listen(document.querySelector('#closeContextLens'), 'click', () => { contextLens.hidden = true; });
        listen(openConversationPreferences, 'click', openConversationPreferencesModal);
        listen(closeConversationPreferences, 'click', closeConversationPreferencesModal);
        listen(cancelConversationPreferences, 'click', closeConversationPreferencesModal);
        listen(conversationPreferencesForm, 'submit', (event) => { event.preventDefault(); saveConversationPreferences(); });
        document.querySelectorAll('[data-preference-example]').forEach((button) => listen(button, 'click', () => {
          const example = button.dataset.preferenceExample || '';
          conversationInstructions.value = conversationInstructions.value.trim() ? `${conversationInstructions.value.trim()}\n${example}` : example;
          conversationInstructions.focus();
        }));
        listen(modelStatus, 'click', () => { const shouldOpen = modelPicker.hidden; closeTopPanels(shouldOpen ? 'model' : ''); setModelPicker(shouldOpen); });
        listen(closeModelPicker, 'click', () => setModelPicker(false));
        listen(chatModelList, 'click', (event) => { const id = event.target.closest('[data-chat-model]')?.dataset.chatModel; if (id) selectChatModel(id); });
        listen(manageChatModels, 'click', () => { setModelPicker(false); openModelSettings(); });
        listen(contextLensBody, 'click', (event) => {
          const prompt = event.target.closest('[data-lens-prompt]')?.dataset.lensPrompt;
          if (!prompt) return;
          contextLens.hidden = true;
          sendMessage(prompt);
        });
        listen(document.querySelector('#attach'), 'click', async () => {
          const open = composerTools.hidden;
          setComposerTools(open);
          if (!open) return;
          renderComposerKnowledgePicker();
          if (!knowledgeBases.length) {
            await refreshKnowledgeBases();
            renderComposerKnowledgePicker();
          }
        });
        listen(fileInput, 'change', () => uploadFiles(fileInput.files));
        listen(document.querySelector('#composer'), 'dragover', (event) => event.preventDefault());
        listen(document.querySelector('#composer'), 'drop', (event) => { event.preventDefault(); uploadFiles(event.dataTransfer.files); });
        listen(composerTools, 'click', async (event) => {
          const knowledgeOption = event.target.closest('[data-composer-kb]');
          if (knowledgeOption) {
            event.preventDefault();
            event.stopPropagation();
            const id = knowledgeOption.dataset.composerKb;
            const current = activeConversation();
            const selected = new Set(current.knowledgeBaseIds || []);
            if (selected.has(id)) selected.delete(id); else selected.add(id);
            current.knowledgeBaseIds = [...selected];
            saveState();
            renderComposerContext();
            setComposerTools(false);
            return;
          }
          const action = event.target.closest('[data-composer-action]')?.dataset.composerAction;
          if (action === 'attachment') { setComposerTools(false); fileInput.click(); return; }
          if (action === 'generate-image') { setComposerTools(false); question.value = question.value.trim() || '生成图片：'; resizeComposer(); question.focus(); return; }
          if (action === 'knowledge') {
            event.preventDefault();
            composerToolMain.hidden = true;
            composerKnowledgePicker.hidden = false;
            renderComposerKnowledgePicker();
            if (!knowledgeBases.length) {
              await refreshKnowledgeBases();
              renderComposerKnowledgePicker();
            }
            return;
          }
          if (event.target.closest('[data-composer-back]')) { composerToolMain.hidden = false; composerKnowledgePicker.hidden = true; return; }
          if (event.target.closest('[data-composer-create-kb]')) { setComposerTools(false); knowledgeModal.hidden = false; refreshKnowledgeBases(); openKnowledgeCreateDialog(); }
        });
        listen(composerContext, 'click', (event) => {
          const id = event.target.closest('[data-remove-composer-kb]')?.dataset.removeComposerKb;
          if (!id) return;
          const current = activeConversation(); current.knowledgeBaseIds = (current.knowledgeBaseIds || []).filter((item) => item !== id); saveState(); renderComposerContext();
        });
        listen(document.querySelector('#closeGlobalSearch'), 'click', () => { globalSearchModal.hidden = true; });
        listen(document.querySelector('#runGlobalSearch'), 'click', runGlobalSearch);
        listen(globalSearchInput, 'keydown', (event) => { if (event.key === 'Enter') runGlobalSearch(); });
        listen(document.querySelector('#closeDailyBrief'), 'click', () => { dailyBriefModal.hidden = true; });
        listen(dailyBriefBody, 'click', (event) => {
          const taskId = event.target.closest('[data-complete-task]')?.dataset.completeTask;
          if (taskId) { completeBriefTask(taskId); return; }
          const prompt = event.target.closest('[data-brief-prompt]')?.dataset.briefPrompt;
          if (!prompt) return;
          dailyBriefModal.hidden = true;
          sendMessage(prompt);
        });
        listen(document.querySelector('#closeContextGraph'), 'click', () => { contextGraphModal.hidden = true; });
        listen(document, 'click', (event) => {
          if (!composerTools.hidden && !composerTools.contains(event.target) && event.target !== document.querySelector('#attach')) setComposerTools(false);
        });
        function defaultSettingsPayload(form) {
          const values = new FormData(form);
          return { chat_model_id: String(values.get('chat_model_id') || ''), fallback_model_id: String(values.get('fallback_model_id') || ''), auto_fallback: values.has('auto_fallback'), temperature: Number(values.get('temperature')), max_tokens: Number(values.get('max_tokens')) };
        }
        function gatewaySettingsPayload(form) {
          const values = new FormData(form);
          return { enabled: values.has('enabled'), base_url: String(values.get('base_url') || '').trim(), api_key: String(values.get('api_key') || '').trim(), clear_api_key: values.has('clear_api_key'), timeout_seconds: Number(values.get('timeout_seconds')), max_retries: Number(values.get('max_retries')) };
        }
        function collectMcpServers() {
          return [...agentSettingsContent.querySelectorAll('[data-mcp-card]')].map((card) => {
            const transport = card.querySelector('[data-mcp-transport]').value;
            const target = card.querySelector('[data-mcp-target]').value.trim();
            const rawArgs = card.querySelector('[data-mcp-args]').value.trim();
            let args = [];
            if (transport === 'stdio' && rawArgs) {
              try { args = rawArgs.startsWith('[') ? JSON.parse(rawArgs) : rawArgs.split(/\s+/); } catch { throw new Error('MCP 参数 JSON 格式错误，例如 ["C:/my tools/server.py"]。'); }
              if (!Array.isArray(args) || args.some((item) => typeof item !== 'string')) throw new Error('MCP 参数必须是字符串数组。');
            }
            return { id: card.dataset.id || '', name: card.querySelector('[data-mcp-name]').value.trim(), transport, command: transport === 'stdio' ? target : '', args, url: transport === 'streamable_http' ? target : '', enabled: card.querySelector('[data-mcp-enabled]').checked, timeout_seconds: Number(card.querySelector('[data-mcp-timeout]').value) };
          });
        }
        async function saveAgentSettingsEndpoint(path, payload) {
          const response = await fetch(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || '保存设置失败');
          agentSettings = data.settings || agentSettings;
          if (data.runtime) agentSettingsRuntime = data.runtime;
          return data;
        }
        async function saveMcpServers(renderAfter = false) {
          const data = await saveAgentSettingsEndpoint('/api/agent-settings/mcp', { servers: collectMcpServers() });
          if (renderAfter) renderMcpSettings();
          else settingsMessage(data.message || 'MCP 服务列表已保存。', 'success');
          return data;
        }
        async function openModelSettings(section = 'services') {
          closeTopPanels();
          modelSettingsModal.hidden = false;
          activeModelServiceId = '';
          await Promise.all([refreshModelServices(), loadChatModels()]);
          await switchModelSettingsSection(section);
        }
        function closeModelSettings() { modelSettingsModal.hidden = true; }
        listen(document.querySelector('#closeModelSettings'), 'click', closeModelSettings);
        listen(document.querySelector('#backModelSettings'), 'click', closeModelSettings);
        listen(modelSettingsNav, 'click', (event) => { const section = event.target.closest('[data-settings-section]')?.dataset.settingsSection; if (section) switchModelSettingsSection(section); });
        listen(agentSettingsContent, 'submit', async (event) => {
          event.preventDefault();
          const form = event.target;
          const submit = form.querySelector('[type="submit"]');
          if (submit) submit.disabled = true;
          try {
            let data;
            if (form.id === 'defaultModelSettingsForm') {
              data = await saveAgentSettingsEndpoint('/api/agent-settings/defaults', defaultSettingsPayload(form));
              await loadChatModels();
            } else if (form.id === 'gatewaySettingsForm') {
              data = await saveAgentSettingsEndpoint('/api/agent-settings/gateway', gatewaySettingsPayload(form));
            }
            if (data) settingsMessage(data.message || '设置已保存。', 'success');
          } catch (error) { settingsMessage(error.message || '保存设置失败', 'error'); }
          finally { if (submit) submit.disabled = false; }
        });
        listen(agentSettingsContent, 'change', (event) => {
          const transport = event.target.closest('[data-mcp-transport]');
          if (!transport) return;
          const card = transport.closest('[data-mcp-card]');
          const isHttp = transport.value === 'streamable_http';
          card.querySelector('[data-mcp-target-label]').textContent = isHttp ? 'MCP 地址' : '启动命令';
          card.querySelector('[data-mcp-target]').placeholder = isHttp ? 'https://example.com/mcp' : 'npx / 可执行文件路径';
          card.querySelector('[data-mcp-args]').disabled = isHttp;
        });
        listen(agentSettingsContent, 'click', async (event) => {
          const button = event.target.closest('button');
          if (!button) return;
          try {
            if (button.matches('[data-local-discover]')) {
              button.dataset.idleText = button.textContent; button.disabled = true; button.textContent = '正在扫描…';
              const response = await fetch('/api/local-models/discover', { method: 'POST' }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || '扫描本地模型失败');
              discoveredLocalProviders = data.providers || []; renderLocalModelSettings(); return;
            }
            if (button.matches('[data-local-import]')) {
              button.disabled = true;
              const response = await fetch('/api/local-models/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: button.dataset.provider, model: button.dataset.model, base_url: button.dataset.baseUrl }) }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || '添加本地模型失败');
              await Promise.all([refreshModelServices(), loadChatModels()]); renderLocalModelSettings(); showToast(data.message || '本地模型已添加。'); return;
            }
            if (button.matches('[data-gateway-test]')) {
              button.dataset.idleText = button.textContent; button.disabled = true; button.textContent = '正在测试…';
              const form = agentSettingsContent.querySelector('#gatewaySettingsForm');
              await saveAgentSettingsEndpoint('/api/agent-settings/gateway', gatewaySettingsPayload(form));
              const response = await fetch('/api/agent-settings/gateway/test', { method: 'POST' }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || '网关连接失败');
              discoveredGatewayModels = data.models || []; renderGatewaySettings(); settingsMessage(data.message || '网关连接成功。', 'success'); return;
            }
            if (button.matches('[data-gateway-import]')) {
              button.disabled = true;
              const providerName = window.prompt('给这组网关模型起一个服务商名称', 'API 网关');
              if (providerName === null) { button.disabled = false; return; }
              const response = await fetch('/api/agent-settings/gateway/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: providerName.trim() || 'API 网关', model: button.dataset.model }) }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || '导入网关模型失败');
              await Promise.all([refreshModelServices(), loadChatModels()]); showToast(data.message || '网关模型已导入。'); return;
            }
            if (button.matches('[data-mcp-add]')) {
              agentSettings.mcp_servers = collectMcpServers();
              agentSettings.mcp_servers.push({ id: '', name: '', transport: 'stdio', command: '', args: [], url: '', enabled: true, timeout_seconds: 30 }); renderMcpSettings();
              agentSettingsContent.querySelector('[data-mcp-card]:last-child [data-mcp-name]')?.focus(); return;
            }
            if (button.matches('[data-mcp-delete]')) {
              const snapshot = collectMcpServers();
              button.closest('[data-mcp-card]').remove();
              const list = agentSettingsContent.querySelector('[data-mcp-list]');
              if (list && !list.querySelector('[data-mcp-card]')) list.innerHTML = settingsEmpty('⌁', '还没有 MCP 连接', '点击右上角“添加连接”开始配置。');
              try {
                await saveMcpServers(true);
                showToast('MCP 连接已删除。');
              } catch (error) {
                agentSettings.mcp_servers = snapshot;
                renderMcpSettings();
                throw error;
              }
              return;
            }
            if (button.matches('[data-mcp-save]')) { button.disabled = true; await saveMcpServers(true); showToast('MCP 服务列表已保存。'); return; }
            if (button.matches('[data-mcp-connect]')) {
              const serverId = button.closest('[data-mcp-card]').dataset.id;
              if (!window.confirm('连接测试会启动已配置的本地命令或访问该 HTTP 地址，读取工具列表，但不会执行工具。请只测试你信任的服务。')) return;
              button.disabled = true; await saveMcpServers(false);
              const response = await fetch(`/api/agent-settings/mcp/${encodeURIComponent(serverId)}/connect`, { method: 'POST' }); const data = await response.json();
              if (!response.ok || !data.ok) throw new Error(data.detail || '协议连接失败');
              settingsMessage(data.message + (data.tools?.length ? ' 工具：' + data.tools.map((item) => item.name).join('、') : ''), 'success'); button.disabled = false; return;
            }
            if (button.matches('[data-mcp-check]')) {
              const serverId = button.closest('[data-mcp-card]').dataset.id;
              button.disabled = true; await saveMcpServers(false);
              const response = await fetch(`/api/agent-settings/mcp/${encodeURIComponent(serverId)}/check`, { method: 'POST' }); const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.message || data.detail || '连接检查失败');
              settingsMessage(data.message || '连接可用。', 'success'); button.disabled = false; return;
            }
          } catch (error) { settingsMessage(error.message || '操作失败', 'error'); if (button.isConnected) { button.disabled = false; if (button.dataset.idleText) button.textContent = button.dataset.idleText; } }
        });
        listen(addModelService, 'click', () => openModelServiceCreateDialog('综合服务'));
        listen(document.querySelector('#closeModelServiceCreate'), 'click', closeModelServiceCreateDialog);
        listen(document.querySelector('#cancelModelServiceCreate'), 'click', closeModelServiceCreateDialog);
        listen(modelServiceCreateForm, 'submit', (event) => { event.preventDefault(); createModelService(); });
        listen(document, 'keydown', (event) => { if (event.key !== 'Escape') return; const expandedCodeBlock = document.querySelector('.code-block.expanded'); if (expandedCodeBlock) { expandedCodeBlock.classList.remove('expanded'); document.body.classList.remove('code-block-expanded'); const expandButton = expandedCodeBlock.querySelector('[data-expand-code]'); if (expandButton) { expandButton.setAttribute('aria-label', '全屏查看代码'); expandButton.title = '全屏查看'; } } if (!modelPicker.hidden) setModelPicker(false); if (!modelServiceCreateModal.hidden) closeModelServiceCreateDialog(); if (!modelServiceEditModal.hidden) closeModelServiceEditDialog(); if (!knowledgeCreateModal.hidden) closeKnowledgeCreateDialog(); if (!modelSettingsModal.hidden) closeModelSettings(); if (theme.visible) theme.close(); if (!contextLens.hidden) contextLens.hidden = true; if (!globalSearchModal.hidden) globalSearchModal.hidden = true; if (!document.querySelector('dialog[open]')) { if (!notesModal.hidden) closeNotesModal(); if (!tasksModal.hidden) closeTasksModal(); } if (!dailyBriefModal.hidden) dailyBriefModal.hidden = true; if (!contextGraphModal.hidden) contextGraphModal.hidden = true; if (!conversationPreferencesModal.hidden) closeConversationPreferencesModal(); });
        listen(modelServiceSearch, 'input', renderModelServices);
        listen(modelServiceDirectory, 'click', (event) => { const id = event.target.closest('[data-provider-select]')?.dataset.providerSelect; if (!id) return; activeModelServiceId = id; renderModelServices(); });
        listen(modelServiceList, 'click', (event) => {
          const provider = activeModelProvider();
          if (!provider) return;
          if (event.target.closest('[data-provider-edit]')) { openModelServiceEditor(provider.services.find((service) => service.provider_only) || provider.services[0], 'provider', provider); return; }
          if (event.target.closest('[data-provider-add-model]')) { openModelServiceCreateDialog(provider.providerType || '大模型', provider); return; }
          if (event.target.closest('[data-provider-delete]')) { deleteModelProvider(provider); return; }
          const card = event.target.closest('[data-service-id]');
          if (!card) return;
          const service = modelServices.find((item) => item.id === card.dataset.serviceId);
          if (!service) return;
          const reveal = event.target.closest('[data-service-reveal]');
          if (reveal) { revealModelServiceKey(service.id, card.querySelector('[data-service-key]'), reveal); return; }
          if (event.target.closest('[data-model-edit]')) openModelServiceEditor(service, 'model', provider);
          if (event.target.closest('[data-service-save]')) saveModelService(card);
          if (event.target.closest('[data-service-clear]')) saveModelService(card, true);
          if (event.target.closest('[data-model-delete]')) deleteModelService(service);
        });
        listen(modelServiceList, 'input', (event) => { if (event.target.matches('[data-service-key], [data-service-url]')) markModelServiceDraftDirty(event.target.closest('[data-service-id]')); });
        listen(document, 'click', (event) => { const toggle = event.target.closest('[data-secret-target]'); if (!toggle) return; const input = document.querySelector(`#${toggle.dataset.secretTarget}`); if (!input) return; const masked = input.classList.toggle('secret-input-masked'); toggle.textContent = masked ? '◉' : '◉̸'; });
        listen(document, 'input', (event) => { if (event.target.matches('[data-service-key], #modelServiceEditKey, #modelServiceKey')) event.target.dataset.keyLoaded = 'true'; });
        listen(document.querySelector('#modelServiceType'), 'change', () => updateModelServiceRequirement('create'));
        listen(document.querySelector('#modelServiceEditType'), 'change', () => updateModelServiceRequirement('edit'));
        listen(document.querySelector('#modelServiceName'), 'input', (event) => { event.target.setCustomValidity(''); document.querySelector('#modelServiceCreateError').textContent = ''; });
        listen(document.querySelector('#modelServiceProviderType'), 'change', (event) => { event.target.setCustomValidity(''); document.querySelector('#modelServiceCreateError').textContent = ''; });
        listen(document.querySelector('#modelServiceEditName'), 'input', (event) => { event.target.setCustomValidity(''); document.querySelector('#modelServiceEditError').textContent = ''; });
        listen(document.querySelector('#modelServiceEditProviderType'), 'change', (event) => { event.target.setCustomValidity(''); document.querySelector('#modelServiceEditError').textContent = ''; });
        listen(document.querySelector('#modelServiceProvider'), 'change', () => { document.querySelector('#modelServiceCreateError').textContent = ''; });
        listen(document.querySelector('#modelServiceEditProvider'), 'change', () => { document.querySelector('#modelServiceEditError').textContent = ''; });
        setupBoundedProviderSelect(document.querySelector('#modelServiceProvider'));
        setupBoundedProviderSelect(document.querySelector('#modelServiceEditProvider'));
        listen(document.querySelector('#modelServiceModel'), 'input', (event) => event.target.setCustomValidity(''));
        listen(document.querySelector('#modelServiceEditModel'), 'input', (event) => event.target.setCustomValidity(''));
        listen(modelServiceEditForm, 'click', (event) => { const toggle = event.target.closest('[data-edit-reveal]'); if (!toggle) return; const input = document.querySelector('#modelServiceEditKey'); const id = document.querySelector('#modelServiceEditId').value; revealModelServiceKey(id, input, toggle); });
        listen(document.querySelector('#closeModelServiceEdit'), 'click', closeModelServiceEditDialog);
        listen(document.querySelector('#cancelModelServiceEdit'), 'click', closeModelServiceEditDialog);
        listen(modelServiceEditForm, 'submit', (event) => { event.preventDefault(); saveModelServiceProfile(); });
        listen(knowledgeButton, 'click', async () => { setComposerTools(false); closeTopPanels('knowledge'); knowledgeModal.hidden = false; await Promise.all([refreshKnowledgeBases(), refreshModelServices()]); renderKnowledgeBases(); });
        listen(document.querySelector('#closeKnowledge'), 'click', () => { knowledgeModal.hidden = true; knowledgeSettings.hidden = true; knowledgeWorkspace.style.transform = ''; knowledgeWorkspace.dataset.offsetX = '0'; knowledgeWorkspace.dataset.offsetY = '0'; });
        listen(document.querySelector('#closeDocumentInspect'), 'click', () => { documentInspectModal.hidden = true; });
        listen(backDocumentInspect, 'click', () => { documentInspectModal.hidden = true; });
        listen(document.querySelector('#openKnowledgeCreate'), 'click', openKnowledgeCreateDialog);
        listen(document.querySelector('#closeKnowledgeCreate'), 'click', closeKnowledgeCreateDialog);
        listen(document.querySelector('#cancelKnowledgeCreate'), 'click', closeKnowledgeCreateDialog);
        listen(knowledgeEmbedding, 'change', updateKnowledgeCreateHint);
        listen(openKnowledgeCreateModelSettings, 'click', () => { closeKnowledgeCreateDialog(); openModelSettings(); });
        listen(document.querySelector('#knowledgeCreate'), 'submit', async (event) => {
          event.preventDefault(); const input = document.querySelector('#knowledgeName'); const name = input.value.trim();
          if (!name) { knowledgeCreateMessage.textContent = '请输入知识库名称。'; input.focus(); return; }
          const submit = event.currentTarget.querySelector('[type="submit"]');
          submit.disabled = true;
          knowledgeCreateMessage.textContent = '';
          try { await createKnowledgeBase(name, knowledgeEmbedding.value); closeKnowledgeCreateDialog(); }
          catch (error) {
            const message = error.message || '创建知识库失败';
            knowledgeCreateMessage.textContent = message;
            const needsConfig = /API Key|需要先配置|模型服务/.test(message);
            openKnowledgeCreateModelSettings.hidden = !needsConfig;
            if (!needsConfig) showToast(message);
          } finally { submit.disabled = false; }
        });
        listen(knowledgeList, 'click', (event) => {
          const id = event.target.closest('[data-kb-open]')?.dataset.kbOpen;
          if (id) selectKnowledgeBase(id);
        });
        listen(knowledgeContent, 'change', (event) => {
          const id = event.target.dataset.kbSelect;
          if (id) {
            const current = activeConversation(); const selected = new Set(current.knowledgeBaseIds || []);
            if (event.target.checked) selected.add(id); else selected.delete(id);
            current.knowledgeBaseIds = [...selected]; saveState(); renderKnowledgeBases(); return;
          }
          const filename = event.target.dataset.documentSelect;
          if (filename) { if (event.target.checked) selectedKnowledgeDocuments.add(filename); else selectedKnowledgeDocuments.delete(filename); renderKnowledgeBases(); return; }
          if (event.target.dataset.documentSelectAll !== undefined) { selectedKnowledgeDocuments = event.target.checked ? new Set(knowledgeDocuments.map((item) => item.filename)) : new Set(); renderKnowledgeBases(); }
        });
        listen(knowledgeContent, 'click', async (event) => {
          if (event.target.closest('[data-open-create]')) { openKnowledgeCreateDialog(); return; }
          if (event.target.closest('[data-open-settings]')) { knowledgeSettings.hidden = false; renderKnowledgeSettings(knowledgeBaseById(editingKnowledgeBaseId)); await refreshModelServices(); return; }
          if (event.target.closest('[data-open-model-settings]')) { openModelSettings(); return; }
          if (event.target.closest('[data-toggle-sources]')) { const menu = document.querySelector('#sourceMenu'); if (menu) menu.hidden = !menu.hidden; return; }
          const action = event.target.closest('[data-source-action]')?.dataset.sourceAction;
          if (action === 'file') { knowledgeFileInput.dataset.knowledgeBaseId = editingKnowledgeBaseId || ''; knowledgeFileInput.click(); return; }
          if (action === 'directory') { knowledgeFileInput.dataset.knowledgeBaseId = editingKnowledgeBaseId || ''; knowledgeDirectoryInput.click(); return; }
          if (event.target.closest('[data-document-menu]')) {
            const menu = event.target.closest('.document-row-actions')?.querySelector('.document-action-menu');
            document.querySelectorAll('.document-action-menu').forEach((item) => { if (item !== menu) item.hidden = true; });
            if (menu) menu.hidden = !menu.hidden;
            return;
          }
          const documentAction = event.target.closest('[data-document-action]');
          if (documentAction) {
            documentAction.closest('.document-action-menu').hidden = true;
            const filename = documentAction.dataset.documentName;
            if (documentAction.dataset.documentAction === 'source') await inspectKnowledgeDocument(filename, 'source');
            if (documentAction.dataset.documentAction === 'chunks') await inspectKnowledgeDocument(filename, 'chunks');
            if (documentAction.dataset.documentAction === 'reparse') await reparseKnowledgeDocument(filename);
            return;
          }
          if (event.target.closest('[data-delete-documents]')) { try { await deleteKnowledgeDocuments(); } catch (error) { showToast(error.message || '删除数据源失败'); } }
        });
        listen(knowledgeSettings, 'submit', async (event) => {
          const form = event.target.closest('#knowledgeSettingsForm'); if (!form) return;
          event.preventDefault(); try { await saveKnowledgeBaseSettings(form); } catch (error) { await refreshModelServices(); showToast(error.message || '保存设置失败'); }
        });
        listen(knowledgeSettings, 'input', (event) => {
          const input = event.target.closest('input[name="top_k"]');
          if (!input) return;
          const form = input.closest('#knowledgeSettingsForm');
          if (!form) return;
          const value = String(input.value);
          const output = form.querySelector('[data-top-k-value]');
          const hint = form.querySelector('[data-top-k-hint]');
          if (output) output.textContent = value;
          if (hint) hint.textContent = value;
        });
        listen(knowledgeSettings, 'change', (event) => {
          if (event.target.matches('select[name="document_processor"], select[name="embedding_model"], select[name="reranker"]')) updateKnowledgeProviderStatus(event.target.closest('#knowledgeSettingsForm'));
        });
        listen(knowledgeSettings, 'click', async (event) => {
          if (event.target.closest('[data-open-model-settings]')) { openModelSettings(); return; }
          if (event.target.closest('[data-close-settings]')) { knowledgeSettings.hidden = true; return; }
          const deleteId = event.target.closest('[data-kb-delete]')?.dataset.kbDelete;
          if (deleteId) { try { await removeKnowledgeBase(deleteId); } catch (error) { showToast(error.message || '删除知识库失败'); } }
        });
        listen(knowledgeFileInput, 'change', () => uploadKnowledgeDocuments(knowledgeFileInput.files));
        listen(knowledgeDirectoryInput, 'change', async () => { await uploadKnowledgeDocuments(knowledgeDirectoryInput.files); knowledgeDirectoryInput.value = ''; });
        authTabs.forEach((tab) => listen(tab, 'click', () => setAuthMethod(tab.dataset.authMethod)));
        listen(authSwitch, 'click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
        document.querySelectorAll('[data-password-toggle]').forEach((button) => listen(button, 'click', () => togglePasswordVisibility(button)));
        document.querySelectorAll('.password-field input').forEach((input) => {
          listen(input, 'focus', updateCapsLockHint);
          listen(input, 'keydown', updateCapsLockHint);
          listen(input, 'keyup', updateCapsLockHint);
          listen(input, 'blur', hideCapsLockHint);
        });
        listen(authForm, 'submit', submitAuth);
        listen(phoneAuthForm, 'submit', submitPhoneAuth);
        listen(authUsername, 'input', () => rememberAuthIdentifiers({ passwordUsername: authUsername.value }));
        listen(phoneNumber, 'input', () => rememberAuthIdentifiers({ phoneNumber: phoneNumber.value }));
        listen(sendSmsButton, 'click', sendSmsCode);
        async function logoutCurrentUser() {
          accountLogoutButton.disabled = true;
          saveState();
          await flushDesktopState();
          if (desktopStateError) {
            showToast('对话记录尚未保存成功，请稍后再退出登录。');
            accountLogoutButton.disabled = false;
            return;
          }
          const remembered = readRememberedAuthIdentifiers();
          rememberAuthIdentifiers({ preferredMethod: remembered.preferredMethod });
          try {
            const response = await nativeFetch('/api/auth/logout', { method: 'POST' });
            if (!response.ok) throw new Error('退出登录失败，请重试。');
          } catch (error) {
            showToast(error.message || '无法连接本地服务，请稍后退出登录。');
            accountLogoutButton.disabled = false;
            return;
          }
          authSessionVersion += 1;
          desktopStateEnabled = false;
          desktopStatePending = null;
          authUser = null;
          state = null; workspace.reset();
          modelServices = []; knowledgeModelOptions = null;
          chatModels = [];
          defaultChatModelId = '';
          activeModelServiceId = '';
          activeSettingsSection = 'services';
          agentSettings = null;
          agentSettingsRuntime = null;
          discoveredLocalProviders = [];
          discoveredGatewayModels = [];
          modelSettingsModal.hidden = true;
          modelServiceCreateModal.hidden = true;
          modelServiceEditModal.hidden = true;
          theme.reset();
          modelServiceList.innerHTML = '';
          modelServiceDirectory.innerHTML = '';
          showAuthScreen('login', '已退出登录。');
          accountLogoutButton.disabled = false;
        }
        listen(accountLogoutButton, 'click', logoutCurrentUser);
        listen(sidebarToggle, 'click', () => setSidebarCollapsed(!appShell.classList.contains('sidebar-collapsed')));
        listen(sidebar, 'pointerenter', () => { if (appShell.classList.contains('sidebar-collapsed')) appShell.classList.add('sidebar-peek'); });
        listen(sidebar, 'pointerleave', () => appShell.classList.remove('sidebar-peek'));
        listen(accountProfileButton, 'click', openProfileModal);
        listen(accountThemeButton, 'click', () => { closeTopPanels('theme'); theme.open(); });
        listen(closeProfile, 'click', closeProfileModal);
        listen(cancelProfile, 'click', closeProfileModal);
        listen(profileForm, 'submit', saveProfileDetails);
        listen(chooseProfileAvatar, 'click', () => profileAvatarInput.click());
        listen(profileAvatarInput, 'change', () => selectProfileAvatar(profileAvatarInput.files?.[0]));
        listen(removeProfileAvatar, 'click', () => { pendingProfileAvatar = ''; renderUserAvatar(profileAvatarPreview, authUser, ''); profileAvatarInput.value = ''; profileMessage.textContent = ''; profileMessage.classList.remove('success'); });
        listen(profileAvatarPreview, 'click', openAvatarPreview);
        listen(closeAvatarPreview, 'click', closeAvatarPreviewModal);
        listen(accountButton, 'click', () => {
          const shouldOpen = accountDropdown.hidden;
          closeTopPanels(shouldOpen ? 'account' : '');
          accountDropdown.hidden = !shouldOpen;
          accountButton.classList.toggle('active', shouldOpen);
          accountButton.setAttribute('aria-expanded', String(shouldOpen));
        });
        listen(document, 'click', (event) => {
          if (!accountMenu.contains(event.target)) {
            accountDropdown.hidden = true;
            accountButton.classList.remove('active');
            accountButton.setAttribute('aria-expanded', 'false');
          }
        });
        initializeKnowledgeWorkspaceDrag();
        workspace.connect(async (action, id, checked) => {
          try {
            if (action === 'selectConversation' && id !== state.activeId) { state.activeId = id; selectedFiles = new Set(); render(); await refreshAttachments(id); }
            if (action === 'renameConversation') await renameConversation(id);
            if (action === 'pinConversation') toggleConversationPin(id);
            if (action === 'archiveConversation') toggleConversationArchive(id);
            if (action === 'deleteConversation') await deleteConversation(id);
            if (action === 'openFile') await openConversationFile(id);
            if (action === 'deleteFile') await deleteFiles([id]);
            if (action === 'selectFile') { if (checked) selectedFiles.add(id); else selectedFiles.delete(id); renderAttachments(activeConversation()); }
            if (action === 'editNote') { const note = loadedNotes.find(item => item.id === id); if (note) await openNoteEditor(note); }
            if (action === 'deleteNote') await deleteNote(id);
          } catch (error) { showToast(error.message || '操作失败'); }
        });
        bootAuth();
        return () => {
          authSessionVersion++; theme.reset(); taskLoadVersion++;
          activeRequestController?.abort(); closeCodeViewer();
          lifecycle.dispose(); workspace.connect(undefined); workspace.reset();
          window.fetch = originalFetch;
        };
}

