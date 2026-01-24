# v0.0.7 产品需求文档

> **版本**: v0.0.7
> **日期**: 2025-01-21
> **状态**: 待发布

---

## 一、需求概述

本版本规划以下需求：

| 需求 | 类型 | 优先级 | 状态 |
|------|------|--------|------|
| 1. 导入导出功能 | 新增 | P1 | ✅ 已完成 |
| 2. 置顶功能 | 新增 | P1 | ✅ 已完成 |
| 3. 删除笔记 Bug 修复 | 修复 | P0 | ✅ 已完成 |
| 4. 关于弹窗 | 新增 | P1 | ✅ 已完成 |
| 5. Footer 更多菜单 | 新增 | P1 | ✅ 已完成 |
| 6. 右键菜单保存选中内容 | 新增 | P0 | ↪ 移至 v0.0.8 |

---

## 二、版本进度

- [x] 版本目录创建
- [x] 需求规划
- [x] 导入导出功能开发
- [x] 置顶功能开发
- [x] 关于弹窗开发
- [x] 更多菜单开发
- [x] 删除Bug修复
- [ ] 测试验收
- [ ] 版本发布

---

## 三、需求详情

### 3.1 导入导出功能

详细文档：[features/import-export/PRD.md](./features/import-export/PRD.md)

**实现内容**：
- ✅ ExportDialog 组件 - 导出笔记为 JSON
- ✅ ImportDialog 组件 - 从 JSON 导入备份
- ✅ 支持全量导出/导入

### 3.2 置顶功能

详细文档：[features/pin-notes/PRD.md](./features/pin-notes/PRD.md)

**实现内容**：
- ✅ Store.js: `togglePin()` 和 `getSortedNotes()` 方法
- ✅ NoteList.js: 置顶笔记样式、分隔线渲染
- ✅ ContextMenu.js: 置顶/取消置顶菜单项
- ✅ 橙色主题（#fff9f0 背景，#f59e0b 竖条）
- ✅ i18n: pin/unpin 翻译

### 3.3 删除笔记 Bug 修复

详细文档：[bugs/delete-bug/PRD.md](./bugs/delete-bug/PRD.md)

**实现内容**：
- ✅ NoteEditor.js: 使用 `getSortedNotes()` 修复导航按钮
- ✅ 删除后正确切换到下一条笔记

### 3.4 关于弹窗

详细文档：[design/about-page-design.md](./design/about-page-design.md)

**实现内容**：
- ✅ AboutModal.js 组件
- ✅ 显示版本信息、Slogan
- ✅ 作者信息、更多作品链接

### 3.5 Footer 更多菜单

详细文档：[design/more-menu-design.md](./design/more-menu-design.md)

**实现内容**：
- ✅ MoreMenu.js 组件
- ✅ 菜单项：导出、导入、反馈、GitHub、关于
- ✅ 鼠标悬停触发

### 3.6 右键菜单保存选中内容

**状态**: ↪ 移至 v0.0.8

此功能需要实现浏览器级别的右键菜单（chrome.contextMenus API），涉及：
- background.js 添加 contextMenus 创建
- 内容脚本获取选中文本
- 与 sidepanel 通信保存数据

由于技术复杂度较高，移至下一版本优先实现。

---

## 四、版本总结

**完成度**: 5/5 项（100%）

**核心更新**：
- 📤📥 导入导出功能 - 数据备份与迁移
- 📌 置顶功能 - 常用笔记快速访问
- 🐛 Bug 修复 - 删除导航问题
- ℹ️ 关于弹窗 - 产品信息展示
- ⋯ 更多菜单 - 功能入口整合

---

> **设计原则**：保持简单，符合"便利贴"定位，零维护成本。
