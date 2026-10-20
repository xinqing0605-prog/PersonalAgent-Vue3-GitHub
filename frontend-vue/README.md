# Vue 迁移版前端

这是个人知识库与事务助手的 Vue 3 前端源码。

## 技术结构

- Vue 3 + Vite + TypeScript，`main.ts` 注册 Pinia。
- Element Plus 按需引入图片预览组件，支持滚轮缩放、鼠标拖动和 Esc 关闭；`ImageActions.vue` 为聊天和笔记图片提供悬停保存图标与右键复制菜单。
- `components/` 拆分认证、主壳、会话列表、消息、附件、任务、笔记和主题弹窗。
- `stores/workspace.ts` 管理会话、消息、附件、任务和笔记快照；`stores/theme.ts` 管理主题预览、透明度、收藏和串行保存。
- `runtime/createRuntime.ts` 保留模型服务、知识库、SSE、桌面桥接等复杂行为，并将快照发布给 Vue 组件。`runtime/lifecycle.ts` 负责原生监听和定时器清理。
- `legacy.css` 保留原有视觉层，并统一任务控件、图片操作和 Element Plus 预览样式。

本目录是前端开发与构建入口；运行数据、依赖和构建产物不上传 GitHub。

## 运行

后端运行于 `http://127.0.0.1:8000` 时，在本目录执行：

```powershell
npm ci
npm run dev
```

打开 `http://127.0.0.1:5173`。Vite 会把 `/api` 请求代理到 FastAPI。生产或桌面构建执行 `npm run build`，输出 `dist`。

## 浏览器回归

```powershell
npm run build
npx playwright test
```

测试自动启动后端，使用独立的 `work/vue-browser-qa-*` 账户目录，不会使用正式账号数据。需先按根目录 README 安装 Python 后端依赖；Windows 使用已安装的 Edge，Linux 先运行 `npx playwright install --with-deps chromium`。可用 `AGENT_TEST_PYTHON` 指定已装好依赖的 Python，或用 `E2E_BASE_URL` 指定自己的隔离测试服务。

Windows 系统位图剪贴板用例会短暂打开 Edge 窗口，以验证桌面复制后的实际粘贴结果；其他用例默认无界面运行。
