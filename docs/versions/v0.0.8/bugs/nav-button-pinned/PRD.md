# 导航按钮问题 - Bug 修复

> **版本**: v0.0.8
> **类型**: Bug 修复
> **优先级**: P1
> **日期**: 2025-01-28
> **状态**: 待开发

---

## 一、问题描述

### 1.1 问题位置

导航功能存在于两个位置：

| 位置 | 组件 | 说明 |
|------|------|------|
| **右键菜单** | `ContextMenu.js` | 笔记列表项右键菜单 |
| **编辑器工具栏** | `NoteEditor.js` | 编辑区顶部向上/向下按钮 |

### 1.2 右键菜单问题

**代码位置**: `src/sidepanel/components/NoteList.js` 第 195-209 行

```javascript
_showContextMenu(e, note, index) {
  this._contextMenu = showContextMenu({
    x: e.clientX,
    y: e.clientY,
    index,                          // 基于 getSortedNotes() 的索引
    total: this.state.notes.length,  // ❌ 问题：使用 state.notes 而非 getSortedNotes()
    note,
    onSelect: (action) => this._handleMenuAction(action, note),
  });
}
```

**问题分析**：
- `render()` 使用 `getSortedNotes()` 显示笔记（置顶在前）
- 传递给菜单的 `index` 是排序后的索引
- 但 `total` 使用的是 `this.state.notes.length`
- 如果 `this.state.notes` 未同步更新，边界判断可能错误

**ContextMenu.js 判断逻辑**（第 112-114 行）：
```javascript
const isFirst = index === 0;
const isLast = index === total - 1;  // 可能错误
```

### 1.3 编辑器工具栏问题

**代码位置**: `src/sidepanel/components/NoteEditor.js` 第 126-160 行

```javascript
// 获取当前笔记在列表中的位置（使用置顶排序后的顺序）
const notes = this.props.store?.getSortedNotes() || [];
const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);
const isFirst = currentIndex <= 0;
const isLast = currentIndex >= notes.length - 1;
```

这部分代码看起来是正确的，使用了 `getSortedNotes()`。

---

## 二、复现步骤

### 2.1 右键菜单问题

1. 创建 2 个置顶笔记 + 2 个普通笔记
2. 右键点击第一篇置顶笔记
3. 查看"向上"、"移到顶部"按钮是否被禁用
4. 右键点击最后一篇笔记
5. 查看"向下"、"移到底部"按钮是否被禁用

### 2.2 编辑器工具栏问题

1. 创建 2 个置顶笔记 + 2 个普通笔记
2. 选中普通笔记
3. 点击编辑器顶部向上按钮
4. 观察能否正确移动到置顶笔记
5. 在置顶笔记间导航

---

## 三、修复方案

### 3.1 右键菜单修复

**文件**: `src/sidepanel/components/NoteList.js`

**修改前**：
```javascript
_showContextMenu(e, note, index) {
  this._contextMenu = showContextMenu({
    x: e.clientX,
    y: e.clientY,
    index,
    total: this.state.notes.length,  // ❌ 错误
    note,
    onSelect: (action) => this._handleMenuAction(action, note),
  });
}
```

**修改后**：
```javascript
_showContextMenu(e, note, index) {
  // 使用排序后的笔记列表获取正确的 total
  const notes = this.props.store ? this.props.store.getSortedNotes() : this.state.notes;

  this._contextMenu = showContextMenu({
    x: e.clientX,
    y: e.clientY,
    index,
    total: notes.length,  // ✅ 修复：使用 getSortedNotes() 的长度
    note,
    onSelect: (action) => this._handleMenuAction(action, note),
  });
}
```

### 3.2 编辑器工具栏

**需要验证**：编辑器工具栏代码看起来正确，但需要测试确认。

---

## 四、验收标准

- [ ] 右键菜单：在第一篇笔记时，向上/移到顶部按钮正确禁用
- [ ] 右键菜单：在最后一篇笔记时，向下/移到底部按钮正确禁用
- [ ] 右键菜单：在置顶笔记间导航正常
- [ ] 右键菜单：在置顶和普通笔记间导航正常
- [ ] 编辑器工具栏：向上/向下按钮在所有场景下工作正常
- [ ] 编辑器工具栏：在置顶笔记间导航正常

---

## 五、相关文件

| 文件 | 问题 | 需要修复 |
|------|------|---------|
| `src/sidepanel/components/NoteList.js` | `total` 使用错误的数据源 | ✅ 需要 |
| `src/sidepanel/components/ContextMenu.js` | 依赖正确的 index/total | - |
| `src/sidepanel/components/NoteEditor.js` | 代码看起来正确 | ⚠️ 需验证 |
