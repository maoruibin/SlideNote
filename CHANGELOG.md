# 更新日志

## [0.0.7] - 2026-01-23

### 新增
- [x] 版本目录创建
- [x] 需求规划
- [x] 导入导出功能开发
- [x] 关于弹窗开发
- [x] 更多菜单开发
- [ ] 置顶功能开发
- [ ] 右键菜单保存功能开发
- [ ] 测试验收
- [ ] 版本发布

### 修复
- [x] 删除Bug修复


v0.0.6 (2025-01-19)

### 新增功能
- 🌙 夜间模式（自动跟随系统深色模式设置）

### Bug 修复
- 🐛 修复删除笔记后编辑器内容不更新的问题
- 🎨 修复暗色模式下社交图标颜色不适配的问题

### 体验优化
- 🎨 Toolbar 重新设计：搜索/返回按钮无边框，新建按钮占满中间区域
- 🎨 统一按钮图标尺寸（16px），视觉更协调
- 🎨 Toolbar 左右间距对称，布局更平衡

### 技术变更
- 使用 `@media (prefers-color-scheme: dark)` 实现暗色模式
- 新增暗色模式 CSS 变量体系
- 删除时通过全局 bus 发出 `note:select` 事件
- 使用 CSS filter 修复暗色模式下图标颜色

### 打包信息
- 版本: 0.0.6
- 发布包: `releases/SlideNote-v0.0.6.zip`

---

## v0.0.3 (2025-01-14)

### 新增功能
- ✍️ Markdown 编辑器（预览/编辑模式切换）
- 📋 富文本复制（带样式，可直接粘贴到其他应用）
- 📝 Markdown 源码复制
- ⬆️⬇️ 笔记导航箭头（上一篇/下一篇）
- 💾 每笔记独立记忆浏览模式
- ❓ Markdown 语法帮助弹窗
- 🔀 线性风格导航图标

### 技术变更
- 引入 marked.js 库用于 Markdown 渲染
- 新增 EditorMoreMenu 组件（更多菜单）
- 新增 SyntaxHelpModal 组件（语法帮助）
- 重构 NoteEditor 为预览优先设计
- 新增 marked.js 工具类
- 新增延迟编辑模式激活机制

### 文件变更
- 新增: `src/sidepanel/components/EditorMoreMenu.js`
- 新增: `src/sidepanel/components/SyntaxHelpModal.js`
- 新增: `src/sidepanel/utils/marked.js`
- 修改: `src/sidepanel/components/NoteEditor.js`
- 修改: `src/sidepanel/app.js`
- 修改: `src/sidepanel/styles.css`
- 修改: `_locales/*/messages.json` (所有翻译文件)

### 打包信息
- 版本: 0.0.3
- 包大小: 82.51 KB (gzip: 24.45 KB)
- zip 包: `versions/SlideNote-v0.0.3.zip` (46.5 KB)

---

## v0.0.2 (2024-12-XX)

### 新增功能
- 基础 CRUD 操作
- 自动保存（1秒延迟）
- 跨设备同步（Chrome Storage API）
- 搜索和过滤
- 笔记排序（右键菜单）
- UI 优化

---

## 版本规则

- **v0.0.x**: 初始开发版本，功能逐步完善
- **v0.1.0**: 第一个稳定版本
- **v1.0.0**: 正式发布版本
