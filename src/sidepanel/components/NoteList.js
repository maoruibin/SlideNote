/**
 * NoteList - 笔记列表组件
 */

import { truncateText } from '../utils/format.js';
import { showContextMenu } from './ContextMenu.js';
import { t } from '../utils/i18n.js';

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
   * @private
   */
  _loadInitialData() {
    // 从 store 加载初始笔记数据
    if (this.props.store && this.props.store.state.notes) {
      this.setState({
        notes: this.props.store.state.notes,
        activeId: this.props.store.state.activeNoteId,
      });
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'note-list';

    // 使用排序后的笔记（置顶在前）
    const notes = this.props.store ? this.props.store.getSortedNotes() : this.state.notes;

    // 空状态
    if (notes.length === 0) {
      container.innerHTML = this._renderEmpty();
      return container;
    }

    // 渲染列表项
    notes.forEach((note, index) => {
      const item = this._renderItem(note);
      container.appendChild(item);

      // 在最后一个置顶笔记后插入分隔线
      if (note.pinned && (index === notes.length - 1 || !notes[index + 1]?.pinned)) {
        const divider = document.createElement('div');
        divider.className = 'pinned-divider';
        container.appendChild(divider);
      }
    });

    return container;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  /**
   * 渲染单个笔记项
   * @private
   */
  _renderItem(note) {
    const isActive = note.id === this.state.activeId;
    const isPinned = note.pinned || false;
    const index = this.state.notes.findIndex(n => n.id === note.id);

    const item = document.createElement('div');
    item.className = `note-item${isPinned ? ' pinned' : ''}${isActive ? ' active' : ''}`;
    item.dataset.id = note.id;

    // 标题
    const title = document.createElement('div');
    title.className = 'note-item-title';
    title.textContent = note.title || t('unnamedNote');

    // 预览
    const preview = document.createElement('div');
    preview.className = 'note-item-preview';
    preview.textContent = truncateText(note.content);

    item.onclick = () => this._handleSelect(note);

    // 右键菜单
    item.oncontextmenu = (e) => {
      e.preventDefault();
      this._showContextMenu(e, note, index);
    };

    item.append(title, preview);
    return item;
  }

  /**
   * 渲染空状态
   * @private
   */
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
   * @private
   */
  _setupListeners() {
    // 监听数据变化
    const unsubscribeChange = this.props.store?.on('change', () => {
      this._refreshNotes();
    });
    if (unsubscribeChange) this._cleanup.push(unsubscribeChange);

    // 监听笔记选择变化
    const unsubscribeSelect = this.props.bus?.on('note:select', (id) => {
      this.setState({ activeId: id });
      this._updateActiveItem();
    });
    if (unsubscribeSelect) this._cleanup.push(unsubscribeSelect);

    // 监听搜索
    const unsubscribeSearch = this.props.bus?.on('search:change', (query) => {
      this.setState({ searchQuery: query });
      this._refreshNotes();
    });
    if (unsubscribeSearch) this._cleanup.push(unsubscribeSearch);
  }

  /**
   * 刷新笔记列表
   * @private
   */
  _refreshNotes() {
    const notes = this.props.store?.searchNotes(this.state.searchQuery) || [];
    this.setState({ notes });
    this._updateContainer();
  }

  /**
   * 更新容器内容
   * @private
   */
  _updateContainer() {
    if (!this.el) return;
    const newEl = this.render();
    this.el.replaceWith(newEl);
    this.el = newEl;
  }

  /**
   * 更新选中状态
   * @private
   */
  _updateActiveItem() {
    if (!this.el) return;

    const items = this.el.querySelectorAll('.note-item');
    items.forEach(item => {
      const isActive = item.dataset.id === this.state.activeId;
      item.classList.toggle('active', isActive);
    });
  }

  /**
   * 处理选择
   * @private
   */
  _handleSelect(note) {
    // 只切换选中状态，不改变折叠状态
    this.props.store?.setActiveNote(note.id);
    this.props.bus?.emit('note:select', note.id);
  }

  /**
   * 显示右键菜单
   * @private
   */
  _showContextMenu(e, note, index) {
    // 关闭之前的菜单
    if (this._contextMenu) {
      this._contextMenu.close();
    }

    // 使用排序后的笔记列表获取正确的 total（与显示顺序一致）
    const notes = this.props.store ? this.props.store.getSortedNotes() : this.state.notes;

    this._contextMenu = showContextMenu({
      x: e.clientX,
      y: e.clientY,
      index,
      total: notes.length,
      note: note,
      onSelect: (action) => this._handleMenuAction(action, note),
    });
  }

  /**
   * 处理菜单操作
   * @private
   */
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

  /**
   * 销毁组件
   */
  destroy() {
    if (this._contextMenu) {
      this._contextMenu.close();
    }
    this._cleanup.forEach(fn => fn());
    this.el?.remove();
  }
}
