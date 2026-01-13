# 数据导出功能 技术方案

> **版本**: v0.0.2
> **创建日期**: 2025-01-12
> **状态**: 设计中
> **设计原则**: 简单、可靠、可扩展

---

## 一、技术方案概述

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| **小而美** | 单一职责的 ExportManager，不超过 300 行 |
| **复用优先** | 复用现有 Store、EventBus、Component 基类 |
| **原生实现** | 不引入第三方库，用 Blob + URL.createObjectURL |
| **渐进增强** | MVP 先跑通，细节迭代优化 |

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Toolbar  │→ │ExportDialog  │→ │   Toast (反馈)        │  │
│  │ [⋮菜单]  │  │ (格式选择)   │  │   成功/失败提示       │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ExportManager (核心)                    │  │
│  │  • exportJSON()    • exportMarkdown()               │  │
│  │  • exportSingle()  • _download()                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ chrome.storage  │  │   Store.state   │                 │
│  │   .sync / .local│  │   (内存缓存)    │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、文件结构

```
src/sidepanel/
├── services/
│   └── ExportManager.js       # 导出核心逻辑（新增）
├── components/
│   ├── Toolbar.js              # 添加 [⋮ 更多] 菜单（修改）
│   ├── ExportDialog.js         # 导出对话框（新增）
│   └── NoteList.js             # 添加右键菜单"导出"（修改）
└── utils/
    ├── export-formatter.js     # 格式化工具（新增）
    └── filename-sanitizer.js   # 文件名清理（新增）
```

---

## 三、核心模块设计

### 3.1 ExportManager - 导出管理器

**职责**：统一处理所有导出逻辑

```javascript
/**
 * 导出管理器
 * 单例模式，全局唯一实例
 *
 * @example
 * const exporter = ExportManager.getInstance();
 * await exporter.exportJSON({ includeArchived: true });
 */
class ExportManager {
  #store;

  constructor(store) {
    this.#store = store;
  }

  /**
   * 导出为 JSON
   * @param {Object} options
   * @param {boolean} options.includeArchived - 是否包含归档笔记
   */
  async exportJSON(options = {}) {
    const { includeArchived = true } = options;

    // 1. 收集数据
    const data = await this.#collectData(includeArchived);

    // 2. 格式化
    const json = this.#formatJSON(data);

    // 3. 触发下载
    const filename = this.#getFilename('json');
    this.#download(json, filename, 'application/json');
  }

  /**
   * 导出全部为 Markdown
   */
  async exportMarkdownAll(options = {}) {
    const { includeArchived = false } = options;

    const notes = await this.#getNotes(includeArchived);
    const content = formatMarkdownAll(notes);
    const filename = this.#getFilename('md');

    this.#download(content, filename, 'text/markdown');
  }

  /**
   * 导出单条为 Markdown
   */
  async exportMarkdownSingle(noteId) {
    const note = this.#store.getNoteById(noteId);
    if (!note) throw new Error('Note not found');

    const content = formatMarkdownSingle(note);
    const filename = sanitizeFilename(note.title) + '.md';

    this.#download(content, filename, 'text/markdown');
  }

  /**
   * 收集所有数据
   * @private
   */
  async #collectData(includeArchived) {
    const { notes, activeNoteId } = this.#store.state;
    const result = {
      _meta: {
        version: chrome.runtime.getManifest().version,
        exportedAt: new Date().toISOString(),
        exportedBy: 'SlideNote Chrome Extension',
      },
      data: {
        notes,
        activeNoteId,
      },
    };

    if (includeArchived) {
      result.archived = await this.#getArchivedNotes();
    }

    return result;
  }

  /**
   * 获取归档笔记
   * @private
   */
  async #getArchivedNotes() {
    const result = await chrome.storage.local.get({
      [STORAGE_KEYS.ARCHIVED_NOTES]: [],
    });
    return result[STORAGE_KEYS.ARCHIVED_NOTES] || [];
  }

  /**
   * 触发浏览器下载
   * @private
   */
  #download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 生成文件名
   * @private
   */
  #getFilename(ext) {
    const date = new Date().toISOString().split('T')[0];
    const prefix = ext === 'json' ? 'SlideNote-Backup' : 'SlideNote-Notes';
    return `${prefix}-${date}.${ext}`;
  }
}

// 导出单例工厂
ExportManager.getInstance = function(store) {
  if (!ExportManager._instance) {
    ExportManager._instance = new ExportManager(store);
  }
  return ExportManager._instance;
};
```

### 3.2 格式化工具

```javascript
/**
 * src/sidepanel/utils/export-formatter.js
 */

/**
 * 格式化单条笔记为 Markdown
 */
export function formatMarkdownSingle(note) {
  const created = formatDate(note.createdAt);
  const updated = formatDate(note.updatedAt);
  const title = note.title || 'Untitled';

  return `# ${title}

> Created: ${created} | Updated: ${updated}

${note.content}

---

*Exported from SlideNote*
`;
}

/**
 * 格式化全部笔记为 Markdown
 */
export function formatMarkdownAll(notes) {
  const date = new Date().toLocaleString('zh-CN');

  let content = `# SlideNote Notes Backup

> Exported: ${date}
> Total: ${notes.length} notes

---

`;

  for (let i = 0; i < notes.length; i++) {
    content += formatMarkdownSingle(notes[i]);
    if (i < notes.length - 1) {
      content += '\n';
    }
  }

  return content;
}

/**
 * 格式化日期
 */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}
```

### 3.3 文件名清理工具

```javascript
/**
 * src/sidepanel/utils/filename-sanitizer.js
 */

/**
 * 清理文件名中的非法字符
 * @param {string} filename - 原始文件名
 * @returns {string} 清理后的文件名
 */
export function sanitizeFilename(filename) {
  if (!filename) return 'Untitled';

  // 移除 Windows/Linux 文件系统非法字符
  let cleaned = filename
    .replace(/[\/\\:*?"<>|\x00-\x1f]/g, '-')
    .trim();

  // 限制长度（大部分文件系统限制 255）
  if (cleaned.length > 200) {
    cleaned = cleaned.slice(0, 200);
  }

  // 移除首尾空格和点
  cleaned = cleaned.replace(/^\.+|\.+$/g, '');

  return cleaned || 'Untitled';
}
```

---

## 四、UI 组件设计

### 4.1 ExportDialog - 导出对话框

```javascript
/**
 * src/sidepanel/components/ExportDialog.js
 */
class ExportDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      format: 'json',           // json | markdown
      includeArchived: true,
      isExporting: false,
      archivedCount: 0,
    };
  }

  async onMounted() {
    // 获取归档笔记数量
    this.state.archivedCount = await this.#getArchivedCount();
    this.render();
  }

  render() {
    return `
      <div class="dialog-overlay">
        <div class="dialog">
          <div class="dialog-header">
            <span class="dialog-title">导出笔记</span>
            <button class="dialog-close" data-action="close">×</button>
          </div>

          <div class="dialog-body">
            <div class="export-format-section">
              <div class="export-format-option ${this.state.format === 'json' ? 'selected' : ''}"
                   data-action="select-format" data-format="json">
                <div class="format-icon">📦</div>
                <div class="format-info">
                  <div class="format-name">JSON</div>
                  <div class="format-desc">完整备份，包含元数据，适合恢复</div>
                </div>
              </div>

              <div class="export-format-option ${this.state.format === 'markdown' ? 'selected' : ''}"
                   data-action="select-format" data-format="markdown">
                <div class="format-icon">📝</div>
                <div class="format-info">
                  <div class="format-name">Markdown</div>
                  <div class="format-desc">可读性强，适合查看和迁移</div>
                </div>
              </div>
            </div>

            ${this.state.archivedCount > 0 ? `
              <label class="export-checkbox">
                <input type="checkbox" ${this.state.includeArchived ? 'checked' : ''}
                       data-action="toggle-archived">
                <span>包含归档笔记（共 ${this.state.archivedCount} 条）</span>
              </label>
            ` : ''}
          </div>

          <div class="dialog-footer">
            <button class="btn btn-secondary" data-action="close">取消</button>
            <button class="btn btn-primary" data-action="export"
                    ${this.state.isExporting ? 'disabled' : ''}>
              ${this.state.isExporting ? '导出中...' : '导出'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  onMounted() {
    // 绑定事件
    this.el.querySelectorAll('[data-action]').forEach(el => {
      el.onclick = (e) => this.#handleAction(e);
    });
  }

  async #handleAction(e) {
    const action = e.currentTarget.dataset.action;

    switch (action) {
      case 'close':
        this.unmount();
        break;

      case 'select-format':
        this.state.format = e.currentTarget.dataset.format;
        this.render();
        this.onMounted();
        break;

      case 'toggle-archived':
        this.state.includeArchived = e.currentTarget.checked;
        break;

      case 'export':
        await this.#doExport();
        break;
    }
  }

  async #doExport() {
    const exporter = ExportManager.getInstance(this.props.store);
    this.state.isExporting = true;
    this.render();

    try {
      if (this.state.format === 'json') {
        await exporter.exportJSON({
          includeArchived: this.state.includeArchived,
        });
      } else {
        await exporter.exportMarkdownAll({
          includeArchived: this.state.includeArchived,
        });
      }

      this.props.bus.emit('toast:show', {
        type: 'success',
        message: '导出成功，文件已保存到下载文件夹',
      });

      setTimeout(() => this.unmount(), 500);
    } catch (error) {
      this.props.bus.emit('toast:show', {
        type: 'error',
        message: `导出失败：${error.message}`,
      });
    } finally {
      this.state.isExporting = false;
      this.render();
    }
  }

  async #getArchivedCount() {
    const result = await chrome.storage.local.get({
      [STORAGE_KEYS.ARCHIVED_NOTES]: [],
    });
    return result[STORAGE_KEYS.ARCHIVED_NOTES]?.length || 0;
  }
}
```

### 4.2 Toolbar 菜单修改

在现有的 Toolbar 或笔记列表底部添加：

```javascript
// 在底部添加更多菜单按钮
const moreButton = document.createElement('button');
moreButton.className = 'btn-more';
moreButton.innerHTML = '⋮';
moreButton.onclick = () => this.#showMoreMenu(e);

// 显示菜单
#showMoreMenu(e) {
  const menu = document.createElement('div');
  menu.className = 'more-menu';
  menu.innerHTML = `
    <div data-action="export">📤 导出笔记</div>
    <div data-action="settings">⚙️ 设置</div>
  `;

  menu.querySelectorAll('[data-action]').forEach(el => {
    el.onclick = () => {
      if (el.dataset.action === 'export') {
        this.#showExportDialog();
      }
      menu.remove();
    };
  });

  document.body.appendChild(menu);
}
```

### 4.3 NoteList 右键菜单

```javascript
// 在 NoteList 组件中添加
_renderItem(note) {
  const item = document.createElement('div');
  // ... 现有代码 ...

  item.oncontextmenu = (e) => {
    e.preventDefault();
    this.#showContextMenu(e, note);
  };
}

#showContextMenu(e, note) {
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  menu.innerHTML = `
    <div data-action="export">📤 导出为 Markdown</div>
    <div class="divider"></div>
    <div data-action="delete">🗑️ 删除</div>
  `;

  menu.querySelector('[data-action="export"]').onclick = async () => {
    const exporter = ExportManager.getInstance(this.props.store);
    await exporter.exportMarkdownSingle(note.id);
    this.props.bus.emit('toast:show', {
      type: 'success',
      message: '导出成功',
    });
    menu.remove();
  };

  document.body.appendChild(menu);
}
```

---

## 五、样式设计

```css
/* 导出对话框样式 */
.export-format-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-format-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-base);
}

.export-format-option:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.export-format-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.format-icon {
  font-size: 24px;
}

.format-info {
  flex: 1;
}

.format-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.format-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.export-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  font-size: var(--font-size-sm);
}

/* 更多菜单 */
.more-menu {
  position: fixed;
  min-width: 140px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 4px 0;
  z-index: 1000;
}

.more-menu [data-action] {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.more-menu [data-action]:hover {
  background: var(--color-bg-hover);
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  min-width: 160px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 4px 0;
  z-index: 1000;
}

.context-menu .divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}
```

---

## 六、错误处理

### 6.1 错误类型定义

```javascript
/**
 * 导出错误类型
 */
export const ExportError = {
  NO_NOTES: 'NO_NOTES',
  DOWNLOAD_BLOCKED: 'DOWNLOAD_BLOCKED',
  SERIALIZATION_FAILED: 'SERIALIZATION_FAILED',
  NOTE_NOT_FOUND: 'NOTE_NOT_FOUND',
};

/**
 * 错误提示文案
 */
const ERROR_MESSAGES = {
  [ExportError.NO_NOTES]: '还没有笔记可导出',
  [ExportError.DOWNLOAD_BLOCKED]: '浏览器阻止了下载，请允许下载文件',
  [ExportError.SERIALIZATION_FAILED]: '数据格式化失败，请重试',
  [ExportError.NOTE_NOT_FOUND]: '笔记不存在或已被删除',
};
```

### 6.2 导出前检查

```javascript
/**
 * 导出前校验
 */
function validateExport(notes, format) {
  if (!notes || notes.length === 0) {
    throw new Error(ExportError.NO_NOTES);
  }

  if (format === 'markdown' && notes.length > 500) {
    // Markdown 导出数量限制
    console.warn('Large number of notes, export may take time');
  }
}
```

---

## 七、性能考虑

### 7.1 大数据量处理

| 笔记数量 | 处理方式 |
|----------|----------|
| < 100 | 直接导出，无进度提示 |
| 100 - 500 | 显示"正在导出..."，不显示进度条 |
| > 500 | 显示进度条 |

### 7.2 防抖与节流

```javascript
// 导出按钮防抖，防止重复点击
class ExportDialog extends Component {
  #isExporting = false;

  async #handleExport() {
    if (this.#isExporting) return;

    this.#isExporting = true;
    try {
      // ... 导出逻辑
    } finally {
      this.#isExporting = false;
    }
  }
}
```

---

## 八、测试策略

### 8.1 单元测试

```javascript
// 测试文件名清理
describe('sanitizeFilename', () => {
  it('removes illegal characters', () => {
    expect(sanitizeFilename('test/file:name')).toBe('test-file-name');
  });

  it('handles empty input', () => {
    expect(sanitizeFilename('')).toBe('Untitled');
  });

  it('truncates long names', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeFilename(long).length).toBe(200);
  });
});

// 测试格式化
describe('formatMarkdownSingle', () => {
  it('includes metadata', () => {
    const note = { title: 'Test', content: 'Hello', createdAt: Date.now(), updatedAt: Date.now() };
    const result = formatMarkdownSingle(note);
    expect(result).toContain('# Test');
    expect(result).toContain('> Created:');
    expect(result).toContain('Hello');
  });
});
```

### 8.2 集成测试场景

| 场景 | 验证点 |
|------|--------|
| 空笔记列表 | 对话框显示空状态 |
| 导出 JSON | 文件可下载，格式正确 |
| 导出 Markdown | 文件可下载，可读性强 |
| 特殊字符标题 | 文件名被正确清理 |
| 浏览器阻止下载 | 显示友好提示 |

---

## 九、实施计划

### Phase 1：核心功能（P0）

- [ ] ExportManager 基础实现
- [ ] JSON 导出
- [ ] Markdown 全部导出
- [ ] Markdown 单条导出
- [ ] ExportDialog UI

### Phase 2：体验完善（P1）

- [ ] 更多菜单入口
- [ ] 右键菜单入口
- [ ] 加载状态
- [ ] 错误提示

### Phase 3：细节优化（P2）

- [ ] 大数据量进度条
- [ ] 文件名清理
- [ ] 空状态处理
- [ ] 单元测试

---

## 十、API 总结

```javascript
// ExportManager 公开 API
class ExportManager {
  // 导出为 JSON
  exportJSON(options): Promise<void>

  // 导出全部为 Markdown
  exportMarkdownAll(options): Promise<void>

  // 导出单条为 Markdown
  exportMarkdownSingle(noteId): Promise<void>

  // 获取单例
  static getInstance(store): ExportManager
}

// 工具函数
formatMarkdownSingle(note): string
formatMarkdownAll(notes): string
sanitizeFilename(filename): string
```

---

## 十一、附录

### 11.1 Chrome Blob API 兼容性

| Chrome 版本 | Blob 支持 |
|-------------|-----------|
| ≥ 88 | ✅ 完全支持 |
| ≥ 80 | ✅ 支持 |
| < 80 | ⚠️ 需要降级方案 |

### 11.2 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2025-01-12 | v0.0.2 | 初始版本 |
