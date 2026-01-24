# v0.0.7 置顶功能 - 技术实现方案

> **版本**: v0.0.7
> **日期**: 2025-01-23
> **状态**: 待开发
> **设计原则**: 简单、稳定、不过度设计

---

## 一、需求概述

用户可以将重要笔记置顶，置顶的笔记始终显示在列表最前面，使用橙色左侧条 + 极浅橙背景标识。

---

## 二、涉及文件

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/sidepanel/core/Store.js` | 修改 | 添加 `togglePin()` 方法，支持 `pinned` 字段 |
| `src/sidepanel/components/ContextMenu.js` | 修改 | 添加置顶菜单项 |
| `src/sidepanel/components/NoteList.js` | 修改 | 处理置顶操作，添加分隔线渲染 |
| `src/sidepanel/styles.css` | 修改 | 添加置顶样式 CSS |
| `src/_locales/zh_CN.dev.json` | 修改 | 添加置顶文案 |
| `src/_locales/en.dev.json` | 修改 | 添加置顶文案 |

---

## 三、数据结构

### 3.1 笔记对象扩展

```javascript
// 新增 pinned 字段
{
  id: "note_123",
  title: "AI 提示词",
  content: "...",
  pinned: true,        // ← 新增：是否置顶
  createdAt: 1234567890,
  updatedAt: 1234567890,
  order: 1
}
```

### 3.2 存储兼容性

- 已有笔记的 `pinned` 字段默认为 `undefined`，按 `false` 处理
- 新建笔记时 `pinned` 默认为 `false`
- Chrome Storage API 自动处理新增字段

---

## 四、详细实现

### 4.1 Store.js - 核心逻辑

```javascript
/**
 * 切换笔记置顶状态
 * @param {string} id - 笔记ID
 */
async togglePin(id) {
  const note = this.state.notes.find(n => n.id === id);
  if (!note) return;

  // 切换置顶状态
  note.pinned = !note.pinned;
  note.updatedAt = Date.now();

  // 持久化并通知
  await this._persist();
  this.emit('change');
  this.emit('note-updated', note);
}

/**
 * 获取排序后的笔记（置顶在前）
 * @returns {Array} 排序后的笔记数组
 */
getSortedNotes() {
  const pinned = this.state.notes.filter(n => n.pinned);
  const unpinned = this.state.notes.filter(n => !n.pinned);

  // 各自按 order 降序排序（大的在前）
  pinned.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  unpinned.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

  return [...pinned, ...unpinned];
}
```

### 4.2 ContextMenu.js - 菜单项

```javascript
/**
 * 获取菜单项配置（修改 _getMenuItems 方法）
 * @private
 */
_getMenuItems(index, total, note) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isOnlyOne = total === 1;
  const isPinned = note?.pinned || false;

  return [
    {
      id: 'move-top',
      label: t('moveToTop'),
      icon: '⇧',
      disabled: isFirst || isOnlyOne,
    },
    {
      id: 'move-up',
      label: t('moveUp'),
      icon: '↑',
      disabled: isFirst || isOnlyOne,
    },
    {
      id: 'move-down',
      label: t('moveDown'),
      icon: '↓',
      disabled: isLast || isOnlyOne,
    },
    {
      id: 'move-bottom',
      label: t('moveToBottom'),
      icon: '⇩',
      disabled: isLast || isOnlyOne,
    },
    {
      id: 'divider-1',
      divider: true,
    },
    {
      id: 'pin',
      label: isPinned ? '   取消置顶' : '▌ 置顶',
      icon: isPinned ? '◽' : '▌',
      disabled: false,
    },
    {
      id: 'divider-2',
      divider: true,
    },
    {
      id: 'delete',
      label: t('delete'),
      icon: '×',
      disabled: false,
    },
  ];
}
```

### 4.3 ContextMenu.js - 签名修改

```javascript
/**
 * 显示菜单（修改 show 方法签名）
 * @param {number} x - 屏幕X坐标
 * @param {number} y - 屏幕Y坐标
 * @param {Object} options - 选项配置
 * @param {number} options.index - 当前笔记索引
 * @param {number} options.total - 总笔记数
 * @param {Object} options.note - 当前笔记对象（新增）
 */
show(x, y, options = {}) {
  const { index = 0, total = 1, note = null } = options;
  // ...
}
```

### 4.4 NoteList.js - 修改调用

```javascript
/**
 * 显示右键菜单（传入 note 对象）
 * @private
 */
_showContextMenu(e, note, index) {
  if (this._contextMenu) {
    this._contextMenu.close();
  }

  this._contextMenu = showContextMenu({
    x: e.clientX,
    y: e.clientY,
    index,
    total: this.state.notes.length,
    note: note,  // ← 新增：传入笔记对象
    onSelect: (action) => this._handleMenuAction(action, note),
  });
}

/**
 * 处理菜单操作（添加 pin 分支）
 * @private
 */
async _handleMenuAction(action, note) {
  const store = this.props.store;
  if (!store) return;

  switch (action) {
    case 'move-top':
      await store.moveNoteToTop(note.id);
      break;
    case 'move-up':
      await store.moveNoteUp(note.id);
      break;
    case 'move-down':
      await store.moveNoteDown(note.id);
      break;
    case 'move-bottom':
      await store.moveNoteToBottom(note.id);
      break;
    case 'pin':  // ← 新增
      await store.togglePin(note.id);
      break;
    case 'delete':
      this.props.bus?.emit('note:delete-request', note);
      break;
  }
}
```

### 4.5 NoteList.js - 分隔线渲染

```javascript
/**
 * 渲染笔记列表（添加分隔线）
 */
render() {
  const notes = this.props.store.getSortedNotes();  // ← 使用排序后的笔记

  this.el.innerHTML = '';

  let lastPinnedIndex = -1;

  notes.forEach((note, index) => {
    if (!note.pinned && lastPinnedIndex === -1) {
      lastPinnedIndex = index;
    }

    const itemEl = this._renderItem(note, index);
    this.el.appendChild(itemEl);

    // 在最后一个置顶笔记后插入分隔线
    if (note.pinned && (index === notes.length - 1 || !notes[index + 1]?.pinned)) {
      const divider = document.createElement('div');
      divider.className = 'pinned-divider';
      this.el.appendChild(divider);
    }
  });
}
```

---

## 五、CSS 样式

```css
/* ============================================
   置顶笔记样式
   ============================================ */

/* 置顶笔记：橙色左侧条 + 极浅橙背景 */
.note-item.pinned {
  background: #fff9f0;              /* 极浅的橙色背景 */
  border-left: 3px solid #f59e0b;  /* 橙色左侧条 */
}

/* 置顶笔记悬停效果 */
.note-item.pinned:hover {
  background: #fff3e0;  /* 稍深的橙色背景 */
}

/* 置顶笔记与普通笔记之间的分隔线 */
.pinned-divider {
  border-top: 1px dashed var(--color-border);
  margin: 4px 0 8px 0;
  opacity: 0.5;
  height: 0;
}

/* 置顶笔记标题（可选：加粗强调） */
.note-item.pinned .note-title {
  font-weight: 500;  /* 比普通笔记稍粗 */
  color: var(--color-text-primary);
}

/* 选中状态优先（保持蓝色） */
.note-item.pinned.active {
  background: var(--color-primary-light);
  border-left-color: var(--color-primary);
}

.note-item.pinned.active:hover {
  background: #dbeafe;  /* 选中态的悬停色 */
}
```

---

## 六、国际化文案

### 6.1 中文 (src/_locales/zh_CN.dev.json)

```json
{
  "pin": {
    "message": "▌ 置顶"
  },
  "unpin": {
    "message": "   取消置顶"
  }
}
```

### 6.2 英文 (src/_locales/en.dev.json)

```json
{
  "pin": {
    "message": "▌ Pin"
  },
  "unpin": {
    "message": "   Unpin"
  }
}
```

---

## 七、实施步骤

| 步骤 | 任务 | 文件 | 预估时间 |
|------|------|------|----------|
| 1 | Store.js: 添加 `togglePin()` 方法 | Store.js | 15min |
| 2 | Store.js: 添加 `getSortedNotes()` 方法 | Store.js | 10min |
| 3 | ContextMenu.js: 添加置顶菜单项 | ContextMenu.js | 15min |
| 4 | ContextMenu.js: 修改 show() 签名 | ContextMenu.js | 5min |
| 5 | NoteList.js: 修改调用传入 note | NoteList.js | 10min |
| 6 | NoteList.js: 添加 pin 处理分支 | NoteList.js | 10min |
| 7 | NoteList.js: 添加分隔线渲染 | NoteList.js | 15min |
| 8 | styles.css: 添加置顶样式 | styles.css | 10min |
| 9 | i18n: 添加中英文文案 | _locales/*.json | 5min |
| 10 | 测试与调试 | - | 15min |

**总计**: 约 1.5 小时

---

## 八、验收标准

- [ ] 右键菜单显示"▌ 置顶 / 取消置顶"选项
- [ ] 点击置顶，笔记显示橙色左侧条 + 极浅橙背景
- [ ] 置顶笔记排在列表最前面
- [ ] 多个置顶笔记按原有顺序排列
- [ ] 置顶状态跨设备同步
- [ ] 置顶笔记与普通笔记之间有虚线分隔
- [ ] 全部取消置顶时隐藏分隔线
- [ ] 选中状态与置顶状态不冲突（选中优先）

---

## 九、注意事项

### 9.1 兼容性

- 已有笔记的 `pinned` 为 `undefined`，需要兼容处理
- `note?.pinned || false` 确保不报错

### 9.2 性能

- 每次切换置顶只修改一条笔记，性能开销小
- `getSortedNotes()` 在渲染时调用，数据量小时无性能问题

### 9.3 边界情况

| 情况 | 处理方式 |
|------|----------|
| 搜索状态 | 按相关度排序，暂不应用置顶排序 |
| 笔记不存在 | `togglePin()` 直接 return，不操作 |
| 侧边栏收起 | 左侧条保持显示，不占额外空间 |

---

> **设计原则**：简单、稳定、不过度设计
