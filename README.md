<p align="center">
  <img src="https://gudong.s3.bitiful.net/images/slidenote-marquee-zh.png" width="600" alt="SlideNote">
</p>

<h1 align="center">SlideNote 侧边笔记</h1>

<p align="center">
  <strong>Slide notes, always by your side</strong><br>
  侧边笔记，常伴左右<br>
  <a href="README_EN.md">English</a>
</p>

<p align="center">
  Chrome 浏览器侧边栏笔记插件 | 跨设备自动同步 | 极简设计
</p>

<p align="center">
  <a href="https://github.com/maoruibin/SlideNote"><img alt="GitHub version" src="https://img.shields.io/badge/version-0.0.5-blue"></a>
  <a href="https://github.com/maoruibin/SlideNote/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green"></a>
  <a href="https://chromewebstore.google.com/detail/appaojacakbjbbellfehlgjophpdpjom"><img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome%20Web%20Store-在线安装-green"></a>
</p>

---

## ✨ 特性

- **📌 侧边栏展示** — 固定在浏览器侧边，随时可用
- **✍️ Markdown 编辑** — 支持预览/编辑模式，实时渲染
- **📋 富文本复制** — 复制带样式的文本，可直接粘贴到其他应用
- **💾 自动保存** — 停止输入 1 秒后自动保存
- **🔄 跨设备同步** — 基于 Chrome Storage API，自动云端同步
- **🔍 搜索过滤** — 实时搜索标题和内容
- **⬆️⬇️ 导航切换** — 上下箭头快速切换笔记
- **⚡️ 极致轻量** — 无框架依赖，打包仅 24KB

---

## 🎯 适用场景

| 场景 | 说明 |
|------|------|
| 多设备工作者 | 公司电脑记录，回家电脑继续用 |
| 技术人员 | 存储 API Key、服务器地址、配置信息 |
| 运营/自媒体 | 管理多账号密码、文案模板、素材链接 |
| 临时记录 | 快速记下灵感、待办事项、剪贴板内容 |

---

## 📦 安装

### 方式一：Chrome 应用商店（推荐）

<a href="https://chromewebstore.google.com/detail/appaojacakbjbbellfehlgjophpdpjom">
  <img src="https://storage.googleapis.com/web-dev-uploads/image/WbDnF6242M_4vTb4X3r3zgA7j10/WbDnF6242M_4vTb4X3r3zgA7j10_1714145428342.png" alt="从 Chrome 应用商店安装" width="200">
</a>

[点击此处前往 Chrome 应用商店安装](https://chromewebstore.google.com/detail/appaojacakbjbbellfehlgjophpdpjom)

### 方式二：本地下载安装

从 [GitHub Releases](https://github.com/maoruibin/SlideNote/releases) 下载最新版本：

1. 下载并解压安装包
2. 打开 Chrome 浏览器
3. 访问 `chrome://extensions/`
4. 开启右上角的「开发者模式」
5. 点击「加载已解压的扩展程序」
6. 选择解压后的文件夹

### 方式三：从源码构建

```bash
# 克隆仓库
git clone https://github.com/maoruibin/SlideNote.git
cd SlideNote

# 安装依赖
npm install

# 构建正式版
npm run build:prod
```

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目根目录的 `dist` 文件夹

---

## 🚀 使用方法

1. 点击 Chrome 工具栏的 SlideNote 图标
2. 侧边栏展开，即可开始使用
3. 点击「新建笔记」创建第一条笔记
4. 点击笔记项切换，开始编辑
5. 右键点击笔记可排序或删除
6. 停止输入 1 秒后自动保存

---

## ❓ 常见问题

### 笔记保存在哪里？安全吗？

SlideNote 使用 **Chrome Storage API** 存储数据：

- ✅ 不经过第三方服务器，数据直接在你本地和 Google 之间同步
- ✅ 项目已开源，代码透明
- ✅ 不收集任何个人信息

### 同步容量有限制吗？

Chrome Storage Sync API 有以下限制：

- 总容量约 100KB（约 5 万汉字）
- 适合存储：API Key、命令、提示词等碎片信息

SlideNote 的定位是「便利贴」，不是「笔记本」。如需存储大量内容，建议使用 Notion、Obsidian 等专业笔记软件。

---

## 🛠️ 技术栈

```
Vanilla JS (ES6+)  →  无框架，极致轻量
Vite               →  快速构建
Chrome Storage     →  免费云同步
CSS Variables      →  设计系统
```

**为什么不用框架？**

| 理由 | 说明 |
|------|------|
| 性能 | 加载时间 < 100ms，无 100KB+ 框架开销 |
| 简单 | CRUD 功能不需要复杂状态管理 |
| 稳定 | 无框架升级风险，代码长期可用 |

---

## 📁 项目结构

```
slidenote/
├── src/sidepanel/
│   ├── core/           # 数据层（Store, EventBus, SyncManager）
│   ├── components/     # UI 组件
│   └── utils/          # 工具函数
├── docs/               # 设计文档
└── public/icons/       # 图标资源
```

---

## 🎨 设计理念

```
克制的配色    → 单色主调，不抢注意力
清晰的层级    → 列表 vs 内容，一目了然
舒适的间距    → 呼吸感，不拥挤
统一的圆角    → 温和不尖锐
```

---

## 🗺️ 路线图

### v0.0.3（当前版本）
- [x] Markdown 编辑器（预览/编辑模式切换）
- [x] 富文本复制（带样式）
- [x] Markdown 源码复制
- [x] 笔记导航箭头（上一篇/下一篇）
- [x] 每笔记独立记忆浏览模式
- [x] Markdown 语法帮助弹窗
- [x] 所有 v0.0.1 功能

### v0.0.2
- [x] 基础 CRUD
- [x] 自动保存
- [x] 跨设备同步
- [x] 搜索过滤
- [x] 笔记排序（右键菜单）
- [x] UI 优化

### v0.0.4（计划中）
- [ ] 笔记分组/标签
- [ ] 数据导出（JSON/Markdown）
- [ ] 快捷键支持

---

## 📮 关注作者

<p align="center">
  扫码关注公众号，获取开发日常和产品最新动态
</p>

<p align="center">
  <img src="https://blog.gudong.site/assets/profile/gongzhonghao.jpg" width="180" alt="公众号二维码">
</p>

---

## 💖 感谢支持

如果这个项目对你有帮助，欢迎请我喝杯咖啡 ☕️

<table align="center">
  <tr>
    <td align="center">
      <img src="https://doc.gudong.site/assets/img/wechat-donate.5e615ccb.jpg" width="180" alt="微信打赏"/>
    </td>
    <td align="center">
      <img src="https://doc.gudong.site/assets/img/alipay-donate.7ec06101.jpg" width="180" alt="支付宝打赏"/>
    </td>
  </tr>
</table>

---

## 🌟 更多作品

查看我的更多项目和文章：**[doc.gudong.site](https://doc.gudong.site/)**

---

## 📄 开源协议

[MIT License](LICENSE)

---

## 👨‍💻 作者

**咕咚同学** | 博客: https://blog.gudong.site/

> **Slide notes, always by your side**
>
> 侧边笔记，常伴左右

---

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！
