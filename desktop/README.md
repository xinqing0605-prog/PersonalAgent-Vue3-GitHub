# Windows 桌面演示版

## 给别人使用

下载 `PersonalAgent-Windows-demo.zip`，解压到有写入权限的普通目录，双击 **启动演示版.cmd**。不要在 ZIP 内直接运行，也不要只取出 EXE。

需要 Windows 10/11 x64 与 Microsoft Edge WebView2 Runtime，无需 Python。首次启动注册本机账户，登录后在“模型服务”配置自己的 API Key。账号格式和密码要求以登录页提示为准。

数据保存在解压目录的 `desktop-data`：认证数据库为 `data/auth.db`，各账户的数据为 `data/users/<账户ID>`。首次运行自动创建，包内没有预设账号、真实知识库或模型 Key。桌面账户与网页版账户相互独立，不自动同步。

关闭窗口会收起到系统托盘，右键托盘图标选择“退出”才会结束进程。同一账户不能同时在两个桌面实例中使用。

本包优先使用账号密码登录，短信演示验证码关闭。模型调用需要网络；Ollama 等本地模型需要另行安装并配置。

## 从源码运行

安装 Python 3.11、Node.js 22 和 npm，在项目根目录打开 PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_local.ps1
.\.venv\Scripts\python.exe -m pip install -r desktop\requirements.txt
powershell -ExecutionPolicy Bypass -File desktop\start_desktop.ps1
```

启动脚本会先构建 Vue 前端，再打开桌面窗口。源码运行使用工程本地配置；不要把有真实数据的工程目录当演示包发送。

## 生成干净的演示 ZIP

```powershell
powershell -ExecutionPolicy Bypass -File scripts\package_desktop_demo.ps1
```

输出 `交付/PersonalAgent-Windows-demo.zip`。先打包 EXE，执行隔离启动检查，再打包纯程序目录；数据目录不进入 ZIP。ZIP 写入后逐文件校验哈希，再清理可重建的同份打包目录。

如仅需构建程序，可执行 `desktop/build.ps1`。直接运行该脚本生成的 EXE 默认使用 `%LOCALAPPDATA%/PersonalAgent`；演示启动器则明确指定包旁的 desktop-data，两种启动方式的存储位置不同。

## 升级与备份

消息输入框支持 Ctrl + V 粘贴截图或复制的图片，也支持右键“粘贴”。图片出现在“待发送附件”中，可以点击预览、移除，然后和文字一起发送，也可只发送图片。每条消息最多 8 个附件，其中最多 4 张图片；图片每张不超过 16 MB，其他附件仍不超过 2 MB。图片理解需要选择支持视觉输入的多模态模型，文生图模型不等同于图片理解模型。

图片右上角被滚出可见区域时，保存图标会一起隐藏，不会悬浮到页面顶栏。

生成图片和笔记图片可点击预览，使用鼠标滚轮缩放、按住鼠标左键拖动；点击遮罩、右上角关闭图标或按 Esc 关闭。鼠标移入图片后，右上角会显示保存图标；在图片上点击鼠标右键，选择“复制图片”，即可按 Ctrl + V 粘贴到笔记编辑器或支持图片的其他应用。点击回答下的“保存为笔记”会同时保存文字与图片。笔记图片保存在账户目录的 images 文件夹，完整备份 desktop-data 即包含图片；单独导出对话 JSON 或复制笔记 Markdown 不包含这些图片文件。

先从托盘退出，完整备份 desktop-data，再替换程序文件。不要用空目录覆盖原有数据。发给其他人的始终是脚本生成的原始 ZIP，不能把自己用过的目录重新压缩分发。
