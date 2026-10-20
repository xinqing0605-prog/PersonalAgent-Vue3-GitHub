# 个人知识库与事务助手技术文档

## 1. 文档范围

本文档说明本项目的整体技术方案、代码边界、运行流程、数据存储、接口、部署方式、测试方法和已知限制。文档面向：

- 需要阅读、维护或二次开发源码的开发者
- 需要把项目部署成网页演示环境的维护者
- 需要打包 Windows 桌面演示版的维护者
- 需要在 GitHub 上审核源码组成的协作者

项目定位是单实例、小规模使用的个人知识库与事务助手。它支持浏览器和 Windows 桌面壳，提供多模型对话、知识库检索、任务、笔记、会话附件、会话管理、主题设置和图片生成。

## 2. 技术栈总览

| 层次 | 技术 | 用途 |
| --- | --- | --- |
| 后端语言 | Python 3.11 | 业务逻辑、接口、存储和工具执行 |
| Web 框架 | FastAPI | REST API、请求校验、OpenAPI 文档和 SSE 入口 |
| ASGI 服务器 | Uvicorn | 本地、Docker 和桌面进程中的 HTTP 服务 |
| 数据模型 | Pydantic | 请求、响应和运行配置的数据校验 |
| HTTP/模型客户端 | httpx、OpenAI 兼容 SDK | 调用模型服务、Embedding、文档处理和外部服务 |
| 文档处理 | pypdf、Python 标准库 zip/XML/CSV/JSON | 读取 PDF、DOCX、TXT、Markdown、CSV、JSON 等 |
| 本地数据库 | SQLite | 账户、会话、任务和会话元数据 |
| 文件存储 | 本地目录、Markdown、JSON、二进制文件 | 知识库原文件、笔记、附件和主题图片 |
| 检索 | 依赖无关的分词 + BM25 风格词法排序 | 无外部向量服务时的本地检索 |
| 可选检索增强 | OpenAI 兼容 Embedding + 余弦相似度 | 向量缓存和词法/向量混合排序 |
| 前端 | Vue 3、Vite、TypeScript、Pinia、Element Plus、CSS | 单页应用、响应式布局、流式消息、图片预览和状态管理；Element Plus 按需引入 |
| 桌面壳 | pywebview、pystray | Windows WebView 窗口和系统托盘 |
| Windows 打包 | PyInstaller | 生成不要求安装 Python 的桌面包 |
| 容器 | Docker、Docker Compose、Caddy 示例 | 网页部署和 HTTPS 反向代理 |
| 云端入口 | Netlify 重定向、ModelScope 创空间配置 | 演示入口和国内部署准备 |
| 测试 | Python unittest、Playwright、TypeScript 检查、Node.js CommonJS、GitHub Actions | 单元/接口/浏览器交互和构建检查 |

前端有独立的 npm 构建链。Vite 在开发时代理相对路径 `/api` 到 FastAPI，生产构建生成 `frontend-vue/dist`；FastAPI 会优先提供该目录，容器和桌面打包则把同一份 dist 放入 `frontend`。API Key 只保存在后端账户数据中，不写入前端代码。

## 3. 总体架构

~~~mermaid
flowchart LR
    U[浏览器] --> F[Vue 3 + Vite dist]
    D[Windows pywebview] --> F
    F -->|REST + SSE| A[FastAPI / Uvicorn]
    A --> AU[认证与会话]
    A --> CH[对话与 Agent 编排]
    A --> KB[知识库与检索]
    A --> T[任务 / 笔记 / 附件 / 主题]
    A --> MS[模型服务网关]
    AU --> DB[(SQLite)]
    CH --> DB
    T --> DB
    KB --> FS[(账户本地文件)]
    T --> FS
    MS --> P[OpenAI 兼容模型服务]
    KB --> E[可选 Embedding / 重排 / 文档解析服务]
    A --> L[本地 Ollama / LM Studio]
~~~

请求经过以下边界：

1. 浏览器或桌面 WebView 加载单页前端。
2. 前端用相对路径请求 FastAPI；对话流式接口使用 Server-Sent Events。
3. FastAPI 通过账户会话中间件识别当前用户，并把路径、数据库和文件访问限制到当前账户。
4. 对话请求进入 Agent 编排，按当前模型、检索结果和工具权限组织上下文。
5. 模型服务通过配置的 OpenAI 兼容地址调用；未配置或调用失败时，仍可返回本地知识检索结果或管理类响应。
6. 识别到 `z-image`、`Qwen Image`、Wan、Flux、SDXL 等图片模型且用户明确提出生成图片时，服务端走图片生成接口，并把返回的图片 URL 或 Base64 数据返回给前端展示。Qwen/Z-Image/Wan 优先使用 DashScope 原生接口；兼容网关不可用时再尝试 `/images/generations`。
7. 写入操作只作用于账户目录和账户数据库记录，桌面端与网页端数据默认互不共享。

## 4. 代码目录与源码边界

~~~text
backend/app/              FastAPI 应用、认证、模型、检索、存储和工具
frontend-vue/src/          Vue 组件、Pinia store 和运行适配器
frontend-vue/dist/         Vite 生产构建；容器/桌面打包输入
desktop/                  Windows pywebview/托盘壳、打包脚本和实例互斥
deploy/                   Docker 入口、Compose、ModelScope 和服务器配置
tests/                    Python 测试
scripts/                  本地运行、检查、打包、发布和 smoke 脚本
docs/                     整体技术文档，包含配置、部署和源码发布说明
Dockerfile                网页容器构建文件
netlify.toml              Netlify 入口重定向
render.yaml               可选 Render 部署模板
.env.*.example            各环境的配置模板
~~~

GitHub 源码包使用白名单导出器生成。账号数据库、聊天记录、知识库、笔记、主题图片、桌面运行目录、评测目录、虚拟环境、EXE 和本机工作目录均不在源码包内。导出器还会扫描常见密钥格式，并在 ZIP 中生成 SOURCE-MANIFEST.json。

## 5. 运行环境和进程模型

### 5.1 本地开发

- 使用 Python 3.11 虚拟环境与 Node.js 22/npm。
- backend/app/main.py 启动 Uvicorn。
- 默认绑定 127.0.0.1:8000。
- 数据默认写入项目外或本机运行目录，具体由环境变量决定。
- 本地环境可以使用调试日志和开发用登录选项，但不要把本地 .env 提交到 GitHub。

### 5.2 测试环境

- 使用独立临时目录、临时 SQLite 和测试端口。
- 测试环境不复用本机真实账户或知识库。
- scripts/run_checks.ps1 运行 Vue 类型检查和构建、Python 测试、前端 Node 检查。
- scripts/check_release.py 校验发布文件的结构和敏感内容排除规则。

### 5.3 生产网页

- Dockerfile 先用 Node 22 构建 Vue dist，再以 python:3.11-slim 作为运行镜像。
- deploy/container_entrypoint.py 创建运行目录，必要时修正目录权限，然后以非 root UID 1000 启动 Uvicorn。
- 默认监听容器内 8000；ModelScope 配置可通过端口 7860 暴露。
- 生产配置启用 Secure、HttpOnly、SameSite=Lax 会话 Cookie，并要求显式 ALLOWED_HOSTS。
- 生产部署只建议运行单实例；SQLite 和本地文件不适合直接多副本共享。

### 5.4 Windows 桌面

- desktop/desktop_app.py 在后台线程启动 Uvicorn，再创建 pywebview 窗口。
- pystray 提供系统托盘入口；关闭窗口默认隐藏到托盘，退出菜单才停止服务。
- desktop/instance_guard.py 用 Windows 内核命名对象限制同一账户/桌面配置重复启动。
- PyInstaller 将 Python 运行时和静态资源打入桌面程序；桌面演示包不包含运行过的 desktop-data。

## 6. 后端模块职责

后端按职责拆分，核心编排仍集中在 backend/app/main.py，以便单机部署和桌面打包。

- auth.py：密码哈希、SQLite 用户/会话、Cookie、登录和可选短信流程。
- settings.py：环境变量、运行模式、路径、CORS、可信主机和生产约束。
- user_storage.py：按账户生成数据根目录，支持新布局和旧本地布局兼容。
- desktop_state.py：桌面端会话快照的持久化。
- advanced_settings.py、themes.py：账户级高级设置和主题/收藏数据。
- retrieval.py、embeddings.py：文本切分、词法检索、Embedding 缓存、余弦相似度和混合排序。
- tools.py：知识库、笔记、任务和工作区文件工具；工具路径有边界限制。
- main.py：路由、对话流程、SSE、模型服务目录、会话数据、主题和资源管理。

工具执行只允许访问 knowledge、notes、workspace 等受控根目录。计划模式会移除创建任务、完成任务和保存笔记等写工具，避免只读规划意外修改数据。

## 7. 前端实现

frontend-vue 是 Vue 3 + Vite + TypeScript 单页应用：

- `App.vue` 组合认证、主壳和弹窗；会话、消息、附件、任务、笔记和主题有独立组件。
- `stores/workspace.ts` 与 `stores/theme.ts` 使用 Pinia 管理跨组件状态。
- `runtime/createRuntime.ts` 负责暂未完全拆开的模型服务、知识库和桌面桥接，并通过生命周期对象清理原生监听。
- API 请求全部使用同源相对路径，避免把服务器地址硬编码到前端。
- 普通接口使用 fetch；流式对话使用 fetch 读取 response.body，解析 meta、delta、done 等 SSE 事件。
- 对用户内容和服务端返回文本使用 HTML 转义辅助函数，避免把消息内容直接当作 HTML。
- 会话、任务、笔记、模型服务、知识库、主题和设置通过页面状态和局部渲染更新。
- 响应式 CSS 处理窄窗口、桌面 WebView、侧边栏和输入框布局。
- `legacy.css` 保留经过验证的视觉层，避免迁移改变现有 UI；构建产物只由 Vue dist 提供。

## 8. 认证、账户隔离与安全

认证流程：

1. 用户注册或登录。
2. 服务端用 PBKDF2-HMAC 处理密码，当前迭代次数为 310000。
3. 服务端生成高熵随机会话令牌，只保存令牌哈希，不把明文令牌写入数据库。
4. 浏览器保存 host-only 会话 Cookie；生产模式使用 Secure、HttpOnly 和 SameSite=Lax。
5. 每个需要账户的接口从会话得到 user_id，再解析账户数据库和账户文件根目录。

安全边界包括：

- 模型 Key 只保存在服务端账户数据中，接口默认只返回掩码。
- 主题图片按 PNG/JPEG/WebP 签名校验，大小上限为 5 MB。
- 上传文件、知识库文件和会话附件通过文件名清理与受控目录限制。
- 生产环境使用 TrustedHostMiddleware，可选 CORSMiddleware。
- 不把 .env、auth.db、账户目录、日志或模型 Key 放入源码包。
- 短信默认关闭，生产环境不应启用演示用的开发验证码。
- 公开演示服务器上的管理员仍有磁盘访问能力，演示资料应使用测试内容。

## 9. 对话和 Agent 请求流程

### 9.1 普通请求

1. 前端向 /api/ask 发送消息、会话 ID、模型选择和运行选项。
2. 服务端解析当前用户、模型连接和会话历史。
3. 根据当前引用的知识库和用户输入执行检索。
4. Agent 决定是否调用受控工具，如查询任务、读取笔记或搜索知识库。
5. 把系统提示、历史、检索片段和工具结果组合成模型请求。
6. 模型返回后，服务端保存消息、引用和执行轨迹，再返回结构化响应。

### 9.2 流式请求

/api/ask/stream 返回 SSE。典型事件顺序为：

- meta：模型、会话和执行信息
- delta：增量文本
- tool 或 trace：工具/执行轨迹信息（有时为空）
- done：完整消息、引用和统计

前端在连接中断时保留已收到文本，并给出可重试状态。模型调用失败时，服务端会尽量返回本地检索或管理操作结果，而不是让任务管理功能完全不可用。图片生成响应通过 `images` 数组返回，前端在对应助手消息下显示图片。

生成图片支持点击预览、滚轮缩放和按住鼠标拖动。`ImageViewer.vue` 按需使用 Element Plus 的 `ElImageViewer`，以深色遮罩展示图片，小图按原始尺寸显示，大图适应窗口；无白色面板和文字工具栏。点击遮罩、关闭图标或按 Esc 可关闭预览。`ImageActions.vue` 为聊天、笔记与预览图片统一提供右键“复制图片”菜单；保存图标位于图片右上角，仅在悬停或键盘聚焦时显示。菜单和关闭按钮具有键盘焦点，Esc 先关闭菜单，再关闭预览，不会连带关闭笔记弹窗。

网页版复制操作写入 PNG 到浏览器剪贴板（需要 HTTPS 或 localhost 和浏览器权限），Windows 桌面版通过 `DesktopApi.copy_image` 写入系统位图剪贴板，保存图片使用系统文件对话框。

保存图标始终锚定图片实际右上角，检查滚动容器裁剪范围与遮挡，不把图标强行限制到窗口边缘。右上角不可见时隐藏图标。

消息输入框从 `paste` 事件读取剪贴板图片，上传到当前账户、当前会话的附件目录；也支持右键粘贴、文件选择和拖入。上传按会话排队，上传过程中禁止发送该会话消息，切换会话不会把图片挂到另一个会话。待发送图片可预览和移除，普通文本粘贴保留浏览器默认行为。发送时使用已有 `attachment_filenames` 协议；后端读取真实图片，构造包含 `text` 和 `image_url` 的模型输入，而非只发送文件名。图片随本条消息发送，下一条消息不会自动重复携带。

每条消息最多 8 个附件，其中最多 4 张图片。聊天图片支持 PNG/JPEG/GIF/WebP，每张不超过 16 MB、2500 万像素；文本和文档附件仍为 2 MB。服务端在写入批次前校验全部文件，图片类型以实际格式为准；不再静默忽略超出数量或缺失的图片。只发图片时自动使用中性阅读提示。选择文生图模型时明确提示切换到图片理解模型；图文请求失败时返回可重试错误，不降级为忽略图片的本地检索回答。

保存图片笔记前，前端把生成图导入当前账户的 `images/` 目录，Markdown 使用 `/api/images/<内容哈希>.<扩展名>` 引用；同时把当前聊天中的图片地址替换为该本地地址。粘贴或上传到笔记的图片也使用此机制。图片导入失败时不创建缺图笔记。删除聊天不删除这些独立图片文件；备份笔记须一并备份账户的 images 目录，单独复制 Markdown 文件不包含图片。

`image_assets.py` 验证真实图片格式（PNG/JPEG/WebP）、16 MB 文件上限和 2500 万像素上限。远程导入仅允许公开 HTTPS 图片地址，每次重定向重新验证地址，使用验证后的 IP 建立连接并保留 TLS 主机名，不向图片服务器转发账户 cookie 或模型 Key。资源读取检查当前登录账户，响应禁止共享缓存。

### 9.3 运行模式

- 自动模式：允许读取工具，并可按请求执行任务、笔记等受控写操作。
- 计划模式：保留检索和分析，移除写工具，适合先讨论步骤再执行。
- 无模型模式：仍可使用账户、任务、笔记、知识库文件和主题管理；模型生成能力需要配置模型服务。

## 10. 知识库与检索流水线

1. 用户创建知识库并上传文件。
2. 服务端校验扩展名、文件名和大小，将原文件保存到当前账户的知识库目录。
3. 文本抽取器读取 TXT、Markdown、CSV、JSON、PDF 和 DOCX；PDF 使用 pypdf，DOCX 使用标准库 ZIP/XML。
4. 文本按长度和重叠窗口切分，保留来源文件和片段序号。
5. 默认使用依赖无关的分词和 BM25 风格词法得分，适合单机和无外部服务场景。
6. 如果配置 Embedding 服务，生成向量并写入本地缓存，再计算余弦相似度。
7. 混合排序结合词法和向量分数；可选的文档处理或重排服务通过 OpenAI 兼容接口接入。
8. 对话上下文只携带排名靠前且经过长度限制的片段，避免把整库发送给模型。

Embedding、重排和云端文档解析均为可选能力。未配置时不应阻塞基本知识库管理和词法检索。

## 11. 功能和接口分区

FastAPI 默认提供 OpenAPI 页面，运行后可访问 /docs 和 /openapi.json。主要接口分区如下：

| 分区 | 主要接口 | 作用 |
| --- | --- | --- |
| 健康检查 | GET /api/health、GET /api/ready | 进程存活和依赖就绪检查 |
| 认证 | /api/auth/register、login、logout、me、status | 账户和会话 |
| 对话 | POST /api/ask、POST /api/ask/stream | 普通和流式 Agent 对话 |
| 会话 | /api/desktop/conversations、/api/conversations/{id} | 会话元数据、附件和删除 |
| 任务 | GET/POST /api/tasks、PUT/DELETE /api/tasks/{id} | 待办创建、修改、完成和删除 |
| 笔记 | GET/POST /api/notes、PUT/DELETE /api/notes/{id} | Markdown 笔记和附件图片 |
| 图片 | POST /api/images/import、GET /api/images/{id} | 导入并读取当前账户的持久化图片 |
| 搜索 | /api/search、/api/brief、/api/context-graph | 当前账户内容检索和概览 |
| 主题 | /api/theme、/api/theme/favorites | 当前主题、收藏主题和账户图片 |
| 模型 | /api/model、/api/chat-models、/api/model-catalog | 当前模型和可选模型 |
| 模型服务 | /api/model-services、/api/model-providers | 服务商、模型连接、Key 和删除 |
| Agent 设置 | /api/agent-settings/* | 默认参数、网关、MCP、OCR、文档解析 |
| 知识库 | /api/knowledge-bases/* | 知识库、文档上传、原文、重解析和删除 |
| 附件 | /api/conversations/{id}/files/* | 会话附件上传、打开、下载和删除 |

具体字段以当前源码的 Pydantic 模型和 OpenAPI 输出为准。对外发布前应通过 /docs 检查实际环境的路由和配置。

## 12. 数据存储布局

### 12.1 新账户布局

当 AGENT_LEGACY_USER_ID=0 时，数据按账户隔离：

~~~text
AGENT_USER_DATA_ROOT/
  <user_id>/
    knowledge/
    notes/
    workspace/
    themes/
    attachments/
    retrieval-cache/
AUTH_DB_PATH
~~~

SQLite 主要保存 users、sessions、tasks、conversation 元数据和必要的账户配置；较大的原文件、Markdown、主题图片和附件保存在账户目录。

### 12.2 旧本地布局兼容

AGENT_LEGACY_USER_ID=1 可保留旧版本地目录，用于升级已有本机数据。新云端部署和全新桌面演示默认使用按账户目录布局。升级前应备份数据库和完整数据根目录，不能混用两个环境的账号数据。

### 12.3 持久化要求

Docker、ModelScope 和服务器部署必须把 AUTH_DB_PATH、AGENT_RUNTIME_DIR、AGENT_USER_DATA_ROOT 指向持久磁盘或挂载卷。容器删除后，未挂载的数据会丢失。备份应同时包含 SQLite 和账户文件目录，并在恢复后检查文件权限。

## 13. 配置与密钥

配置读取优先级是进程环境变量，然后是 .env.<profile>，最后是 .env。建议从以下模板复制并按环境填写：

- .env.local.example：本机开发
- .env.test.example：自动化测试
- .env.production.example：公开网页
- deploy/.env.modelscope.example：ModelScope 创空间

常用变量：

| 变量 | 作用 |
| --- | --- |
| APP_ENV | local、test 或 production |
| APP_HOST、APP_PORT | 本地启动监听地址和端口；容器入口使用 PORT |
| ALLOWED_HOSTS | 生产允许的 Host |
| ALLOWED_ORIGINS | 需要跨域时的来源白名单 |
| AUTH_DB_PATH | 账户 SQLite 文件 |
| AGENT_RUNTIME_DIR | 运行时根目录 |
| AGENT_USER_DATA_ROOT | 按账户文件根目录 |
| AGENT_LEGACY_USER_ID | 旧本地布局兼容开关 |
| ALLOW_SHARED_MODEL_CREDENTIALS | 是否允许使用服务端共享模型配置，默认关闭 |
| DEEPSEEK_API_KEY、DEEPSEEK_MODEL、DEEPSEEK_BASE_URL | 可选的服务端共享模型配置；通常使用账户内“模型服务”配置 |
| SMS_* | 可选短信平台配置 |
| SESSION_COOKIE_SECURE | HTTPS 部署时启用安全 Cookie |

不要把真实 Key 写入 README、截图、前端、Docker 镜像层、GitHub Actions 日志或 ZIP。公开仓库只提交 example 模板。模型服务配置可以在登录后的“模型服务”页面按账户保存。

## 14. 部署方案

### 14.1 Docker / Compose

1. 将 `deploy/.env.web.example` 复制为 `deploy/.env.web`，把 `ALLOWED_HOSTS` 和 `ALLOWED_ORIGINS` 改为自己的域名。保持 `SESSION_COOKIE_SECURE=true`、`SMS_PROVIDER=disabled`、`ALLOW_SHARED_MODEL_CREDENTIALS=false`。
2. 在项目根目录执行 `docker compose -f deploy/docker-compose.demo.yml up -d --build`。该配置使用命名持久卷保存认证数据库和账户文件，并以单实例运行后端。
3. Compose 仅将应用暴露到宿主机 `127.0.0.1:8000`。参考 `deploy/Caddyfile.example`，用 Caddy、Nginx 或云负载均衡器提供 HTTPS。
4. 访问 `/api/health` 和 `/api/ready` 检查状态，再通过 HTTPS 页面注册和登录。
5. 备份完整持久卷；停止容器时保留数据卷。真实 `.env.web` 和运行数据不上传 GitHub。

### 14.2 ModelScope 创空间

项目已提供 Docker 入口和 7860 端口配置，可将源码导入 Docker 创空间：

- 使用 deploy/.env.modelscope.example 作为变量清单。
- 将数据根目录设为 /mnt/workspace/personal-agent。
- 确认创空间平台提供的持久磁盘、CPU/内存和免费额度。
- 首次启动后通过网页注册测试账号，再配置体验者自己的模型 Key。

免费资源、额度和有效期由平台账户控制台决定。项目源码本身不创建云资源，也不代替平台实名认证或绑定操作。

### 14.3 Netlify

Netlify 配置用于入口重定向，不承载完整 Python 后端。把 DEMO_APP_URL 设置为已部署的 HTTPS 根地址，Netlify 页面会跳转到完整应用。只把静态 dist 上传到 Netlify，不能提供认证、SQLite、文件上传和模型调用能力。Netlify 在本项目中只作为完整后端的跳转入口。

### 14.4 Windows 桌面

使用 desktop/build.ps1 或 scripts/package_desktop_demo.ps1 生成原始桌面包，再分发 PersonalAgent-Windows-demo.zip。体验者解压后启动，不要重新压缩使用过的目录，以免把账户数据打进发布包。

### 14.5 上传 GitHub

仓库只保留应用源码、自动化测试、依赖清单与锁文件、配置模板、运行/打包脚本和项目文档。不要提交本机账户、聊天、知识库、笔记、模型 Key、安装包、日志、测试输出或依赖目录。

可在项目根目录生成经过白名单筛选的源码包：

~~~powershell
python -B scripts/export_github_source.py
~~~

输出为 `交付/PersonalAgent-GitHub-source.zip`，包含文件校验清单 `SOURCE-MANIFEST.json`。导出过程会检查常见密钥格式，但发布前仍应检查内容。将源码包内容上传到 GitHub；桌面安装包单独发布，个人 `desktop-data` 目录保留在本机。若直接推送源码目录，先检查 `git status`，遵循项目 `.gitignore`，不要强制加入被忽略的运行文件。

## 15. 测试和质量检查

当前发布检查包括：

- Python unittest：覆盖后端认证、配置、存储、检索、路由和安全边界；以当前测试运行结果为准。
- Vue TypeScript 构建与 Playwright 浏览器回归：注册登录、会话、消息流、附件、任务、笔记和主题切换；Node.js 检查继续覆盖旧基线和发布脚本。
- release check：检查源码包白名单、敏感文件排除、Docker 构建上下文和发布资料。
- 独立生产 smoke：使用临时目录和临时端口验证健康检查、登录、核心读写和安全 Cookie。
- GitHub Actions：执行 Python、前端和 Docker smoke job。
- GitHub 源码包导出后：解压、校验 SOURCE-MANIFEST.json、运行 compileall，确保没有缓存或演示数据。

本机若没有 Docker，Docker smoke 由 GitHub Actions 完成；这不等同于已经在线部署成功。上线前还应在目标平台检查持久盘、HTTPS、Host 白名单和模型服务连通性。

## 16. 运维和故障排查

- 页面能打开但无法登录：检查 /api/health、数据库路径权限和浏览器 Cookie 的 Secure 配置。
- 登录成功但数据为空：确认当前环境的 AUTH_DB_PATH 和 AGENT_USER_DATA_ROOT 没有指向另一个实例。
- 模型调用失败：检查模型标识、完整 API 地址、Key、服务商兼容性和服务器出网；先用 /api/ready 和模型服务测试按钮确认。
- 知识库检索为空：确认文件抽取成功、文档状态已完成、当前会话引用了正确知识库；没有 Embedding 时应仍能使用词法检索。
- 容器重启后数据丢失：检查 Docker/ModelScope 持久盘挂载，不要只依赖容器可写层。
- 桌面版无法再次启动：确认上一次进程已经退出；实例互斥会阻止同一账户/桌面配置重复打开。
- 页面窄窗口换行：调整浏览器或 WebView 尺寸；前端会使用响应式布局，但过窄时按钮和模型名称仍会收缩。

日志中不要打印 Cookie、密码、API Key、完整上传文件内容或账户目录中的私密资料。

## 17. 已知限制与后续扩展

当前实现适合单实例和演示规模，限制包括：

- SQLite 和本地文件不是多副本共享存储。
- 没有内置任务队列、分布式锁和集中式日志。
- 文件上传大小、上下文长度和工具范围采用应用级限制。
- 短信登录需要接入真实短信平台，并配置审核通过的签名、模板和服务端密钥。
- OCR、文档解析、重排和 Embedding 是可选外部服务，不保证所有服务商字段完全一致。
- 核心页面已迁移到 Vue 组件；模型服务和知识库的复杂后台操作仍由 `createRuntime.ts` 适配，以保持桌面和网页行为一致。后续可继续把这些适配器拆成 composables。

后续可按需要引入 PostgreSQL、Redis、对象存储、后台任务队列、集中式审计日志和更细粒度的 RBAC。扩展前应保持账户数据迁移脚本和本地桌面模式兼容。

## 18. 相关文档

- [项目 README](../README.md)：快速开始、部署边界和项目入口
- [前端 README](../frontend-vue/README.md)：Vue 开发、构建和浏览器回归
- [桌面 README](../desktop/README.md)：Windows 桌面运行和打包
- [环境配置模板](../.env.example)：环境变量示例；部署模板位于 `deploy/`
- [本地检查脚本](../scripts/run_checks.ps1)：质量检查入口
- [源码导出脚本](../scripts/export_github_source.py)：白名单源码打包

