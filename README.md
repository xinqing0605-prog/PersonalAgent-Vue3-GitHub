# PersonalAgent｜个人知识库与事务助手

支持浏览器和 Windows 桌面的个人助手：多模型对话、知识库检索、任务、笔记、附件、会话归档和主题。后端为 FastAPI，前端为 Vue 3 + Vite + TypeScript（Pinia 状态管理）；账户数据使用 SQLite 和本地文件，按账户隔离。

完整技术方案见 [技术文档](docs/TECHNICAL_DOCUMENTATION.md)，包含架构、接口、数据布局、配置、安全、部署和测试说明。前端开发说明见 [Vue 3 前端](frontend-vue/README.md)，桌面运行与打包说明见 [桌面版](desktop/README.md)。

## 快速开始

需要 Python 3.11、Node.js 22 和 npm。在项目根目录打开 PowerShell：

~~~powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_local.ps1
powershell -ExecutionPolicy Bypass -File scripts\run_vue.ps1
~~~

打开 http://127.0.0.1:8000，注册账户，在“模型服务”中填写自己的模型标识、接口地址和 API Key。源码不包含现有账号、聊天记录、知识库或密钥。未配置模型时仍可管理笔记和任务。

## 演示和部署

- **国内网页演示**：项目提供魔搭 ModelScope Docker 创空间配置模板。资源是否可用及有效期以账户控制台为准，配置见 [技术文档](docs/TECHNICAL_DOCUMENTATION.md)第 14 节。
- **Netlify**：本仓库提供跳转入口，实际登录、对话和文件存储由完整的 Python 服务处理。仅上传静态前端不能运行完整应用。
- **通用服务器**：Docker Compose + 持久卷 + HTTPS，运行一个实例。
- **Windows 桌面演示**：便携包解压后双击“启动演示版.cmd”，无需安装 Python；详见 [桌面版](desktop/README.md)。
- **上传 GitHub**：见 [技术文档](docs/TECHNICAL_DOCUMENTATION.md)第 14.5 节。发布源码与桌面程序分开存放。

桌面数据保存在本机；网页数据保存在服务器，两者不会自动同步。模型请求需要联网并使用体验者自己的 Key；本地模型需由体验者另行安装。

## 验证

~~~powershell
powershell -ExecutionPolicy Bypass -File scripts\run_checks.ps1
.\.venv\Scripts\python.exe -B scripts\check_release.py
node scripts/test_chat_history.cjs
~~~

## 部署边界

当前适合单实例、小规模演示。云端必须提供持久磁盘，备份完整数据目录；不能直接多副本扩容。短信默认关闭，演示使用账号密码注册登录。

实际 .env、数据库、知识库、账号目录、打包产物均排除在源码包和 Docker 构建上下文之外。账户模型 Key 默认不在用户间共享。公开服务器的管理员仍能访问磁盘内容，演示请使用测试资料。

项目未指定开源许可证；上传 GitHub 不等于自动授予他人再分发授权。


