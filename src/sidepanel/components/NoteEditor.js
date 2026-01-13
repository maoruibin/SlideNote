/**
 * NoteEditor - 笔记编辑器组件
 * 支持 Markdown 渲染，默认预览模式
 */

import { formatRelativeTime } from '../utils/format.js';
import { t } from '../utils/i18n.js';
import { render } from '../utils/marked.js';
import { EditorMoreMenu } from './EditorMoreMenu.js';
import { SyntaxHelpModal } from './SyntaxHelpModal.js';

// 存储键名
const STORAGE_KEY = 'noteViewMode';

/**
 * 获取笔记的显示模式
 * @param {string} noteId
 * @returns {Promise<string>} 'preview' | 'edit'
 */
async function getNoteMode(noteId) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const modes = result[STORAGE_KEY] || {};
      resolve(modes[noteId] || 'preview');
    });
  });
}

/**
 * 保存笔记的显示模式
 * @param {string} noteId
 * @param {string} mode 'preview' | 'edit'
 */
function saveNoteMode(noteId, mode) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const modes = result[STORAGE_KEY] || {};
    modes[noteId] = mode;
    chrome.storage.local.set({ [STORAGE_KEY]: modes });
  });
}

export class NoteEditor {
  constructor(props = {}) {
    this.props = props;
    this.state = { note: null };
    this.el = null;
    this._titleInput = null;
    this._textarea = null;
    this._saveStatus = null;
    this._saveTimer = null;
    this._pendingChanges = null;
    this._isNewNote = false;
    this._cleanup = [];

    // Markdown 相关
    this._moreMenu = null;
    this._syntaxHelpModal = null;
    this._moreBtn = null;
    this._previewMode = true;     // 默认预览模式
    this._previewLayer = null;
    this._modeToggleBtn = null;   // 模式切换按钮引用

    this._setupListeners();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'note-content-section';

    if (!this.state.note) {
      container.innerHTML = this._renderEmpty();
      return container;
    }

    // 头部
    const header = this._renderHeader();

    // 编辑器
    const editor = this._renderEditor();

    container.append(header, editor);

    // 保存引用
    this._titleInput = header.querySelector('.note-title-input');
    this._textarea = editor.querySelector('.note-content-textarea');
    this._saveStatus = header.querySelector('.note-save-status');
    this._timeDisplay = header.querySelector('.note-time');
    this._moreBtn = header.querySelector('.btn-more');
    this._modeToggleBtn = header.querySelector('.btn-mode-toggle');

    // 监听保存完成
    const unsubscribeSave = this.props.bus?.on('save:complete', () => {
      this._showSaveStatus();
    });
    if (unsubscribeSave) this._cleanup.push(unsubscribeSave);

    // 监听语法帮助显示
    const unsubscribeHelp = this.props.bus?.on('syntax-help:show', () => {
      this._getSyntaxHelpModal().open();
    });
    if (unsubscribeHelp) this._cleanup.push(unsubscribeHelp);

    return container;
  }

  /**
   * 渲染头部
   * @private
   */
  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'note-header';

    // 标题输入区
    const titleContainer = document.createElement('div');
    titleContainer.className = 'note-title-container';

    const titleInput = document.createElement('input');
    titleInput.className = 'note-title-input';
    titleInput.value = this.state.note.title;
    titleInput.placeholder = t('unnamedNote');
    titleInput.oninput = (e) => {
      const target = /** @type {HTMLInputElement} */ (e.target);
      this._saveDebounced(this.state.note.id, { title: target.value });
    };
    titleInput.onkeydown = (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this._focusContent();
      }
    };

    // 获取当前笔记在列表中的位置
    const notes = this.props.store?.state.notes || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex >= notes.length - 1;

    // 向上箭头（上一篇）
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn-nav btn-nav-prev';
    prevBtn.ariaLabel = t('prevNote');
    prevBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 10 8 6 12 10"/>
    </svg>`;
    if (isFirst) {
      prevBtn.disabled = true;
      prevBtn.classList.add('disabled');
    }
    prevBtn.onclick = () => {
      this._navigateToPrev();
    };

    // 向下箭头（下一篇）
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-nav btn-nav-next';
    nextBtn.ariaLabel = t('nextNote');
    nextBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 6 8 10 12 6"/>
    </svg>`;
    if (isLast) {
      nextBtn.disabled = true;
      nextBtn.classList.add('disabled');
    }
    nextBtn.onclick = () => {
      this._navigateToNext();
    };

    // 模式切换按钮（预览模式显示编辑图标，编辑模式显示预览图标）
    const modeToggleBtn = document.createElement('button');
    modeToggleBtn.className = 'btn-mode-toggle';
    modeToggleBtn.ariaLabel = this._previewMode ? t('editNote') : t('previewNote');
    modeToggleBtn.innerHTML = this._previewMode ? this._getEditIcon() : this._getPreviewIcon();
    modeToggleBtn.onclick = () => {
      this._toggleMode();
    };

    // 更多按钮
    const moreBtn = document.createElement('button');
    moreBtn.className = 'btn-more';
    moreBtn.ariaLabel = 'More options';
    moreBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="3" r="1.5"/>
      <circle cx="8" cy="8" r="1.5"/>
      <circle cx="8" cy="13" r="1.5"/>
    </svg>`;
    moreBtn.onclick = () => {
      this._getMoreMenu().toggle(moreBtn);
    };

    titleContainer.append(titleInput, prevBtn, nextBtn, modeToggleBtn, moreBtn);

    // 保存导航按钮引用，用于后续更新状态
    this._prevBtn = prevBtn;
    this._nextBtn = nextBtn;

    // 元信息区
    const meta = document.createElement('div');
    meta.className = 'note-meta';

    const timeDisplay = document.createElement('span');
    timeDisplay.className = 'note-time';
    timeDisplay.textContent = formatRelativeTime(this.state.note.updatedAt);

    const saveStatus = document.createElement('span');
    saveStatus.className = 'note-save-status';
    saveStatus.innerHTML = `✓ ${t('saved')}`;

    meta.append(timeDisplay, saveStatus);
    header.append(titleContainer, meta);

    return header;
  }

  /**
   * 获取编辑图标
   * @private
   */
  _getEditIcon() {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 015 12.5V12h-.5a.5.5 0 01-.5-.5V11h-.5a.5.5 0 01-.468-.325z"/>
    </svg>`;
  }

  /**
   * 获取预览图标
   * @private
   */
  _getPreviewIcon() {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 8s2-4 7-4 7 4 7 4-2 4-7 4-7-4-7-4zm7 3a3 3 0 110-6 3 3 0 010 6zm0-1a2 2 0 100-4 2 2 0 000 4z"/>
    </svg>`;
  }

  /**
   * 渲染编辑器
   * @private
   */
  _renderEditor() {
    const editor = document.createElement('div');
    editor.className = 'note-editor markdown-editor';

    // 编辑区（contenteditable div）
    const textarea = document.createElement('div');
    textarea.className = 'note-content-textarea';
    textarea.contentEditable = 'plaintext-only';
    textarea.textContent = this.state.note.content || '';
    textarea.setAttribute('data-placeholder', t('startTyping'));
    // 根据模式决定显示
    textarea.style.display = this._previewMode ? 'none' : 'block';

    // 预览层
    const previewLayer = document.createElement('div');
    previewLayer.className = 'markdown-preview-layer';
    previewLayer.innerHTML = render(this.state.note.content || '');
    // 预览层不绑定点击事件，保持只读
    previewLayer.style.display = this._previewMode ? 'block' : 'none';

    // 输入时保存并更新预览
    textarea.addEventListener('input', () => {
      const content = textarea.textContent || '';
      this._saveDebounced(this.state.note.id, { content });
      this._updatePreview(content);
    });

    // 保存预览层引用
    this._previewLayer = previewLayer;

    // 键盘快捷键
    textarea.onkeydown = (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        /** @type {HTMLInputElement} */ (this._titleInput)?.focus();
      }
      // ESC 返回预览模式
      if (e.key === 'Escape') {
        e.preventDefault();
        this._setPreviewMode();
      }
    };

    editor.append(textarea, previewLayer);
    return editor;
  }

  /**
   * 更新预览层内容
   * @private
   * @param {string} content - Markdown 内容
   */
  _updatePreview(content) {
    if (!this._previewLayer) return;
    this._previewLayer.innerHTML = render(content);
  }

  /**
   * 切换模式
   * @private
   */
  async _toggleMode() {
    if (this._previewMode) {
      this._setEditMode();
    } else {
      this._setPreviewMode();
    }
  }

  /**
   * 切换到编辑模式
   * @private
   */
  _setEditMode() {
    if (!this._textarea || !this._previewLayer || !this._modeToggleBtn) return;
    this._previewMode = false;

    this._textarea.style.display = 'block';
    this._previewLayer.style.display = 'none';

    // 更新按钮为预览图标
    this._modeToggleBtn.innerHTML = this._getPreviewIcon();
    this._modeToggleBtn.setAttribute('aria-label', t('previewNote'));

    // 聚焦编辑器
    this._textarea.focus();

    // 保存状态
    if (this.state.note?.id) {
      saveNoteMode(this.state.note.id, 'edit');
    }
  }

  /**
   * 切换到预览模式
   * @private
   */
  _setPreviewMode() {
    if (!this._textarea || !this._previewLayer || !this._modeToggleBtn) return;
    this._previewMode = true;

    // 更新预览内容
    const content = this._textarea.textContent || '';
    this._updatePreview(content);

    this._textarea.style.display = 'none';
    this._previewLayer.style.display = 'block';

    // 更新按钮为编辑图标
    this._modeToggleBtn.innerHTML = this._getEditIcon();
    this._modeToggleBtn.setAttribute('aria-label', t('editNote'));

    // 保存状态
    if (this.state.note?.id) {
      saveNoteMode(this.state.note.id, 'preview');
    }
  }

  /**
   * 聚焦到内容编辑区
   * @private
   */
  _focusContent() {
    if (this._textarea) {
      this._textarea.focus();
    }
  }

  /**
   * 导航到上一篇笔记
   * @private
   */
  _navigateToPrev() {
    const notes = this.props.store?.state.notes || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);

    if (currentIndex > 0) {
      const prevNote = notes[currentIndex - 1];
      this.props.bus?.emit('note:select', prevNote.id);
    }

    this._updateNavButtons();
  }

  /**
   * 导航到下一篇笔记
   * @private
   */
  _navigateToNext() {
    const notes = this.props.store?.state.notes || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);

    if (currentIndex >= 0 && currentIndex < notes.length - 1) {
      const nextNote = notes[currentIndex + 1];
      this.props.bus?.emit('note:select', nextNote.id);
    }

    this._updateNavButtons();
  }

  /**
   * 更新导航按钮状态（禁用/启用）
   * @private
   */
  _updateNavButtons() {
    if (!this._prevBtn || !this._nextBtn) return;

    const notes = this.props.store?.state.notes || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex >= notes.length - 1;

    // 更新上一篇按钮
    if (isFirst) {
      this._prevBtn.disabled = true;
      this._prevBtn.classList.add('disabled');
    } else {
      this._prevBtn.disabled = false;
      this._prevBtn.classList.remove('disabled');
    }

    // 更新下一篇按钮
    if (isLast) {
      this._nextBtn.disabled = true;
      this._nextBtn.classList.add('disabled');
    } else {
      this._nextBtn.disabled = false;
      this._nextBtn.classList.remove('disabled');
    }
  }

  /**
   * 获取更多菜单实例（懒加载）
   * @private
   */
  _getMoreMenu() {
    if (!this._moreMenu) {
      this._moreMenu = new EditorMoreMenu({
        store: this.props.store,
        bus: this.props.bus,
        previewLayer: this._previewLayer,
      });
    }
    return this._moreMenu;
  }

  /**
   * 获取语法帮助弹窗实例（懒加载）
   * @private
   */
  _getSyntaxHelpModal() {
    if (!this._syntaxHelpModal) {
      this._syntaxHelpModal = new SyntaxHelpModal();
    }
    return this._syntaxHelpModal;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  /**
   * 渲染空状态
   * @private
   */
  _renderEmpty() {
    return `
      <div class="editor-empty">
        <div class="empty-icon">📄</div>
        <div class="empty-title">${t('selectOrCreate')}</div>
      </div>
    `;
  }

  /**
   * 设置事件监听
   * @private
   */
  _setupListeners() {
    // 监听笔记选择
    const unsubscribeSelect = this.props.bus?.on('note:select', async (id, options = {}) => {
      if (this.state.note?.id === id) return;

      await this._savePendingChanges();

      this._isNewNote = options.isNew || false;

      const note = this.props.store?.state.notes.find(n => n.id === id);
      this.setState({ note: note || null });

      // 新建笔记强制编辑模式，否则恢复保存的状态
      if (this._isNewNote) {
        this._previewMode = false;
      } else {
        const savedMode = await getNoteMode(id);
        this._previewMode = (savedMode === 'edit') ? false : true;
      }

      this._updateContainer();

      // 重新获取 DOM 引用（因为 _updateContainer 重新渲染了）
      if (!this.el) return;
      this._titleInput = this.el.querySelector('.note-title-input');
      this._textarea = this.el.querySelector('.note-content-textarea');
      this._previewLayer = this.el.querySelector('.markdown-preview-layer');
      this._modeToggleBtn = this.el.querySelector('.btn-mode-toggle');

      if (this._isNewNote) {
        this._focusTitleInput();
        // 直接设置编辑模式（不通过 _setEditMode，避免引用检查失败）
        if (this._textarea) {
          this._textarea.style.display = 'block';
        }
        if (this._previewLayer) {
          this._previewLayer.style.display = 'none';
        }
        if (this._modeToggleBtn) {
          this._modeToggleBtn.innerHTML = this._getPreviewIcon();
          this._modeToggleBtn.setAttribute('aria-label', t('previewNote'));
        }
      }
    });
    if (unsubscribeSelect) this._cleanup.push(unsubscribeSelect);

    // 监听笔记更新
    const unsubscribeUpdate = this.props.bus?.on('note-updated', (note) => {
      if (note.id === this.state.note?.id) {
        this.setState({ note });
        this._updateTimeDisplay();
        // 如果在预览模式，更新预览内容
        if (this._previewMode && this._previewLayer) {
          this._updatePreview(note.content || '');
        }
        // 更新导航按钮状态
        this._updateNavButtons();
      }
    });
    if (unsubscribeUpdate) this._cleanup.push(unsubscribeUpdate);

    // 监听编辑模式设置请求（用于新建笔记后自动进入编辑模式）
    const unsubscribeSetEditMode = this.props.bus?.on('editor:set-edit-mode', () => {
      // 查找 DOM 元素并设置编辑模式
      const textarea = this.el?.querySelector('.note-content-textarea');
      const previewLayer = this.el?.querySelector('.markdown-preview-layer');
      const modeToggleBtn = this.el?.querySelector('.btn-mode-toggle');

      if (textarea) {
        textarea.style.display = 'block';
      }
      if (previewLayer) {
        previewLayer.style.display = 'none';
      }
      if (modeToggleBtn) {
        modeToggleBtn.innerHTML = this._getPreviewIcon();
        modeToggleBtn.setAttribute('aria-label', t('previewNote'));
      }
      this._previewMode = false;
    });
    if (unsubscribeSetEditMode) this._cleanup.push(unsubscribeSetEditMode);
  }

  /**
   * 防抖保存（1秒延迟）
   * @private
   */
  _saveDebounced(id, changes) {
    this._pendingChanges = { ...this._pendingChanges, ...changes };

    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(async () => {
      await this.props.store?.updateNote(id, this._pendingChanges);
      this._pendingChanges = null;
      this.props.bus?.emit('save:complete');
    }, 1000);
  }

  /**
   * 立即保存未提交的变更
   * @private
   */
  async _savePendingChanges() {
    if (!this._pendingChanges || !this.state.note) return;

    clearTimeout(this._saveTimer);

    await this.props.store?.updateNote(this.state.note.id, this._pendingChanges);
    this._pendingChanges = null;
  }

  /**
   * 显示保存状态
   * @private
   */
  _showSaveStatus() {
    if (!this._saveStatus) return;
    this._saveStatus.classList.add('show');
    setTimeout(() => {
      this._saveStatus.classList.remove('show');
    }, 2000);
  }

  /**
   * 更新容器
   * @private
   */
  _updateContainer() {
    if (!this.el) return;
    const newEl = this.render();
    this.el.replaceWith(newEl);
    this.el = newEl;
  }

  /**
   * 更新时间显示
   * @private
   */
  _updateTimeDisplay() {
    if (!this.state.note || !this._timeDisplay) return;
    this._timeDisplay.textContent = formatRelativeTime(this.state.note.updatedAt);
  }

  /**
   * 聚焦到标题输入框
   * @private
   */
  _focusTitleInput() {
    setTimeout(() => {
      const input = /** @type {HTMLInputElement} */ (this._titleInput);
      if (input) {
        input.focus();
        if (input.value) {
          input.select();
        }
      }
    }, 50);
  }

  /**
   * 销毁组件
   */
  async destroy() {
    await this._savePendingChanges();
    clearTimeout(this._saveTimer);
    this._cleanup.forEach(fn => fn());
    this._moreMenu?.destroy();
    this._syntaxHelpModal?.destroy();
    this.el?.remove();
  }
}
