# v0.0.7 置顶功能 - 产品需求文档

> **版本**: v0.0.7
> **需求类型**: 新增功能
> **优先级**: P1
> **状态**: 待开发
> **日期**: 2025-01-23（UI方案更新）

---

## 一、需求描述

用户可以将重要笔记置顶，置顶的笔记始终显示在列表最前面，不受排序影响。

---

## 二、交互设计

### 2.1 操作方式

| 操作 | 效果 |
|------|------|
| 右键笔记 → "置顶" | 笔记置顶，菜单项变为"取消置顶" |
| 右键笔记 → "取消置顶" | 笔记取消置顶 |
| 多个置顶笔记 | 按原来顺序排列在最前 |

### 2.2 UI 展示

```
┌────────────────────────────┐
│  [+ 新建]        [搜索 🔍]  │
├────────────────────────────┤
│▌▌ AI 提示词               │  ← 置顶笔记（橙色左侧条 + 极浅橙背景）
│   用于 DeepSeek 写作...     │
│▌▌ 常用命令                 │  ← 置顶笔记
│   Git 常用命令...           │
│ ─────────────────────────  │  ← 分隔线（虚线）
│   服务器地址               │  ← 普通笔记
│   192.168.1.1...          │
└────────────────────────────┘
```

### 2.3 右键菜单

```
┌────────────────────┐
│ ↑ 移动到顶部        │
│ ↑ 上移              │
│ ↓ 下移              │
│ ↓ 移动到底部        │
│ ──────────────────│
│ ▌ 置顶             │  ← 新增（未置顶时显示）
│   取消置顶         │     ← 新增（已置顶时显示）
│ ──────────────────│
│ 🗑️ 删除             │
└────────────────────┘
```

---

## 三、视觉设计方案

### 3.1 方案选择：左侧彩色条 + 轻微背景

```
┌────────────────────────────┐
│▌▌ AI 提示词               │  ← 橙色左侧条 + 轻微背景
│   用于 DeepSeek...         │
│▌▌ 常用命令                 │
│   Git 常用命令...           │
│ ─────────────────────────  │
│   服务器地址               │  ← 普通
└────────────────────────────┘
```

### 3.2 视觉状态表

| 状态 | 左侧条 | 背景 |
|------|--------|------|
| 普通笔记 | 透明 | 白色 |
| 置顶笔记 | 橙色 `#f59e0b` | 极浅橙 `#fff9f0` |
| 选中笔记 | 蓝色 `#3b82f6` | 浅蓝 `#eff6ff` |
| 置顶+选中 | 蓝色（选中优先） | 浅蓝 |

### 3.3 CSS 样式

```css
/* 置顶笔记 */
.note-item.pinned {
  background: #fff9f0;              /* 极浅的橙色背景 */
  border-left: 3px solid #f59e0b;  /* 橙色左侧条 */
}

/* 普通笔记 */
.note-item {
  background: var(--color-bg-primary);
  border-left: 3px solid transparent;
}

/* 选中笔记（保持蓝色） */
.note-item.active {
  background: var(--color-primary-light);
  border-left-color: var(--color-primary);
}

/* 置顶且选中 - 选中状态优先 */
.note-item.pinned.active {
  background: var(--color-primary-light);
  border-left-color: var(--color-primary);
}

/* 悬停效果 */
.note-item.pinned:hover {
  background: #fff3e0;  /* 稍深的橙色背景 */
}
```

### 3.4 分隔线样式

```css
/* 置顶笔记与普通笔记之间的分隔 */
.pinned-divider {
  border-top: 1px dashed var(--color-border);
  margin: 4px 0 8px 0;
  opacity: 0.5;
}

/* 无置顶笔记时隐藏分隔线 */
.pinned-divider:empty {
  display: none;
}
```

---

## 四、数据结构

### 4.1 笔记对象扩展

```javascript
{
  id: "note_xxx",
  title: "标题",
  content: "内容",
  pinned: true,  // ← 新增：是否置顶
  createdAt: 1234567890,
  updatedAt: 1234567890,
  order: 1
}
```

---

## 五、技术实现要点

### 5.1 Store.js 扩展

```javascript
// 切换置顶状态
async togglePin(id) {
  const note = this.state.notes.find(n => n.id === id);
  if (!note) return;

  note.pinned = !note.pinned;
  note.updatedAt = Date.now();

  await this._persist();
  this.emit('change');
  this.emit('note-updated', note);
}

// 获取排序后的笔记（置顶在前）
getSortedNotes() {
  const pinned = this.state.notes.filter(n => n.pinned);
  const unpinned = this.state.notes.filter(n => !n.pinned);

  // 各自按 order 排序
  pinned.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  unpinned.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

  return [...pinned, ...unpinned];
}
```

### 5.2 NoteList.js 修改

```javascript
// 右键菜单添加置顶选项
_renderContextMenu(note) {
  const menuItems = [
    { label: t('moveToTop'), action: () => this._moveToTop(note) },
    // ...
    {
      label: note.pinned ? '   取消置顶' : '▌ 置顶',
      action: () => this._togglePin(note)
    },
    // ...
  ];
}

_togglePin(note) {
  this.props.store?.togglePin(note.id);
}

// 渲染列表时插入分隔线
render() {
  const notes = this.props.store.getSortedNotes();
  const lastPinnedIndex = notes.findIndex(n => !n.pinned);

  // ... 渲染逻辑
  // 如果有置顶笔记，在最后一个置顶笔记后插入分隔线
}
```

---

## 六、国际化文案

| Key | 中文 | English |
|-----|------|---------|
| pin | ▌ 置顶 | Pin |
| unpin |   取消置顶 | Unpin |

---

## 七、验收标准

- [ ] 右键菜单显示"▌ 置顶/取消置顶"选项
- [ ] 置顶笔记显示橙色左侧条 + 极浅橙背景
- [ ] 置顶笔记排在列表最前面
- [ ] 多个置顶笔记按原有顺序排列
- [ ] 置顶状态跨设备同步
- [ ] 置顶笔记与普通笔记之间有虚线分隔
- [ ] 全部取消置顶时隐藏分隔线
- [ ] 选中状态与置顶状态不冲突

---

## 八、边界情况

| 情况 | 处理方式 |
|------|----------|
| 搜索状态 | 置顶排序是否生效？建议：搜索时按相关度，不按置顶 |
| 侧边栏收起 | 左侧条保持显示，占空间小不影响 |
| 全部取消置顶 | 隐藏分隔线 |
| 置顶+选中 | 选中状态优先，显示蓝色边条和背景 |

---

> **设计原则**：保持简单，使用橙色系表示"重要"，不干扰快速存取的核心体验。
