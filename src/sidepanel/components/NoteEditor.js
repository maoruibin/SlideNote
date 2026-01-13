/**
 * NoteEditor - 笔记编辑器组件
 */

import { formatRelativeTime } from '../utils/format.js';
import { t } from '../utils/i18n.js';

export class NoteEditor {
  constructor(props = {}) {
    this.props = props;
    this.state = { note: null };
    this.el = null;
    this._titleInput = null;
    this._textarea = null;
    this._saveStatus = null;
    this._saveTimer = null;
    this._pendingChanges = null;  // 跟踪未保存的变更
    this._isNewNote = false;      // 标记是否为新建笔记
    this._cleanup = [];
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
    const header = document.createElement('div');
    header.className = 'note-header';

    const titleInput = document.createElement('input');
    titleInput.className = 'note-title-input';
    titleInput.value = this.state.note.title;
    titleInput.placeholder = t('unnamedNote');
    titleInput.oninput = (e) => {
      this._saveDebounced(this.state.note.id, { title: e.target.value });
    };
    // Tab 键支持：从标题跳到内容区
    titleInput.onkeydown = (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this._textarea?.focus();
      }
    };

    const meta = document.createElement('div');
    meta.className = 'note-meta';

    const timeDisplay = document.createElement('span');
    timeDisplay.className = 'note-time';
    timeDisplay.textContent = formatRelativeTime(this.state.note.updatedAt);

    const saveStatus = document.createElement('span');
    saveStatus.className = 'note-save-status';
    saveStatus.innerHTML = `✓ ${t('saved')}`;

    meta.append(timeDisplay, saveStatus);
    header.append(titleInput, meta);

    // 编辑器
    const editor = document.createElement('div');
    editor.className = 'note-editor';

    const textarea = document.createElement('textarea');
    textarea.className = 'note-content-textarea';
    textarea.value = this.state.note.content;
    textarea.placeholder = t('startTyping');
    textarea.oninput = (e) => {
      this._saveDebounced(this.state.note.id, { content: e.target.value });
    };
    // Tab 键支持：从内容区跳回标题
    textarea.onkeydown = (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this._titleInput?.focus();
      }
    };

    editor.appendChild(textarea);
    container.append(header, editor);

    // 保存引用
    this._titleInput = titleInput;
    this._textarea = textarea;
    this._saveStatus = saveStatus;
    this._timeDisplay = timeDisplay;

    // 监听保存完成
    const unsubscribeSave = this.props.bus?.on('save:complete', () => {
      this._showSaveStatus();
    });
    if (unsubscribeSave) this._cleanup.push(unsubscribeSave);

    return container;
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
    // 监听笔记选择 - 切换前先保存未提交的变更
    const unsubscribeSelect = this.props.bus?.on('note:select', async (id, options = {}) => {
      // 如果是当前笔记，跳过
      if (this.state.note?.id === id) return;

      // 先保存未提交的变更
      await this._savePendingChanges();

      // 保存是否为新笔记的标记
      this._isNewNote = options.isNew || false;

      // 切换到新笔记
      const note = this.props.store?.state.notes.find(n => n.id === id);
      this.setState({ note: note || null });
      this._updateContainer();

      // 如果是新笔记，聚焦到标题输入框
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
      }
    });
    if (unsubscribeUpdate) this._cleanup.push(unsubscribeUpdate);
  }

  /**
   * 防抖保存（1秒延迟）
   * @private
   */
  _saveDebounced(id, changes) {
    // 保存待提交的变更
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
   * 用于切换笔记前的立即保存
   * @private
   */
  async _savePendingChanges() {
    // 如果没有待保存的变更，直接返回
    if (!this._pendingChanges || !this.state.note) return;

    // 清除防抖定时器
    clearTimeout(this._saveTimer);

    // 立即保存
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
   * 用于新建笔记时自动聚焦
   * @private
   */
  _focusTitleInput() {
    // 使用 setTimeout 确保 DOM 渲染完成
    setTimeout(() => {
      if (this._titleInput) {
        this._titleInput.focus();
        // 如果有默认文本，选中全部；否则光标在开头
        if (this._titleInput.value) {
          this._titleInput.select();
        }
      }
    }, 50);
  }

  /**
   * 销毁组件
   */
  async destroy() {
    // 销毁前保存未提交的变更
    await this._savePendingChanges();
    clearTimeout(this._saveTimer);
    this._cleanup.forEach(fn => fn());
    this.el?.remove();
  }
}
