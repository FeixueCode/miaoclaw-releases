# Miaoclaw · 喵喵

> 🐱 本地优先的中文日用 AI 助手 · Local-first AI assistant for everyday work, in Chinese

**下载最新版本 → [Releases](https://github.com/FeixueCode/miaoclaw-releases/releases/latest)** ｜ 最新：**v2.1.3**

---

## 中文介绍

Miaoclaw（喵喵）是一个**本地优先**的中文日用 AI 助手，交付为 Windows 桌面应用。

- **能干活**：真实产出和修改 Word / Excel / PPT / PDF，联网调研出报告，会议录音转文字纪要，定时任务自动跑。
- **数据在本地**：会话、记忆、API Key 都存在你自己的电脑上，程序和数据分离，升级卸载不动数据。
- **模型自由**：不绑定任何一家模型，DeepSeek / Kimi / 智谱 / MiniMax / 通义 / 阶跃等贴一个 Key 即用。

### 安装

1. 从 [Releases](https://github.com/FeixueCode/miaoclaw-releases/releases/latest) 下载 `Miaoclaw-Setup-<版本>.exe`
2. 双击安装（默认装在当前用户目录，免管理员）
3. 首次运行如弹「未知发布者」，点「更多信息 → 仍要运行」（安装包未做代码签名，正常现象）
4. 打开后在 设置 → 模型 API 贴一个 API Key 即可开始用；不确定选哪家可先用 DeepSeek（便宜、中文好）

### 更新

- 应用顶部发现新版本会有提示条，设置 →「关于与更新」也能手动检查。升级**不丢数据**（会话 / 记忆 / API Key / 设置都保留）。
- **从 2.1.1 起，小版本更新更轻**：只需下载约 10MB 的更新包、重启即完成，不再走完整安装向导；万一新版启动异常会**自动回退到当前版本**，零风险。改动到运行时的大版本仍下载完整安装包。

### 2.1.1 更新亮点

- 文档不再无故标红：只有你明确要求「标红 / 批注 / 修订」时才出现，普通文档所写即所得
- 更安全：联网读到的网页内容一律当参考资料，网页里夹带的「指令」不会被执行
- 上下文用量显示更准，多把 API Key 可自动轮换，中文检索更聪明
- 新增应用内「使用帮助」页（设置 →「使用帮助」）

---

## English

**Miaoclaw** is a local-first AI assistant for everyday work, delivered as a Windows desktop app with a Chinese-first UX. Latest: **v2.1.1**.

- **Gets work done**: create and edit Word / Excel / PPT / PDF, research online into reports, transcribe meeting audio, run scheduled tasks.
- **Local data**: sessions, memory, and API keys stay on your machine; program and data are separated so upgrades never touch your data.
- **Model freedom**: bring your own key for DeepSeek, Kimi, Zhipu, MiniMax, Qwen, StepFun, and more.

### Install

1. Download `Miaoclaw-Setup-<version>.exe` from [Releases](https://github.com/FeixueCode/miaoclaw-releases/releases/latest)
2. Run the installer (installs to your user directory, no admin needed)
3. If Windows shows "Unknown publisher", click "More info → Run anyway" (the installer isn't code-signed yet)
4. Open it, go to Settings → Model API, paste one API key, and start

### Update

- A banner appears when a new version is available; you can also check manually in Settings → About & Update. Upgrades preserve your data.
- **From 2.1.1, minor updates are lightweight**: download a ~10 MB package and just restart — no installer wizard. If a new build fails to start, it **automatically rolls back** to the current version. Versions that change the bundled runtime still ship a full installer.

---

_Miaoclaw is under active development. Issues and feedback welcome._
