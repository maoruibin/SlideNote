# v0.0.8 更新日志

> **发布日期**: 2025-01-29
> **版本**: v0.0.8
> **状态**: 开发中

---

## 一、版本概述

本版本的核心功能是 **网页摘录** — 用户可以右键保存网页选中内容到 SlideNote，实现快速信息收集。

同时修复了多个 Bug，并进行了界面优化。

---

## 二、新增功能

### 2.1 右键菜单保存选中内容 ✨

**功能描述**：在任意网页选中文字后，右键菜单显示"保存到 SlideNote"选项，点击后自动保存到笔记。

**产品定位**：
- 快速收集网页碎片信息
- 不打断当前浏览流程
- 按日期聚合，同一天的摘录在同一条笔记

**使用方式**：
1. 在网页选中文字
2. 右键 → 点击"保存到 SlideNote"
3. 内容自动保存，显示成功通知

**保存格式**：
```
23:33

目前这块大家都在烧钱，阿里更加财大气粗一些。

来自：[微博正文 - 微博](https://weibo.com/...)
```

**多条摘录格式**（用 `---` 分隔）：
```
23:33

目前这块大家都在烧钱...

来自：[微博正文 - 微博](https://weibo.com/...)

---

23:45

另一条摘录内容...

来自：[另一个页面](https://example.com)
```

**限制**：
- 单次保存最大 3000 字符
- 超过限制会提示"内容过长，请手动保存"

---

## 三、问题修复

### 3.1 夜间模式置顶笔记颜色问题 🔧

**问题**：夜间模式下置顶笔记使用硬编码的亮橙色（#fff9f0），导致背景过亮刺眼。

**修复**：为夜间模式定义专用颜色变量

| 元素 | 亮色模式 | 深色模式 |
|------|---------|---------|
| 背景 | #fff9f0 | #2d1f0f |
| 悬停 | #fff3e0 | #3a2a14 |
| 选中 | #ffe8cc | #4a351a |
| 竖条 | #f59e0b | #f59e0b |

**修改文件**：`src/sidepanel/styles.css`

---

### 3.2 导航按钮置顶笔记问题 🔧

**问题**：右键菜单的"向上/向下/移到顶部/移到底部"按钮使用 `state.notes.length` 判断边界，但实际显示顺序是 `getSortedNotes()`（置顶笔记在前），导致边界判断错误。

**修复**：统一使用 `getSortedNotes()` 获取正确的笔记数量和顺序

**修改文件**：`src/sidepanel/components/NoteList.js`

---

### 3.3 Chrome 扩展报错 🔧

**问题**：在 `chrome://` 页面点击插件图标时报错 `Unchecked runtime.lastError: Cannot access a chrome:// URL`

**修复**：在 `background.js` 中提前检查并忽略 `chrome://` 页面

**修改文件**：`src/background.js`

---

### 3.4 编辑器 Header 固定问题 🔧

**问题**：笔记内容过长时，顶部的标题和导航按钮（上一篇/下一篇）会被顶出视野

**原因**：NoteEditor 组件和 app.js 中使用了相同的类名 `note-content-section`，导致嵌套布局样式冲突

**修复**：
1. 将 NoteEditor 的容器类名改为 `note-editor-wrapper`
2. 新增对应的 CSS 样式，确保 Header 固定，内容区域滚动

**修改文件**：
- `src/sidepanel/components/NoteEditor.js`
- `src/sidepanel/styles.css`

---

## 四、界面优化

### 4.1 简化右键菜单

**移除**：
- ⇧ 移动到顶部
- ⇩ 移到底部

**保留**：
- ↑ 上移
- ↓ 下移
- 📌 置顶 / ○ 取消置顶
- × 删除

**理由**：置顶功能已实现"放顶部"的需求，"移动到底部"很少使用

**修改文件**：
- `src/sidepanel/components/ContextMenu.js`
- `src/sidepanel/components/NoteList.js`

---

## 五、技术变更

### 5.1 新增权限

**manifest.json / manifest.dev.json**：
```json
"permissions": [
  "storage",
  "sidePanel",
  "contextMenus",  // 新增：右键菜单
  "notifications"  // 新增：保存成功通知
]
```

### 5.2 国际化新增

**新增文案**（中英文）：
- `saveToSlideNote`: 保存到 SlideNote / Save to SlideNote
- `savedToSlideNote`: 已保存到 SlideNote / Saved to SlideNote
- `webSelectionsTitle`: 网页摘录 / Web Selections
- `selectionTooLong`: 内容过长，请手动保存 / Selection too long
- `storageFull`: 存储空间不足 / Storage full

**修改文件**：
- `_locales/zh_CN/messages.json`
- `_locales/en/messages.json`

### 5.3 Background.js 重构

**新增功能**：
- 创建右键菜单（`chrome.contextMenus`）
- 处理菜单点击事件
- 按日期聚合保存逻辑
- 显示保存成功通知

**核心逻辑**：
```javascript
// 保存到当天的"网页摘录"笔记
async function saveSelectionToDateNote(content, sourceTitle, sourceUrl) {
  const today = getTodayDateString(); // YYYY-MM-DD
  const dateNoteTitle = `${today} ${webSelectionsTitle}`;

  // 查找或创建今天的笔记
  let targetNote = notes.find(n => n.title === dateNoteTitle);
  // ... 追加或创建
}
```

---

## 六、文件变更清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `manifest.json` | 修改 | 新增权限 |
| `manifest.dev.json` | 修改 | 新增权限 |
| `src/background.js` | 重写 | 添加右键菜单和保存逻辑 |
| `src/sidepanel/components/NoteEditor.js` | 修改 | 修复类名冲突 |
| `src/sidepanel/components/NoteList.js` | 修改 | 修复导航按钮边界判断；移除顶部/底部操作 |
| `src/sidepanel/components/ContextMenu.js` | 修改 | 移除移动到顶部/底部选项 |
| `src/sidepanel/styles.css` | 修改 | 深色模式置顶颜色；新增 note-editor-wrapper |
| `_locales/zh_CN/messages.json` | 修改 | 新增文案 |
| `_locales/en/messages.json` | 修改 | 新增文案 |

---

## 七、测试验收

- [ ] 右键菜单：选中文字后能显示"保存到 SlideNote"选项
- [ ] 右键菜单：点击后笔记成功创建
- [ ] 右键菜单：保存成功通知正常显示
- [ ] 摘录格式：时间、内容、来源链接格式正确
- [ ] 摘录聚合：同一天的摘录在同一条笔记中
- [ ] 摘录分隔：多条摘录用 `---` 正确分隔
- [ ] 长度限制：超过 3000 字有提示
- [ ] 夜间模式：置顶笔记颜色正常
- [ ] 导航按钮：在置顶笔记间导航正常
- [ ] 编辑器 Header：长内容时 Header 保持固定在顶部
- [ ] 右键菜单：移除了"移动到顶部/底部"选项

---

## 八、已知问题

无

---

## 九、后续规划

- [ ] 考虑添加摘录来源页面标题的智能截断
- [ ] 考虑支持保存图片（右键图片）
- [ ] 考虑摘录支持标签分类
