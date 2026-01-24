# v0.0.7 功能实现 - 技术方案

> **版本**: v0.0.7
> **日期**: 2025-01-21
> **状态**: 规划中
> **设计原则**: 简单、稳定、不过度设计

---

## 一、需求概述

本版本包含以下功能的技术实现：

| 功能 | 类型 | 优先级 |
|------|------|--------|
| 导入导出 | 新增 | P1 |
| 关于弹窗 | 新增 | P1 |
| Footer 更多菜单 | 新增 | P1 |

---

## 二、文件结构

```
src/sidepanel/
├── services/
│   ├── ExportManager.js       # 导出功能（新增）
│   └── ImportManager.js       # 导入功能（新增）
├── components/
│   ├── MoreMenu.js            # 更多菜单（新增）
│   ├── AboutModal.js          # 关于弹窗（新增）
│   ├── ExportDialog.js        # 导出对话框（新增）
│   └── app.js                 # Footer 修改
└── styles.css
    └── (新增更多菜单、弹窗样式)
```

---

## 三、功能一：Footer 更多菜单

### 3.1 设计说明

在 Footer 右侧添加「更多」按钮，点击展开菜单。

```
┌────────────────────────────┐
│  💬 意见反馈      更多 ···  │
└────────────────────────────┘
         ↓ 点击
┌───────────────┐
│ 📤 导出笔记   │
│ 📥 导入备份   │
│ ─────────────│
│ 🔗 GitHub    │
│ ℹ️  关于     │
└───────────────┘
```

### 3.2 组件实现：MoreMenu.js

```javascript
/**
 * src/sidepanel/components/MoreMenu.js
 *
 * Footer 更多菜单组件
 */
export class MoreMenu {
  #isOpen = false;
  #menuEl = null;
  #triggerEl = null;

  constructor(props = {}) {
    this.props = props;
    this.el = null;
  }

  /**
   * 渲染更多菜单（返回触发按钮）
   */
  render() {
    const container = document.createElement('div');
    container.className = 'footer-more';

    // 触发按钮
    const trigger = document.createElement('div');
    trigger.className = 'footer-more-trigger';
    trigger.innerHTML = `
      <span class="more-text">${chrome.i18n.getMessage('more')}</span>
      <div class="more-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    trigger.onclick = (e) => {
      e.stopPropagation();
      this.toggle();
    };

    this.#triggerEl = trigger;
    container.appendChild(trigger);

    // 菜单容器
    const menu = this.#createMenu();
    this.#menuEl = menu;
    container.appendChild(menu);

    this.el = container;
    return container;
  }

  /**
   * 创建菜单内容
   * @private
   */
  #createMenu() {
    const menu = document.createElement('div');
    menu.className = 'more-menu';

    const items = [
      { id: 'export', icon: '📤', label: chrome.i18n.getMessage('exportNotes'), action: () => this.#handleExport() },
      { id: 'import', icon: '📥', label: chrome.i18n.getMessage('importBackup'), action: () => this.#handleImport() },
      { divider: true },
      { id: 'github', icon: '🔗', label: 'GitHub', action: () => this.#handleGitHub() },
      { id: 'about', icon: 'ℹ️', label: chrome.i18n.getMessage('about'), action: () => this.#handleAbout() },
    ];

    items.forEach(item => {
      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'more-menu-divider';
        menu.appendChild(divider);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'more-menu-item';
        menuItem.innerHTML = `<span class="menu-icon">${item.icon}</span><span class="menu-label">${item.label}</span>`;
        menuItem.onclick = () => {
          item.action();
          this.close();
        };
        menu.appendChild(menuItem);
      }
    });

    return menu;
  }

  /**
   * 切换菜单显示状态
   */
  toggle() {
    if (this.#isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 打开菜单
   */
  open() {
    this.#isOpen = true;
    this.#menuEl.classList.add('show');
    this.#triggerEl.classList.add('active');

    // 点击外部关闭
    document.addEventListener('click', this.#handleOutsideClick);
  }

  /**
   * 关闭菜单
   */
  close() {
    this.#isOpen = false;
    this.#menuEl.classList.remove('show');
    this.#triggerEl.classList.remove('active');
    document.removeEventListener('click', this.#handleOutsideClick);
  }

  /**
   * 处理外部点击
   * @private
   */
  #handleOutsideClick = (e) => {
    if (!this.el.contains(e.target)) {
      this.close();
    }
  };

  /**
   * 导出笔记
   * @private
   */
  #handleExport() {
    this.props.bus?.emit('export:show-dialog');
  }

  /**
   * 导入备份
   * @private
   */
  #handleImport() {
    this.props.bus?.emit('import:show-dialog');
  }

  /**
   * GitHub
   * @private
   */
  #handleGitHub() {
    chrome.tabs.create({ url: 'https://github.com/maoruibin/SlideNote' });
  }

  /**
   * 关于
   * @private
   */
  #handleAbout() {
    this.props.bus?.emit('about:show');
  }
}
```

### 3.3 样式实现

```css
/* src/sidepanel/styles.css */

/* Footer 容器 */
.note-list-footer {
  padding: 10px var(--spacing-md);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-secondary);
}

/* 意见反馈链接 */
.footer-feedback {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-decoration: none;
  padding: 4px var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.footer-feedback:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.footer-feedback svg {
  width: 14px;
  height: 14px;
}

/* 更多菜单容器 */
.footer-more {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 4px var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.footer-more:hover,
.footer-more.active {
  background: var(--color-bg-hover);
}

/* 三点图标 */
.more-dots {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.more-dots span {
  width: 3px;
  height: 3px;
  background: currentColor;
  border-radius: 50%;
}

/* 更多菜单弹层 */
.more-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  min-width: 160px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all var(--duration-base);
  z-index: 100;
}

.more-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* 菜单项 */
.more-menu-item {
  padding: 10px var(--spacing-md);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background var(--duration-fast);
}

.more-menu-item:hover {
  background: var(--color-bg-hover);
}

.menu-icon {
  font-size: 14px;
}

/* 分隔线 */
.more-menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

/* 菜单箭头 */
.more-menu::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 16px;
  width: 12px;
  height: 12px;
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  transform: rotate(45deg);
}
```

### 3.4 app.js 修改

```javascript
// _renderFooter 方法修改
_renderFooter() {
  const footer = document.createElement('div');
  footer.className = 'note-list-footer';

  // 意见反馈链接
  const feedbackDiv = document.createElement('div');
  feedbackDiv.className = 'footer-feedback';
  const feedbackUrl = 'https://my.feishu.cn/share/base/form/shrcnnfhgGcaqzU3lUfrDxamVZc';
  feedbackDiv.innerHTML = `
    <a href="${feedbackUrl}" target="_blank" class="feedback-link">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
      <span>${chrome.i18n.getMessage('feedback')}</span>
    </a>
  `;

  // 更多菜单组件
  const { MoreMenu } = await import('./components/MoreMenu.js');
  this.components.moreMenu = new MoreMenu({ bus });
  const moreMenuEl = this.components.moreMenu.render();

  footer.append(feedbackDiv, moreMenuEl);
  return footer;
}
```

---

## 四、功能二：导出功能

### 4.1 设计说明

支持导出为 JSON 和 Markdown 两种格式。

### 4.2 服务实现：ExportManager.js

```javascript
/**
 * src/sidepanel/services/ExportManager.js
 *
 * 导出管理器 - 单例模式
 */
export class ExportManager {
  static #instance = null;

  constructor(store) {
    this.store = store;
  }

  /**
   * 获取单例
   */
  static getInstance(store) {
    if (!ExportManager.#instance) {
      ExportManager.#instance = new ExportManager(store);
    }
    return ExportManager.#instance;
  }

  /**
   * 导出为 JSON
   */
  async exportJSON() {
    const notes = this.store.state.notes || [];

    if (notes.length === 0) {
      this.#showToast('error', chrome.i18n.getMessage('noNotesToExport') || '没有笔记可导出');
      return;
    }

    const data = {
      _meta: {
        version: chrome.runtime.getManifest().version,
        exportedAt: new Date().toISOString(),
        exportedBy: 'SlideNote',
      },
      data: {
        notes,
        activeNoteId: this.store.state.activeNoteId,
      },
    };

    const json = JSON.stringify(data, null, 2);
    const filename = this.#getFilename('json');
    this.#download(json, filename, 'application/json');

    this.#showToast('success', chrome.i18n.getMessage('exportSuccess') || '导出成功');
  }

  /**
   * 导出为 Markdown
   */
  async exportMarkdown() {
    const notes = this.store.state.notes || [];

    if (notes.length === 0) {
      this.#showToast('error', chrome.i18n.getMessage('noNotesToExport') || '没有笔记可导出');
      return;
    }

    const date = new Date().toLocaleDateString('zh-CN');
    let content = `# SlideNote Notes\n\n> 导出时间：${date}\n> 笔记数量：${notes.length}\n\n---\n\n`;

    for (const note of notes) {
      const title = note.title || chrome.i18n.getMessage('unnamedNote');
      const created = new Date(note.createdAt).toLocaleDateString('zh-CN');

      content += `## ${title}\n\n> ${chrome.i18n.getMessage('lastEdited')}：${created}\n\n${note.content || ''}\n\n---\n\n`;
    }

    const filename = this.#getFilename('md');
    this.#download(content, filename, 'text/markdown');

    this.#showToast('success', chrome.i18n.getMessage('exportSuccess') || '导出成功');
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

  /**
   * 显示提示
   * @private
   */
  #showToast(type, message) {
    // 通过 EventBus 发送 toast 事件
    if (this.store.bus) {
      this.store.bus.emit('toast:show', { type, message });
    }
  }
}
```

### 4.3 导出对话框：ExportDialog.js

```javascript
/**
 * src/sidepanel/components/ExportDialog.js
 *
 * 导出格式选择对话框
 */
export class ExportDialog {
  #overlay = null;
  #dialog = null;
  #selectedFormat = 'json';

  constructor(props = {}) {
    this.props = props;
    this.el = null;
  }

  /**
   * 显示对话框
   */
  show() {
    this.#render();
    document.body.appendChild(this.el);

    // 绑定事件
    this.#bindEvents();

    // 进入动画
    requestAnimationFrame(() => {
      this.#overlay.classList.add('show');
    });
  }

  /**
   * 渲染对话框
   * @private
   */
  #render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'export-dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <span class="dialog-title">${chrome.i18n.getMessage('exportNotes') || '导出笔记'}</span>
        <button class="dialog-close" data-action="close">×</button>
      </div>

      <div class="dialog-body">
        <div class="export-formats">
          <div class="format-option ${this.#selectedFormat === 'json' ? 'selected' : ''}"
               data-format="json" data-action="select-format">
            <div class="format-icon">📦</div>
            <div class="format-info">
              <div class="format-name">JSON</div>
              <div class="format-desc">${chrome.i18n.getMessage('formatJSONDesc') || '完整备份，包含元数据'}</div>
            </div>
          </div>

          <div class="format-option ${this.#selectedFormat === 'markdown' ? 'selected' : ''}"
               data-format="markdown" data-action="select-format">
            <div class="format-icon">📝</div>
            <div class="format-info">
              <div class="format-name">Markdown</div>
              <div class="format-desc">${chrome.i18n.getMessage('formatMDDesc') || '可读性强，适合查看'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" data-action="close">
          ${chrome.i18n.getMessage('cancel') || '取消'}
        </button>
        <button class="btn btn-primary" data-action="export">
          ${chrome.i18n.getMessage('export') || '导出'}
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    this.#overlay = overlay;
    this.#dialog = dialog;
    this.el = overlay;
  }

  /**
   * 绑定事件
   * @private
   */
  #bindEvents() {
    // 点击关闭
    this.#dialog.querySelector('[data-action="close"]')?.addEventListener('click', () => this.hide());

    // 点击遮罩关闭
    this.#overlay.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.hide();
    });

    // 选择格式
    this.#dialog.querySelectorAll('[data-action="select-format"]').forEach(el => {
      el.addEventListener('click', () => {
        this.#selectedFormat = el.dataset.format;
        this.#updateSelection();
      });
    });

    // 确认导出
    this.#dialog.querySelector('[data-action="export"]')?.addEventListener('click', () => {
      this.#doExport();
    });

    // ESC 关闭
    this.#handleEscape = (e) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.#handleEscape);
  }

  /**
   * 更新格式选择状态
   * @private
   */
  #updateSelection() {
    this.#dialog.querySelectorAll('.format-option').forEach(el => {
      if (el.dataset.format === this.#selectedFormat) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  /**
   * 执行导出
   * @private
   */
  async #doExport() {
    const { ExportManager } = await import('./../services/ExportManager.js');
    const exporter = ExportManager.getInstance(this.props.store);

    try {
      if (this.#selectedFormat === 'json') {
        await exporter.exportJSON();
      } else {
        await exporter.exportMarkdown();
      }
      this.hide();
    } catch (error) {
      console.error('Export failed:', error);
      this.#showError(error.message);
    }
  }

  /**
   * 隐藏对话框
   */
  hide() {
    this.#overlay.classList.remove('show');
    document.removeEventListener('keydown', this.#handleEscape);

    setTimeout(() => {
      this.el?.remove();
    }, 200);
  }

  /**
   * 显示错误
   * @private
   */
  #showError(message) {
    alert(`导出失败：${message}`);
  }
}
```

### 4.4 导出样式

```css
/* 导出对话框 */
.export-dialog {
  width: 360px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.export-formats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
}

.format-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.format-option:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.format-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.format-icon {
  font-size: 24px;
}

.format-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.format-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
```

---

## 五、功能三：导入功能

### 5.1 服务实现：ImportManager.js

```javascript
/**
 * src/sidepanel/services/ImportManager.js
 *
 * 导入管理器 - 单例模式
 */
export class ImportManager {
  static #instance = null;

  constructor(store) {
    this.store = store;
  }

  /**
   * 获取单例
   */
  static getInstance(store) {
    if (!ImportManager.#instance) {
      ImportManager.#instance = new ImportManager(store);
    }
    return ImportManager.#instance;
  }

  /**
   * 从文件导入
   */
  async importFromFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证格式
      if (!this.#validateFormat(data)) {
        throw new Error('无效的备份文件格式');
      }

      // 执行导入
      const importedCount = await this.#doImport(data);

      return { success: true, count: importedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 验证文件格式
   * @private
   */
  #validateFormat(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data._meta || !data.data) return false;
    if (!Array.isArray(data.data.notes)) return false;
    return true;
  }

  /**
   * 执行导入（合并模式）
   * @private
   */
  async #doImport(data) {
    const existingNotes = this.store.state.notes || [];
    const existingIds = new Set(existingNotes.map(n => n.id));
    const newNotes = data.data.notes.filter(n => !existingIds.has(n.id));

    if (newNotes.length === 0) {
      this.#showToast('info', chrome.i18n.getMessage('noNewNotesToImport') || '没有新笔记需要导入');
      return 0;
    }

    // 添加新笔记
    for (const note of newNotes) {
      await this.store.createNote(note);
    }

    this.#showToast('success', (chrome.i18n.getMessage('importSuccess') || '导入了 $1$ 条笔记').replace('$1$', newNotes.length));
    return newNotes.length;
  }

  /**
   * 显示提示
   * @private
   */
  #showToast(type, message) {
    if (this.store.bus) {
      this.store.bus.emit('toast:show', { type, message });
    }
  }
}
```

### 5.2 导入对话框

```javascript
/**
 * 导入对话框组件
 */
export class ImportDialog {
  #overlay = null;
  #dialog = null;
  #fileInput = null;

  constructor(props = {}) {
    this.props = props;
    this.el = null;
  }

  /**
   * 显示对话框
   */
  show() {
    this.#render();
    document.body.appendChild(this.el);

    this.#bindEvents();

    requestAnimationFrame(() => {
      this.#overlay.classList.add('show');
    });
  }

  /**
   * 渲染对话框
   * @private
   */
  #render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'import-dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <span class="dialog-title">${chrome.i18n.getMessage('importBackup') || '导入备份'}</span>
        <button class="dialog-close" data-action="close">×</button>
      </div>

      <div class="dialog-body">
        <div class="import-area" data-action="select-file">
          <div class="import-icon">📁</div>
          <div class="import-text">
            <div class="import-title">${chrome.i18n.getMessage('selectFile') || '选择备份文件'}</div>
            <div class="import-desc">.json 格式</div>
          </div>
        </div>
        <input type="file" accept=".json" class="file-input" style="display:none">

        <p class="import-tip">${chrome.i18n.getMessage('importTip') || '导入前请先导出当前备份'}</p>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" data-action="close">
          ${chrome.i18n.getMessage('cancel') || '取消'}
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    this.#overlay = overlay;
    this.#dialog = dialog;
    this.#fileInput = dialog.querySelector('.file-input');
    this.el = overlay;
  }

  /**
   * 绑定事件
   * @private
   */
  #bindEvents() {
    // 关闭按钮
    this.#dialog.querySelector('[data-action="close"]')?.addEventListener('click', () => this.hide());

    // 点击选择文件
    this.#dialog.querySelector('[data-action="select-file"]')?.addEventListener('click', () => {
      this.#fileInput.click();
    });

    // 文件选择
    this.#fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.#doImport(e.target.files[0]);
      }
    });

    // 拖拽支持
    const dropArea = this.#dialog.querySelector('.import-area');
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('drag-over');
    });
    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('drag-over');
    });
    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.json')) {
        this.#doImport(file);
      }
    });
  }

  /**
   * 执行导入
   * @private
   */
  async #doImport(file) {
    const { ImportManager } = await import('./../services/ImportManager.js');
    const importer = ImportManager.getInstance(this.props.store);

    const result = await importer.importFromFile(file);

    if (result.success) {
      this.hide();
      // 刷新笔记列表
      this.props.bus?.emit('notes:refresh');
    } else {
      alert((chrome.i18n.getMessage('importFailed') || '导入失败') + ': ' + result.error);
    }
  }

  /**
   * 隐藏对话框
   */
  hide() {
    this.#overlay.classList.remove('show');
    setTimeout(() => {
      this.el?.remove();
    }, 200);
  }
}
```

### 5.3 导入样式

```css
/* 导入对话框 */
.import-dialog {
  width: 360px;
}

.import-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.import-area:hover,
.import-area.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.import-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
}

.import-title {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.import-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.import-tip {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-align: center;
  margin-top: var(--spacing-md);
}
```

---

## 六、功能四：关于弹窗

### 6.1 组件实现：AboutModal.js

```javascript
/**
 * src/sidepanel/components/AboutModal.js
 *
 * 关于弹窗组件
 */
export class AboutModal {
  #overlay = null;
  #modal = null;

  constructor(props = {}) {
    this.props = props;
    this.el = null;
  }

  /**
   * 显示弹窗
   */
  show() {
    this.#render();
    document.body.appendChild(this.el);
    this.#bindEvents();

    requestAnimationFrame(() => {
      this.#overlay.classList.add('show');
    });
  }

  /**
   * 渲染弹窗
   * @private
   */
  #render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'about-modal';

    const version = chrome.runtime.getManifest().version;

    modal.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">${chrome.i18n.getMessage('aboutTitle') || '关于 SlideNote'}</span>
        <button class="modal-close" data-action="close">×</button>
      </div>

      <div class="modal-body">
        <!-- Logo 区域 -->
        <div class="about-logo">
          <div class="about-icon">📝</div>
          <div class="about-name">SlideNote</div>
          <div class="about-tagline">${chrome.i18n.getMessage('tagline') || '侧边笔记，常伴左右'}</div>
        </div>

        <!-- 版本信息 -->
        <div class="about-info">
          <div class="about-info-item">
            <span>📦</span>
            <span>v${version}</span>
          </div>
          <div class="about-info-item">
            <span>👨‍💻</span>
            <span>${chrome.i18n.getMessage('author') || '咕咚同学'}</span>
          </div>
        </div>

        <!-- 社交链接 -->
        <div class="about-section">
          <div class="section-title">${chrome.i18n.getMessage('socialLinks') || '社交链接'}</div>
          <div class="social-links">
            ${this.#renderSocialLink('https://github.com/maoruibin/SlideNote', 'GitHub', '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>')}
            ${this.#renderSocialLink('https://x.com/dxgudong', 'X', '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>')}
            ${this.#renderSocialLink('#', '即刻', '<text x="50%" y="55%" text-anchor="middle" dy=".3em" font-size="14">📱</text>')}
            ${this.#renderSocialLink('#', '小红书', '<text x="50%" y="55%" text-anchor="middle" dy=".3em" font-size="14">📕</text>')}
            ${this.#renderSocialLink('#', '微信', '<text x="50%" y="55%" text-anchor="middle" dy=".3em" font-size="14">💬</text>')}
          </div>
        </div>

        <!-- 更多 -->
        <div class="about-section">
          <div class="section-title">${chrome.i18n.getMessage('more') || '更多'}</div>
          <div class="about-links">
            ${this.#renderLink('https://my.feishu.cn/share/base/form/shrcnnfhgGcaqzU3lUfrDxamVZc',
              '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
              chrome.i18n.getMessage('feedback') || '意见反馈')}
            ${this.#renderLink('#',
              '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
              chrome.i18n.getMessage('changelog') || '查看更新日志')}
          </div>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    this.#overlay = overlay;
    this.#modal = modal;
    this.el = overlay;
  }

  /**
   * 渲染社交链接
   * @private
   */
  #renderSocialLink(href, title, svgContent) {
    return `
      <a href="${href}" target="_blank" class="social-link" title="${title}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          ${svgContent}
        </svg>
      </a>
    `;
  }

  /**
   * 渲染链接按钮
   * @private
   */
  #renderLink(href, svgContent, text) {
    return `
      <a href="${href}" ${href.startsWith('#') ? '' : 'target="_blank"'} class="about-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${svgContent}
        </svg>
        <span>${text}</span>
      </a>
    `;
  }

  /**
   * 绑定事件
   * @private
   */
  #bindEvents() {
    // 关闭按钮
    this.#modal.querySelector('[data-action="close"]')?.addEventListener('click', () => this.hide());

    // 点击遮罩关闭
    this.#overlay.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.hide();
    });

    // ESC 关闭
    this.#handleEscape = (e) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.#handleEscape);
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.#overlay.classList.remove('show');
    document.removeEventListener('keydown', this.#handleEscape);

    setTimeout(() => {
      this.el?.remove();
    }, 200);
  }
}
```

### 6.2 关于弹窗样式

```css
/* 通用弹窗样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity var(--duration-base);
}

.modal-overlay.show {
  display: flex;
  opacity: 1;
}

.about-modal {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 380px;
  max-width: 90vw;
  box-shadow: var(--shadow-xl);
  transform: scale(0.95);
  transition: transform var(--duration-base);
}

.modal-overlay.show .about-modal {
  transform: scale(1);
}

/* Header */
.modal-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 18px;
  transition: background var(--duration-fast);
}

.modal-close:hover {
  background: var(--color-bg-hover);
}

/* Body */
.modal-body {
  padding: var(--spacing-xl);
}

/* Logo 区域 */
.about-logo {
  text-align: center;
  padding: 20px 0 24px;
}

.about-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.about-name {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.about-tagline {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

/* 版本信息 */
.about-info {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: var(--spacing-lg);
}

.about-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

/* Section */
.about-section {
  margin-top: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.about-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-lg) 0;
}

/* 社交链接 */
.social-links {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.social-link {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all var(--duration-fast);
}

.social-link:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.social-link svg {
  width: 18px;
  height: 18px;
}

/* 链接按钮 */
.about-links {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.about-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--duration-fast);
}

.about-link:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.about-link svg {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
}

/* Footer */
.modal-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}
```

---

## 七、全局事件总线注册

### 7.1 app.js 事件监听

```javascript
// 在 _setupGlobalListeners 方法中添加

// 导出功能
bus.on('export:show-dialog', () => {
  if (!this.components.exportDialog) {
    const { ExportDialog } = await import('./components/ExportDialog.js');
    this.components.exportDialog = new ExportDialog({ store: this.store, bus });
  }
  this.components.exportDialog.show();
});

// 导入功能
bus.on('import:show-dialog', () => {
  if (!this.components.importDialog) {
    const { ImportDialog } = await import('./components/ImportDialog.js');
    this.components.importDialog = new ImportDialog({ store: this.store, bus });
  }
  this.components.importDialog.show();
});

// 关于弹窗
bus.on('about:show', () => {
  if (!this.components.aboutModal) {
    const { AboutModal } = await import('./components/AboutModal.js');
    this.components.aboutModal = new AboutModal({ store: this.store, bus });
  }
  this.components.aboutModal.show();
});
```

---

## 八、国际化文案

### 8.1 中文（zh_CN.dev）

```json
{
  "more": {
    "message": "更多"
  },
  "exportNotes": {
    "message": "导出笔记"
  },
  "importBackup": {
    "message": "导入备份"
  },
  "export": {
    "message": "导出"
  },
  "formatJSONDesc": {
    "message": "完整备份，包含元数据"
  },
  "formatMDDesc": {
    "message": "可读性强，适合查看"
  },
  "selectFile": {
    "message": "选择备份文件"
  },
  "importTip": {
    "message": "导入前请先导出当前备份"
  },
  "importSuccess": {
    "message": "已导入 $1$ 条笔记"
  },
  "importFailed": {
    "message": "导入失败"
  },
  "noNotesToExport": {
    "message": "还没有笔记可导出"
  },
  "exportSuccess": {
    "message": "导出成功，文件已保存到下载文件夹"
  },
  "aboutTitle": {
    "message": "关于 SlideNote"
  },
  "socialLinks": {
    "message": "社交链接"
  },
  "changelog": {
    "message": "查看更新日志"
  }
}
```

### 8.2 英文（en.dev）

```json
{
  "more": {
    "message": "More"
  },
  "exportNotes": {
    "message": "Export Notes"
  },
  "importBackup": {
    "message": "Import Backup"
  },
  "export": {
    "message": "Export"
  },
  "formatJSONDesc": {
    "message": "Full backup with metadata"
  },
  "formatMDDesc": {
    "message": "Readable, suitable for viewing"
  },
  "selectFile": {
    "message": "Select backup file"
  },
  "importTip": {
    "message": "Please export current backup before importing"
  },
  "importSuccess": {
    "message": "Imported $1$ notes"
  },
  "importFailed": {
    "message": "Import failed"
  },
  "noNotesToExport": {
    "message": "No notes to export"
  },
  "exportSuccess": {
    "message": "Export successful, file saved to Downloads"
  },
  "aboutTitle": {
    "message": "About SlideNote"
  },
  "socialLinks": {
    "message": "Social Links"
  },
  "changelog": {
    "message": "View Changelog"
  }
}
```

---

## 九、实施计划

| 步骤 | 任务 | 文件 | 预估时间 |
|------|------|------|----------|
| 1 | 创建 ExportManager.js | services/ | 30min |
| 2 | 创建 ImportManager.js | services/ | 30min |
| 3 | 创建 MoreMenu.js | components/ | 20min |
| 4 | 创建 ExportDialog.js | components/ | 30min |
| 5 | 创建 ImportDialog.js | components/ | 30min |
| 6 | 创建 AboutModal.js | components/ | 30min |
| 7 | 修改 app.js Footer | components/app.js | 20min |
| 8 | 添加样式 | styles.css | 40min |
| 9 | 添加 i18n 文案 | _locales/ | 15min |
| 10 | 测试与调试 | - | 30min |

**总计**: 约 4 小时

---

## 十、注意事项

### 10.1 简化设计

- 不实现复杂的进度条
- 不实现合并/覆盖模式选择（默认合并）
- 不实现大数据量特殊处理
- 复用现有 EventBus 和 Store

### 10.2 稳定性考虑

- 所有新组件延迟加载（动态 import）
- 单例模式确保唯一实例
- 错误处理使用 try-catch
- 文件格式验证防止导入失败

### 10.3 兼容性

- 不修改现有 Store API
- 不影响现有功能
- 新增功能独立，可单独测试

---

> **设计原则**: 简单、稳定、不过度设计
