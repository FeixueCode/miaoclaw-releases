# Miaoclaw · 喵喵

> 🐱 本地优先的中文日用 AI 助手 · Local-first AI assistant for everyday work, in Chinese

**下载最新版本 → [Releases](https://github.com/FeixueCode/miaoclaw-releases/releases/latest)** ｜ 最新：**v2.1.8**

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

### 2.1.8 更新亮点

- **## 💰 花了多少钱,一眼看得见**：**设置 → 用量记录** 把【花费】放到最前面,直接按人民币算给你看,可以按天、按模型看明细
- **## 🛡️ 对话和文件更不容易丢**：**断电后不再吞掉最后一轮对话**:强制关机/断电如果正好写到一半,下一次的对话记录会被粘在坏掉的半行后面,导致那一轮*…
- **## 🔒 装 Skill 更安全**：压缩包解压增加多道边界检查:防止恶意压缩包把文件写到安装目录之外、防止用一个小文件撑爆内存、拒绝符号链接和加密条目
- **## ⚙️ 后台更稳**：「停止」更干脆:停止任务时残留的子进程会被彻底清理,不再有幽灵进程占着资源
- **## 🐛 其它修复**：**窄窗口设置入口消失**:把窗口拉窄时侧边栏的设置按钮会不见,已修
- **## 升级方式**：**2.1.1 及以上版本**:应用内提示更新后,点「重启完成更新」即可(轻量更新,几秒完成)

完整更新说明见 [Releases](https://github.com/FeixueCode/miaoclaw-releases/releases/tag/v2.1.8)。

---

## English

**Miaoclaw** is a local-first AI assistant for everyday work, delivered as a Windows desktop app with a Chinese-first UX. Latest: **v2.1.8**.

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
