/**
 * NoteEditor - 笔记编辑器组件
 * 支持 Markdown 渲染，全局模式，默认编辑模式
 */

import { formatRelativeTime } from '../utils/format.js';
import { t } from '../utils/i18n.js';
import { render } from '../utils/marked.js';
import { EditorMoreMenu } from './EditorMoreMenu.js';
import { SyntaxHelpModal } from './SyntaxHelpModal.js';

// 存储键名（全局模式）
const STORAGE_KEY = 'globalViewMode';

/**
 * 获取全局显示模式
 * @returns {Promise<string>} 'preview' | 'edit'
 */
async function getGlobalMode() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || 'edit');
    });
  });
}

/**
 * 保存全局显示模式
 * @param {string} mode 'preview' | 'edit'
 */
function saveGlobalMode(mode) {
  chrome.storage.local.set({ [STORAGE_KEY]: mode });
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
    this._previewMode = false;    // 默认编辑模式
    this._previewLayer = null;

    // 侧边滑动抽屉状态
    this._isDrawerOpen = props.initialListOpen !== undefined ? props.initialListOpen : false;

    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        if (this._isDrawerOpen) {
          this._closeListDrawer();
        }
      }
    };
    document.addEventListener('keydown', this._escHandler);

    // 侧边栏尺寸变化时重新对齐浮动面板
    this._resizeHandler = () => {
      if (this._isDrawerOpen) {
        this._syncPopoverPosition();
      }
    };
    window.addEventListener('resize', this._resizeHandler);

    this._setupListeners();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'note-editor-wrapper';

    // 顶部统一栏 (常驻)
    const header = this._renderHeader();

    // 中间主要内容区域：编辑器或欢迎视图
    let editorEl;
    if (!this.state.note) {
      editorEl = document.createElement('div');
      editorEl.className = 'note-editor';
      editorEl.innerHTML = this._renderEmpty();
      this._bindEmptyActions(editorEl);
    } else {
      editorEl = this._renderEditor();
    }

    container.append(header, editorEl);

    // 创建浮动笔记面板（含半透明遮罩，点击外部关闭）
    const backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    if (this._isDrawerOpen) {
      backdrop.classList.add('show');
    }
    backdrop.onclick = (e) => {
      e.stopPropagation();
      this._closeListDrawer();
    };

    // 浮动面板：锚定在顶部栏下方
    const drawer = document.createElement('div');
    drawer.className = 'list-popover';
    if (this._isDrawerOpen) {
      drawer.classList.add('open');
    }

    // 将笔记列表挂载至面板（优先展示）
    if (this.props.noteList) {
      const listEl = this.props.noteList.render();
      this.props.noteList.el = listEl;
      drawer.appendChild(listEl);
      this.props.noteList._bindItemEvents(listEl);
      this.props.noteList.initialize();
    }

    // 存储容量条放面板底部（弱化展示，点击仍可看详情）
    if (this.props.storageBar) {
      const storageEl = this.props.storageBar.render();
      this.props.storageBar.el = storageEl;
      drawer.appendChild(storageEl);
    }

    container.append(backdrop, drawer);

    // 保存 DOM 引用
    this._drawerEl = drawer;
    this._backdropEl = backdrop;
    this._headerEl = header;

    // 已打开状态下重渲染，需要重新对齐面板位置
    if (this._isDrawerOpen) {
      this._syncPopoverPosition();
    }

    if (this.state.note) {
      this._titleInput = header.querySelector('.note-title-input');
      this._textarea = editorEl.querySelector('.note-content-textarea');
      this._saveStatus = header.querySelector('.note-save-status');
      this._timeDisplay = header.querySelector('.note-time');
      this._prevBtn = /** @type {HTMLButtonElement} */ (header.querySelector('.btn-nav-prev'));
      this._nextBtn = /** @type {HTMLButtonElement} */ (header.querySelector('.btn-nav-next'));
    }

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

    this.el = container;
    return container;
  }

  /**
   * 切换抽屉状态
   * @private
   */
  _toggleListDrawer() {
    if (this._isDrawerOpen) {
      this._closeListDrawer();
    } else {
      this._openListDrawer();
    }
  }

  /**
   * 同步浮动面板位置（锚定在顶部栏下方）
   * @private
   */
  _syncPopoverPosition() {
    if (!this._drawerEl || !this._headerEl) return;
    // 首次渲染时元素尚未挂载，等进入文档后再计算
    if (!this._headerEl.isConnected) {
      requestAnimationFrame(() => this._syncPopoverPosition());
      return;
    }
    this._drawerEl.style.top = `${this._headerEl.offsetHeight + 6}px`;
  }

  /**
   * 打开浮动笔记面板
   * @private
   */
  _openListDrawer() {
    this._isDrawerOpen = true;
    this._syncPopoverPosition();
    if (this._drawerEl) {
      this._drawerEl.classList.add('open');
    }
    if (this._backdropEl) {
      this._backdropEl.classList.add('show');
    }
  }

  /**
   * 关闭滑动抽屉
   * @private
   */
  _closeListDrawer() {
    this._isDrawerOpen = false;
    if (this._drawerEl) {
      this._drawerEl.classList.remove('open');
    }
    if (this._backdropEl) {
      this._backdropEl.classList.remove('show');
    }
  }

  /**
   * 渲染统一头部
   * @private
   */
  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'app-header note-header';

    // 左侧：抽屉触发按钮
    const leftActions = document.createElement('div');
    leftActions.className = 'header-left-actions';

    // 列表切换按钮 (分类)
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-list-toggle';
    toggleBtn.title = t('toggleList') || '分类';
    toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="2.5" y1="12.5" x2="13.5" y2="12.5"></line>
      <line x1="2.5" y1="8" x2="13.5" y2="8"></line>
      <line x1="2.5" y1="3.5" x2="13.5" y2="3.5"></line>
    </svg>`;
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      this._toggleListDrawer();
    };
    leftActions.appendChild(toggleBtn);

    header.appendChild(leftActions);

    // 中间：品牌标题 / 笔记标题输入
    const centerArea = document.createElement('div');
    centerArea.className = 'header-center-area';

    // 品牌标题或笔记标题
    if (!this.state.note) {
      const appTitle = document.createElement('span');
      appTitle.className = 'app-header-title';
      appTitle.textContent = 'SlideNote';
      centerArea.appendChild(appTitle);
    } else {
      const titleInput = document.createElement('input');
      titleInput.className = 'note-title-input';
      titleInput.value = this.state.note.title;
      titleInput.placeholder = t('unnamedNote') || '未命名笔记';
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
      centerArea.appendChild(titleInput);
    }

    header.appendChild(centerArea);

    // 右侧操作组：新建 (常驻) + 笔记导航 / 编辑预览 / 更多 (仅在有笔记时展示)
    const rightActions = document.createElement('div');
    rightActions.className = 'header-right-actions';

    // 新建笔记按钮 (常驻)
    const newNoteBtn = document.createElement('button');
    newNoteBtn.className = 'btn-new-note-header';
    newNoteBtn.title = t('newNote') || '新建笔记';
    newNoteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>`;
    newNoteBtn.onclick = () => {
      this.props.bus?.emit('note:create');
    };
    rightActions.appendChild(newNoteBtn);

    if (this.state.note) {
      // 导航：上一篇 / 下一篇
      const notes = this.props.store?.getSortedNotes() || [];
      const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);
      const isFirst = currentIndex <= 0;
      const isLast = currentIndex >= notes.length - 1;

      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn-nav btn-nav-prev';
      prevBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4 10 8 6 12 10"/>
      </svg>`;
      if (isFirst) {
        prevBtn.disabled = true;
        prevBtn.classList.add('disabled');
      }
      prevBtn.onclick = () => this._navigateToPrev();

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn-nav btn-nav-next';
      nextBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4 6 8 10 12 6"/>
      </svg>`;
      if (isLast) {
        nextBtn.disabled = true;
        nextBtn.classList.add('disabled');
      }
      nextBtn.onclick = () => this._navigateToNext();

      rightActions.append(prevBtn, nextBtn);

      this._prevBtn = prevBtn;
      this._nextBtn = nextBtn;
      this._updateNavTips();
    }

    // 更多菜单（常驻：笔记操作 + 导入导出/反馈/关于）
    const moreBtn = document.createElement('button');
    moreBtn.className = 'btn-more';
    moreBtn.title = t('more') || '更多';
    moreBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="3" r="1.5"/>
      <circle cx="8" cy="8" r="1.5"/>
      <circle cx="8" cy="13" r="1.5"/>
    </svg>`;
    moreBtn.onclick = () => {
      this._getMoreMenu().toggle(moreBtn);
    };
    rightActions.appendChild(moreBtn);
    this._moreBtn = moreBtn;

    header.appendChild(rightActions);

    // 有活动笔记时，在顶部栏下方渲染修改时间和保存状态
    if (this.state.note) {
      const meta = document.createElement('div');
      meta.className = 'note-meta';

      const timeDisplay = document.createElement('span');
      timeDisplay.className = 'note-time';
      timeDisplay.textContent = formatRelativeTime(this.state.note.updatedAt);

      const saveStatus = document.createElement('span');
      saveStatus.className = 'note-save-status';
      saveStatus.innerHTML = `✓ ${t('saved') || '已保存'}`;

      meta.append(timeDisplay, saveStatus);
      header.appendChild(meta);

      this._timeDisplay = timeDisplay;
      this._saveStatus = saveStatus;
    }

    return header;
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
    textarea.setAttribute('data-placeholder', t('startTyping') || '开始输入...');
    textarea.style.display = this._previewMode ? 'none' : 'block';

    // 预览层
    const previewLayer = document.createElement('div');
    previewLayer.className = 'markdown-preview-layer';
    previewLayer.innerHTML = render(this.state.note.content || '');
    previewLayer.style.display = this._previewMode ? 'block' : 'none';

    // 双击预览区进入编辑模式
    previewLayer.addEventListener('dblclick', () => {
      if (this._previewMode) {
        this._setEditMode();
      }
    });

    // 输入时保存并更新预览
    textarea.addEventListener('input', () => {
      const content = textarea.textContent || '';
      this._saveDebounced(this.state.note.id, { content });
      this._updatePreview(content);
    });

    this._previewLayer = previewLayer;

    // 键盘快捷键
    textarea.onkeydown = (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        /** @type {HTMLInputElement} */ (this._titleInput)?.focus();
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
  /**
   * 切换到编辑模式
   * @private
   * @param {boolean} [focus=true] 是否聚焦编辑区
   */
  _setEditMode(focus = true) {
    if (!this._textarea || !this._previewLayer) return;
    this._previewMode = false;

    this._textarea.style.display = 'block';
    this._previewLayer.style.display = 'none';

    if (focus) {
      this._textarea.focus();
    }
    saveGlobalMode('edit');
  }

  /**
   * 切换到预览模式
   * @private
   */
  _setPreviewMode() {
    if (!this._textarea || !this._previewLayer) return;
    this._previewMode = true;

    const content = this._textarea.textContent || '';
    this._updatePreview(content);

    this._textarea.style.display = 'none';
    this._previewLayer.style.display = 'block';

    saveGlobalMode('preview');
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
    const notes = this.props.store?.getSortedNotes() || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);

    if (currentIndex > 0) {
      const prevNote = notes[currentIndex - 1];
      // 与列表点击路径对齐：先持久化选中，再通知界面切换
      this.props.store?.setActiveNote(prevNote.id);
      this.props.bus?.emit('note:select', prevNote.id);
    }
  }

  /**
   * 导航到下一篇笔记
   * @private
   */
  _navigateToNext() {
    const notes = this.props.store?.getSortedNotes() || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);

    if (currentIndex >= 0 && currentIndex < notes.length - 1) {
      const nextNote = notes[currentIndex + 1];
      // 与列表点击路径对齐：先持久化选中，再通知界面切换
      this.props.store?.setActiveNote(nextNote.id);
      this.props.bus?.emit('note:select', nextNote.id);
    }
  }

  /**
   * 获取相邻笔记（上一篇 / 下一篇）
   * @private
   * @returns {{prev: Object|null, next: Object|null}}
   */
  _getAdjacentNotes() {
    const notes = this.props.store?.getSortedNotes() || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);
    return {
      prev: currentIndex > 0 ? notes[currentIndex - 1] : null,
      next: (currentIndex >= 0 && currentIndex < notes.length - 1) ? notes[currentIndex + 1] : null,
    };
  }

  /**
   * 更新导航按钮的悬浮提示（显示相邻笔记标题）
   * @private
   */
  _updateNavTips() {
    if (!this._prevBtn || !this._nextBtn) return;

    const { prev, next } = this._getAdjacentNotes();
    this._setNavTip(this._prevBtn, t('prevNote') || '上一篇', prev, t('firstNoteReached') || '已经是第一篇了');
    this._setNavTip(this._nextBtn, t('nextNote') || '下一篇', next, t('lastNoteReached') || '已经是最后一篇了');
  }

  /**
   * 设置单个导航按钮的提示文案
   * @private
   * @param {HTMLButtonElement} btn
   * @param {string} label 方向前缀（上一篇 / 下一篇）
   * @param {Object|null} note 相邻笔记，null 表示已到边界
   * @param {string} emptyText 到达边界时的提示
   */
  _setNavTip(btn, label, note, emptyText) {
    const title = note ? (note.title?.trim() || t('unnamedNote') || '未命名笔记') : null;
    btn.dataset.tip = title ? `${label} · ${title}` : emptyText;
    btn.setAttribute('aria-label', title ? `${label}：${title}` : emptyText);
  }

  /**
   * 更新导航按钮状态（禁用/启用）
   * @private
   */
  _updateNavButtons() {
    if (!this._prevBtn || !this._nextBtn) return;

    const notes = this.props.store?.getSortedNotes() || [];
    const currentIndex = notes.findIndex(n => n.id === this.state.note?.id);
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex >= notes.length - 1;

    if (isFirst) {
      this._prevBtn.disabled = true;
      this._prevBtn.classList.add('disabled');
    } else {
      this._prevBtn.disabled = false;
      this._prevBtn.classList.remove('disabled');
    }

    if (isLast) {
      this._nextBtn.disabled = true;
      this._nextBtn.classList.add('disabled');
    } else {
      this._nextBtn.disabled = false;
      this._nextBtn.classList.remove('disabled');
    }

    this._updateNavTips();
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
        // 动态读取当前模式，用于刷新菜单里 "预览/编辑" 项的文案
        isPreviewMode: () => this._previewMode,
      });
    }
    // 重渲染后 previewLayer 引用会更新，每次打开菜单前刷新
    this._moreMenu.props.previewLayer = this._previewLayer;
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
        <div class="empty-title">${t('selectOrCreate') || '选择或创建一条笔记'}</div>
        <div class="empty-actions">
          <button class="empty-btn btn-primary js-empty-create">${t('newNote') || '新建笔记'}</button>
          <button class="empty-btn btn-secondary js-empty-select">${t('selectNote') || '选择笔记'}</button>
        </div>
      </div>
    `;
  }

  /**
   * 绑定空状态下按钮的点击事件
   * @private
   * @param {HTMLElement} editorEl
   */
  _bindEmptyActions(editorEl) {
    const createBtn = editorEl.querySelector('.js-empty-create');
    if (createBtn) {
      createBtn.onclick = () => {
        this.props.bus?.emit('note:create');
      };
    }
    const selectBtn = editorEl.querySelector('.js-empty-select');
    if (selectBtn) {
      selectBtn.onclick = () => {
        this._openListDrawer();
      };
    }
  }

  /**
   * 设置事件监听
   * @private
   */
  _setupListeners() {
    // 监听笔记选择
    const unsubscribeSelect = this.props.bus?.on('note:select', async (id, options = {}) => {
      this._closeListDrawer();

      if (this.state.note?.id === id) return;

      await this._savePendingChanges();

      this._isNewNote = options.isNew || false;

      const note = this.props.store?.state.notes.find(n => n.id === id);
      this.setState({ note: note || null });

      const globalMode = await getGlobalMode();
      this._previewMode = (globalMode === 'edit') ? false : true;

      this._updateContainer();

      if (!this.el) return;
      this._titleInput = this.el.querySelector('.note-title-input');
      this._textarea = this.el.querySelector('.note-content-textarea');
      this._previewLayer = this.el.querySelector('.markdown-preview-layer');

      if (this._isNewNote) {
        this._focusTitleInput();
      }
    });
    if (unsubscribeSelect) this._cleanup.push(unsubscribeSelect);

    // 监听笔记更新
    const unsubscribeUpdate = this.props.bus?.on('note-updated', (note) => {
      if (note.id === this.state.note?.id) {
        this.setState({ note });
        this._updateTimeDisplay();
        if (this._previewMode && this._previewLayer) {
          this._updatePreview(note.content || '');
        }
        this._updateNavButtons();
      }
    });
    if (unsubscribeUpdate) this._cleanup.push(unsubscribeUpdate);

    // 监听编辑模式设置请求（用于新建笔记后自动进入编辑模式）
    const unsubscribeSetEditMode = this.props.bus?.on('editor:set-edit-mode', () => {
      // 不抢焦点，保持标题输入框的聚焦（新建笔记场景）
      this._setEditMode(false);
    });
    if (unsubscribeSetEditMode) this._cleanup.push(unsubscribeSetEditMode);

    // 监听预览/编辑模式切换请求（来自更多菜单）
    const unsubscribeToggleMode = this.props.bus?.on('editor:toggle-mode', () => {
      this._toggleMode();
    });
    if (unsubscribeToggleMode) this._cleanup.push(unsubscribeToggleMode);
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
   * 更新容器 (已修复 DOM 替换缓存 Bug)
   * @private
   */
  _updateContainer() {
    if (!this.el) return;
    const oldEl = this.el;
    const newEl = this.render();
    oldEl.replaceWith(newEl);
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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const input = /** @type {HTMLInputElement} */ (this._titleInput);
        if (input) {
          input.focus();
          if (input.value) {
            input.select();
          }
        }
      });
    });
  }

  /**
   * 销毁组件
   */
  async destroy() {
    await this._savePendingChanges();
    clearTimeout(this._saveTimer);
    document.removeEventListener('keydown', this._escHandler);
    window.removeEventListener('resize', this._resizeHandler);
    this._cleanup.forEach(fn => fn());
    this._moreMenu?.destroy();
    this._syntaxHelpModal?.destroy();
    this.el?.remove();
  }
}
