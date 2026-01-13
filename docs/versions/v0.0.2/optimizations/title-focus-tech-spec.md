# 新建笔记后聚焦到标题 - 技术规格文档

> 设计 + 技术实现方案

---

## 一、需求分析

### 当前问题

```
用户点击 [新建]
    ↓
创建笔记（title: "未命名笔记"）
    ↓
选中笔记，渲染编辑器
    ↓
光标在内容区 textarea
    ↓
用户直接输入内容
    ↓
产生大量"未命名笔记" ❌
```

### 期望行为

```
用户点击 [新建]
    ↓
创建笔记（title: ""）
    ↓
选中笔记，渲染编辑器
    ↓
光标自动聚焦到标题输入框
    ↓
用户直接输入标题
    ↓
按 Tab 或点击内容区，继续编辑正文 ✅
```

---

## 二、技术方案

### 2.1 事件流程设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        事件流程图                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Toolbar                    App.js                NoteEditor     │
│                                                                 │
│  [+新建]                     note:create                         │
│    │                           │                                │
│    └──────────────────────────→│                                │
│                                │                                │
│                                │  createNote()                 │
│                                │  ┌─────────────────────────┐  │
│                                │  │ title: ""               │  │
│                                │  │ content: ""             │  │
│                                │  │ isNew: true ← 新增标记  │  │
│                                │  └─────────────────────────┘  │
│                                │                                │
│                                │  note:select(id, isNew)       │
│                                │  ──────────────────────────→  │
│                                │                                │
│                                │                                │  渲染编辑器
│                                │                                │  ──────────
│                                │                                │  ↓
│                                │                                │  if (isNew)
│                                │                                │    延迟聚焦标题
│                                │                                │
│                                │  note:ready                  │
│                                │  ←──────────────────────────  │
│                                │  (可选：通知已完成聚焦)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心改动

#### 改动 1: Store.createNote() 返回新建标记

```javascript
// src/sidepanel/core/Store.js

async createNote() {
  const note = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: '',           // 改为空字符串
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  this.state.notes.unshift(note);
  await this._persist();

  return { ...note, isNew: true };  // 返回时带上 isNew 标记
}
```

#### 改动 2: App.js 传递 isNew 标记

```javascript
// src/sidepanel/app.js

bus.on('note:create', async () => {
  const result = await this.store.createNote();  // 获取带标记的结果

  // 发出选中事件，带上 isNew 标记
  bus.emit('note:select', result.id, { isNew: result.isNew });
});
```

#### 改动 3: NoteEditor 监听并处理聚焦

```javascript
// src/sidepanel/components/NoteEditor.js

export class NoteEditor {
  constructor(props = {}) {
    // ...
    this._isNewNote = false;  // 新增状态标记
    this._setupListeners();
  }

  _setupListeners() {
    // 监听笔记选择
    const unsubscribeSelect = this.props.bus?.on('note:select', async (id, options = {}) => {
      if (this.state.note?.id === id) return;

      await this._savePendingChanges();

      const note = this.props.store?.state.notes.find(n => n.id === id);
      this._isNewNote = options.isNew || false;  // 保存是否为新笔记
      this.setState({ note: note || null });
      this._updateContainer();

      // 如果是新笔记，聚焦到标题
      if (this._isNewNote) {
        this._focusTitleInput();
      }
    });
    // ...
  }

  /**
   * 聚焦到标题输入框
   * @private
   */
  _focusTitleInput() {
    // 使用 setTimeout 确保 DOM 渲染完成
    setTimeout(() => {
      if (this._titleInput) {
        this._titleInput.focus();
        this._titleInput.select();  // 选中全部文本（如果有默认文本）
      }
    }, 50);
  }

  render() {
    const container = document.createElement('div');
    container.className = 'note-content-section';

    if (!this.state.note) {
      container.innerHTML = this._renderEmpty();
      return container;
    }

    // 头部
    const header = document.createElement('div');
    header.className = 'note-header';

    const titleInput = document.createElement('input');
    titleInput.className = 'note-title-input';
    titleInput.value = this.state.note.title;
    titleInput.placeholder = t('unnamedNote');
    titleInput.dataset.role = 'title';  // 添加标识，便于查找

    // Tab 键支持：从标题跳到内容区
    titleInput.onkeydown = (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this._textarea?.focus();
      }
    };

    titleInput.oninput = (e) => {
      this._saveDebounced(this.state.note.id, { title: e.target.value });
    };

    // ... 其余代码

    const textarea = document.createElement('textarea');
    textarea.className = 'note-content-textarea';
    textarea.value = this.state.note.content;
    textarea.placeholder = t('startTyping');

    // Tab 键支持：从内容区跳回标题
    textarea.onkeydown = (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this._titleInput?.focus();
      }
    };

    textarea.oninput = (e) => {
      this._saveDebounced(this.state.note.id, { content: e.target.value });
    };

    // ...
  }
}
```

---

## 三、UI/UX 设计细节

### 3.1 视觉反馈

聚焦到标题时，添加视觉提示：

```css
/* src/sidepanel/styles.css */

/* 标题输入框聚焦样式 */
.note-title-input:focus {
  outline: none;
  border-bottom: 2px solid var(--color-primary, #0066cc);
  background-color: var(--color-bg-hover, #f9fafb);
}

/* 聚焦时的平滑过渡 */
.note-title-input {
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
```

### 3.2 Placeholder 设计

新建笔记时，标题为空，显示友好的 placeholder：

```javascript
// 当前：placeholder = t('unnamedNote')  // "未命名笔记"
// 优化后：placeholder = t('enterNoteTitle')  // "输入笔记标题..."
```

需要在 `_locales/zh_CN/messages.json` 和 `_locales/en/messages.json` 添加：

```json
{
  "enterNoteTitle": {
    "message": "输入笔记标题...",
    "description": "标题输入框占位符"
  }
}
```

### 3.3 边界情况处理

| 场景 | 行为 |
|------|------|
| 用户不输入标题，按 Tab | 光标跳到内容区，标题保持为空 |
| 用户不输入标题，点击内容区 | 正常编辑内容，标题为空 |
| 用户输入标题后按 Tab | 光标跳到内容区，标题已保存 |
| 笔记列表为空时新建 | 聚焦到标题 |
| 切换到已有笔记 | 不聚焦标题，保持当前焦点状态 |

---

## 四、实现步骤

### Phase 1: 基础功能 (必须)

| 步骤 | 文件 | 改动内容 |
|------|------|----------|
| 1.1 | `Store.js` | createNote 返回 `{ isNew: true }` |
| 1.2 | `app.js` | note:select 事件传递 isNew 标记 |
| 1.3 | `NoteEditor.js` | 添加 _focusTitleInput() 方法 |
| 1.4 | `NoteEditor.js` | 新建笔记时自动调用聚焦方法 |

### Phase 2: 交互优化 (推荐)

| 步骤 | 文件 | 改动内容 |
|------|------|----------|
| 2.1 | `NoteEditor.js` | 添加 Tab 键切换支持 |
| 2.2 | `styles.css` | 添加聚焦时的视觉反馈 |
| 2.3 | `messages.json` | 添加 "enterNoteTitle" 国际化文本 |
| 2.4 | `NoteEditor.js` | 新建笔记时使用友好 placeholder |

---

## 五、测试用例

### 5.1 功能测试

| 用例 | 操作 | 预期结果 |
|------|------|----------|
| TC1 | 点击 [新建] 按钮 | 光标自动聚焦到标题输入框 |
| TC2 | 新建后直接输入文字 | 文字出现在标题框中 |
| TC3 | 新建后按 Tab 键 | 光标跳到内容区 |
| TC4 | 内容区按 Shift+Tab | 光标跳回标题框 |
| TC5 | 新建后不输入，点击内容区 | 内容区获得焦点，标题为空 |
| TC6 | 切换到已有笔记 | 不自动聚焦标题 |

### 5.2 兼容性测试

| 浏览器 | 版本 | 测试结果 |
|--------|------|----------|
| Chrome | 114+ | 待测试 |
| Edge | 114+ | 待测试 |

---

## 六、验收标准

### 必须满足

- [ ] 点击新建后，光标自动聚焦到标题输入框
- [ ] 新建笔记时标题为空，显示 placeholder "输入笔记标题..."
- [ ] 用户可直接输入标题，无需手动点击
- [ ] 按 Tab 键可从标题跳到内容区
- [ ] 按 Shift+Tab 可从内容区跳回标题
- [ ] 切换已有笔记时，不自动聚焦

### 优化项

- [ ] 聚焦时有平滑的视觉过渡效果
- [ ] 保存后显示 "已保存" 提示
- [ ] 标题为空时，列表显示友好的占位文本

---

## 七、文件清单

### 需要修改的文件

```
src/sidepanel/
├── core/
│   └── Store.js                    ← 修改 createNote 返回值
├── app.js                          ← 修改 note:create 监听器
├── components/
│   └── NoteEditor.js               ← 添加聚焦逻辑 + Tab 支持
├── styles.css                      ← 添加聚焦样式
└── _locales/
    ├── zh_CN/messages.json         ← 添加 enterNoteTitle
    └── en/messages.json            ← 添加 enterNoteTitle
```

### 新增文件

```
docs/versions/v0.0.2/
└── optimizations/
    └── title-focus-tech-spec.md    ← 本文档
```

---

## 八、代码片段汇总

### Store.js 改动

```javascript
async createNote() {
  const note = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  this.state.notes.unshift(note);
  await this._persist();

  return { ...note, isNew: true };
}
```

### app.js 改动

```javascript
bus.on('note:create', async () => {
  const result = await this.store.createNote();
  bus.emit('note:select', result.id, { isNew: result.isNew });
});
```

### NoteEditor.js 改动

```javascript
// 添加状态
this._isNewNote = false;

// 监听时保存标记
bus.on('note:select', async (id, options = {}) => {
  // ...
  this._isNewNote = options.isNew || false;
  // ...
  if (this._isNewNote) {
    this._focusTitleInput();
  }
});

// 聚焦方法
_focusTitleInput() {
  setTimeout(() => {
    if (this._titleInput) {
      this._titleInput.focus();
    }
  }, 50);
}
```

---

## 九、后续优化建议

1. **智能聚焦**：如果用户上次编辑的是内容区，重新打开时聚焦到内容区
2. **快捷键**：添加 `Cmd/Ctrl + N` 快速新建笔记
3. **标题建议**：根据内容首行自动生成标题建议
4. **空状态处理**：标题为空时，列表显示更友好的占位图标

---

**文档版本**: v1.0
**创建日期**: 2026-01-13
**作者**: Claude (技术专家 + UI 专家)
