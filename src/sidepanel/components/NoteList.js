/**
 * NoteList - 笔记列表组件
 * 优化版本：只显示标题，全量 Fragment 替换，事件委托
 */

import { t } from '../utils/i18n.js';
import { showContextMenu } from './ContextMenu.js';

export class NoteList {
  constructor(props = {}) {
    this.props = props;
    this.state = {
      notes: [],
      activeId: null,
      searchQuery: '',
    };
    this.el = null;
    this._cleanup = [];
    this._contextMenu = null;
    this._setupListeners();
    this._loadInitialData();
  }

  /**
   * 加载初始数据
   */
  _loadInitialData() {
    if (this.props.store && this.props.store.state.notes) {
      this.setState({
        notes: this.props.store.state.notes,
        activeId: this.props.store.state.activeNoteId,
      });
    }
  }

  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    return oldState;
  }

  /**
   * 获取当前应显示的笔记（搜索 or 排序）
   */
  _getDisplayNotes() {
    if (this.state.searchQuery) {
      return this.props.store?.searchNotes(this.state.searchQuery) || [];
    }
    return this.props.store?.getSortedNotes() || [];
  }

  /**
   * 渲染组件（首次挂载）
   */
  render() {
    const container = document.createElement('div');
    container.className = 'note-list';

    const notes = this._getDisplayNotes();

    if (notes.length === 0) {
      container.innerHTML = this._renderEmpty();
      return container;
    }

    this._buildList(container, notes);
    return container;
  }

  /**
   * 初始化（DOM 挂载后）
   */
  initialize() {
    if (this.el) {
      this._syncActiveState();
    }
  }

  /**
   * 用 DocumentFragment 构建列表
   */
  _buildList(container, notes) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    notes.forEach((note, index) => {
      fragment.appendChild(this._renderItem(note));

      if (note.pinned && (index === notes.length - 1 || !notes[index + 1]?.pinned)) {
        const divider = document.createElement('div');
        divider.className = 'pinned-divider';
        divider.dataset.type = 'divider';
        fragment.appendChild(divider);
      }
    });

    container.appendChild(fragment);
  }

  /**
   * 渲染单个笔记项（只有标题）
   */
  _renderItem(note) {
    const isActive = note.id === this.state.activeId;
    const isPinned = note.pinned || false;

    const item = document.createElement('div');
    item.className = `note-item${isPinned ? ' pinned' : ''}${isActive ? ' active' : ''}`;
    item.dataset.id = note.id;
    item.dataset.type = 'item';

    const title = document.createElement('div');
    title.className = 'note-item-title';
    title.textContent = note.title || t('unnamedNote');

    item.appendChild(title);
    return item;
  }

  /**
   * 事件委托：click + contextmenu
   */
  _bindItemEvents(container) {
    container.addEventListener('click', (e) => {
      const item = e.target.closest('.note-item');
      if (item) {
        const noteId = item.dataset.id;
        const note = this.state.notes.find(n => n.id === noteId);
        if (note) this._handleSelect(note);
      }
    });

    container.addEventListener('contextmenu', (e) => {
      const item = e.target.closest('.note-item');
      if (item) {
        e.preventDefault();
        const noteId = item.dataset.id;
        const note = this.state.notes.find(n => n && n.id === noteId);
        if (note) {
          const index = this.state.notes.findIndex(n => n.id === noteId);
          this._showContextMenu(e, note, index);
        }
      }
    });
  }

  _renderEmpty() {
    return `
      <div class="note-list-empty">
        <div class="empty-icon">📝</div>
        <div class="empty-title">${t('emptyTitle')}</div>
        <div class="empty-desc">${t('emptyDesc')}</div>
      </div>
    `;
  }

  /**
   * 设置事件监听
   */
  _setupListeners() {
    // 数据变化 → 全量 Fragment 替换
    const unsubChange = this.props.store?.on('change', () => {
      this._handleStoreChange();
    });
    if (unsubChange) this._cleanup.push(unsubChange);

    // 选中变化 → 只切换 CSS class（不触发重渲染）
    const unsubSelect = this.props.bus?.on('note:select', (id) => {
      const oldState = this.setState({ activeId: id });
      this._updateActiveState(oldState.activeId, id);
    });
    if (unsubSelect) this._cleanup.push(unsubSelect);

    // 搜索变化
    const unsubSearch = this.props.bus?.on('search:change', (query) => {
      this.setState({ searchQuery: query });
      this._handleStoreChange();
    });
    if (unsubSearch) this._cleanup.push(unsubSearch);

    // 创建笔记 - 清空空状态占位
    const unsubCreate = this.props.bus?.on('note:create', () => {
      if (this.el) this.el.innerHTML = '';
    });
    if (unsubCreate) this._cleanup.push(unsubCreate);
  }

  /**
   * 数据变化处理 - 全量 Fragment 替换
   * 比差异化更新更快：省去 O(n²) 的 DOM 对比和定位
   */
  _handleStoreChange() {
    if (!this.el) return;

    // 同步 store 端的 activeId（跨设备同步场景）
    this.state.activeId = this.props.store?.state.activeNoteId ?? this.state.activeId;

    const notes = this._getDisplayNotes();
    this.state.notes = notes;

    if (notes.length === 0) {
      this.el.innerHTML = this._renderEmpty();
      return;
    }

    this._buildList(this.el, notes);
  }

  /**
   * 切换选中态 - 只操作 CSS class，不重渲染
   */
  _updateActiveState(oldId, newId) {
    if (oldId === newId) return;

    if (oldId) {
      const oldEl = this.el?.querySelector(`[data-id="${oldId}"]`);
      if (oldEl) oldEl.classList.remove('active');
    }
    if (newId) {
      const newEl = this.el?.querySelector(`[data-id="${newId}"]`);
      if (newEl) newEl.classList.add('active');
    }
  }

  _syncActiveState() {
    if (!this.el || !this.state.activeId) return;
    this.el.querySelectorAll('.note-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === this.state.activeId);
    });
  }

  _handleSelect(note) {
    this.props.store?.setActiveNote(note.id);
    this.props.bus?.emit('note:select', note.id);
  }

  _showContextMenu(e, note, index) {
    if (this._contextMenu) {
      this._contextMenu.close();
    }
    this._contextMenu = showContextMenu({
      x: e.clientX,
      y: e.clientY,
      index,
      total: this.state.notes.length,
      note,
      onSelect: (action) => this._handleMenuAction(action, note),
    });
  }

  async _handleMenuAction(action, note) {
    const store = this.props.store;
    if (!store) return;

    switch (action) {
      case 'move-up':
        await store.moveNoteUp(note.id);
        break;
      case 'move-down':
        await store.moveNoteDown(note.id);
        break;
      case 'pin':
        await store.togglePin(note.id);
        break;
      case 'delete':
        this.props.bus?.emit('note:delete-request', note);
        break;
    }
  }

  destroy() {
    if (this._contextMenu) {
      this._contextMenu.close();
    }
    this._cleanup.forEach(fn => fn());
    this.el?.remove();
  }
}
