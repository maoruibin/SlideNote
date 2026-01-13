<p align="center">
  <img src="https://gudong.s3.bitiful.net/weimd/1768183653015_image.png" width="600" alt="SlideNote">
</p>

<h1 align="center">SlideNote</h1>

<p align="center">
  <strong>Slide notes, always by your side</strong><br>
  <a href="README.zh-CN.md">中文介绍</a>
</p>

<p align="center">
  A minimalist Chrome extension for quick note-taking in the browser sidebar | Auto-sync across devices | No frameworks
</p>

<p align="center">
  <a href="https://github.com/maoruibin/SlideNote"><img alt="GitHub version" src="https://img.shields.io/badge/version-0.0.1-blue"></a>
  <a href="https://github.com/maoruibin/SlideNote/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green"></a>
  <a href="https://chromewebstore.google.com/detail/appaojacakbjbbellfehlgjophpdpjom"><img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome%20Web%20Store-Online-green"></a>
</p>

---

## ✨ Features

- **📌 Sidebar Panel** — Lives in your browser sidebar, always accessible
- **💾 Auto-Save** — Saves automatically 1 second after you stop typing
- **🔄 Cross-Device Sync** — Syncs across devices via Chrome Storage API
- **🔍 Search** — Real-time search across note titles and content
- **📋 Note Reordering** — Right-click to reorder your notes
- **⚡️ Ultra Lightweight** — No frameworks, bundled size ~20KB

---

## 🎯 Use Cases

| Use Case | Description |
|----------|-------------|
| Multi-device Workers | Record notes at work, continue at home |
| Developers | Store API keys, server addresses, config snippets |
| Content Creators | Manage multiple account credentials, content templates |
| Quick Capture | Jot down ideas, to-dos, clipboard contents |

---

## 📦 Installation

### Option 1: Chrome Web Store (Recommended)

<a href="https://chromewebstore.google.com/detail/appaojacakbjbbellfehlgjophpdpjom">
  <img src="https://storage.googleapis.com/web-dev-uploads/image/WbDnF6242M_4vTb4X3r3zgA7j10/WbDnF6242M_4vTb4X3r3zgA7j10_1714145428342.png" alt="Install from Chrome Web Store" width="200">
</a>

[Click here to install from Chrome Web Store](https://chromewebstore.google.com/detail/appaojacakbjbbellfehlgjophpdpjom)

### Option 2: Download Local Package

Download the latest release from [GitHub Releases](https://github.com/maoruibin/SlideNote/releases) and install manually:

1. Download and unzip the package
2. Open Chrome browser
3. Go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Select the unzipped folder

### Option 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/maoruibin/SlideNote.git
cd SlideNote

# Install dependencies
npm install

# Build for production
npm run build:prod
```

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `dist` folder in the project directory

---

## 🚀 Usage

1. Click the SlideNote icon in your Chrome toolbar
2. The sidebar panel opens, ready to use
3. Click "New Note" to create your first note
4. Click a note to start editing
5. Right-click a note to reorder or delete
6. Auto-saves 1 second after you stop typing

---

## 🛠️ Tech Stack

```
Vanilla JS (ES6+)  →  No framework overhead
Vite               →  Fast build
Chrome Storage     →  Free cloud sync
CSS Variables      →  Design system
```

**Why no framework?**

| Reason | Description |
|--------|-------------|
| Performance | Load time < 100ms, no 100KB+ framework bloat |
| Simplicity | CRUD doesn't need complex state management |
| Stability | No framework upgrade risks, code stays working |

---

## 📁 Project Structure

```
slidenote/
├── src/sidepanel/
│   ├── core/           # Data layer (Store, EventBus, SyncManager)
│   ├── components/     # UI components
│   └── utils/          # Utility functions
├── docs/               # Documentation
└── public/icons/       # Icon resources
```

---

## 🎨 Design Philosophy

```
Restrained colors   →  Single-tone, non-distracting
Clear hierarchy     →  List vs content, at a glance
Comfortable spacing →  Room to breathe
Consistent rounded  →  Gentle, not sharp
```

---

## 🗺️ Roadmap

### v0.0.3 (Current)
- [x] Markdown editor with preview mode
- [x] Copy as rich text (with styling)
- [x] Copy as Markdown source
- [x] Navigation arrows (prev/next note)
- [x] Per-note view mode memory
- [x] Syntax help modal
- [x] All v0.0.1 features

### v0.0.2
- [x] Basic CRUD
- [x] Auto-save
- [x] Cross-device sync
- [x] Search & filter
- [x] Note reordering
- [x] UI polish

### v0.0.4 (Planned)
- [ ] Note grouping/tags
- [ ] Data export (JSON/Markdown)
- [ ] Keyboard shortcuts

---

## 📮 Follow the Author

<p align="center">
  Scan to follow my WeChat Official Account for development updates
</p>

<p align="center">
  <img src="https://blog.gudong.site/assets/profile/gongzhonghao.jpg" width="180" alt="WeChat QR">
</p>

---

## 💖 Support

If this project helps you, buy me a coffee ☕️

<table align="center">
  <tr>
    <td align="center">
      <img src="https://doc.gudong.site/assets/img/wechat-donate.5e615ccb.jpg" width="180" alt="WeChat Pay"/>
    </td>
    <td align="center">
      <img src="https://doc.gudong.site/assets/img/alipay-donate.7ec06101.jpg" width="180" alt="Alipay"/>
    </td>
  </tr>
</table>

---

## 🌟 More Works

Check out my other projects: **[doc.gudong.site](https://doc.gudong.site/)**

---

## 📄 License

[MIT License](LICENSE)

---

## 👨‍💻 Author

**Gudong** | Blog: https://blog.gudong.site/

> **Slide notes, always by your side**

---

If you find this project helpful, please give it a ⭐ Star!
