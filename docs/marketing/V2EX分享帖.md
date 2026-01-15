# [分享] 做了一个 Chrome 侧边栏便利贴 SlideNote，不遮挡内容，跨设备同步

**作者**: 咕咚同学

---

> **Simple notes, always by your side**
> **侧边笔记，常伴左右**

## 缘起

经常有这种场景：
- 公司电脑存了服务器密码，回家想登录时死活想不起来
- 把 API Key 存在各种地方，换设备后找不到了
- 需要一个「随手存、随时查」的地方，但 Notion 们太重了

所以做了一个简单的 Chrome 插件：**SlideNote**

**它不是一个笔记本**，更像一个云剪贴板，专门存那些碎片信息。

---

## 核心特点

### 1. 侧边栏，不遮挡内容

这是最大的卖点。用的是 Chrome Side Panel API，固定在浏览器侧边，与主内容并排，不遮挡任何东西。

```
┌────────────┬────────────────┐
│            │                │
│ SlideNote  │   网页内容      │
│ 侧边栏     │   完全可见      │
│            │                │
└────────────┴────────────────┘
```

### 2. 秒开即用

打包只有 25KB，加载 < 100ms，点开立即可用，不用切换 App。

### 3. 跨设备自动同步

基于 Chrome Storage Sync API，你在公司存的，回家就能查。

### 4. 实时搜索

输入即过滤，不用按回车，秒速找到。

### 5. 支持 Markdown

让密钥、命令、代码有格式，更清晰（v0.0.3 新增）。

---

## 技术栈

Vanilla JS + Chrome Storage Sync API + marked.js，没用任何框架。

代码量小，整个打包后只有 25KB 左右。

GitHub: https://github.com/maoruibin/SlideNote

---

## 截图

![SlideNote Demo](https://gudong.s3.bitiful.net/images/slidenote-marquee-zh.png)

---

## 使用场景

- **开发者**：API Key、服务器地址、常用命令、数据库密码
- **多设备工作者**：公司 Mac + 家里 Mac + 笔记本，信息随身走
- **内容创作者**：账号凭证、文案模板、AI 提示词
- **日常碎片**：IP 地址、会议记录、待办事项

---

## 安装

### Chrome 应用商店

[Chrome Web Store](https://chromewebstore.google.com/detail/appaojacakbjbbellfehlgjophpdpjom)

### 开发者模式

```bash
git clone https://github.com/maoruibin/SlideNote.git
cd SlideNote
npm install
npm run build
```

然后在 Chrome 扩展管理页面加载 `dist` 目录（开发者模式）

---

## 开源协议

MIT License，欢迎 Star / PR / Issue

---

> **Simple notes, always by your side**
> **侧边笔记，常伴左右**
