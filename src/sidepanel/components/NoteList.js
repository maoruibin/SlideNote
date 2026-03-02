/**
 * NoteList - 笔记列表组件
 * 优化版本：使用差异化更新，避免完全重渲染
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
    this._itemMap = new Map();  // DOM 元素缓存：noteId -> element
    this._setupListeners();
    this._loadInitialData();
  }

  /**
   * 加载初始数据
   * @private
   */
  _loadInitialData() {
    if (this.props.store && this.props.store.state.notes) {
      this.setState({
        notes: this.props.store.state.notes,
        activeId: this.props.store.state.activeNoteId,
      });
    }
  }

  /**
   * 设置状态
   */
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    return oldState;
  }

  /**
   * 渲染组件（仅在首次或强制重渲染时调用）
   */
  render() {
    const container = document.createElement('div');
    container.className = 'note-list';

    // 使用排序后的笔记
    const notes = this.props.store ? this.props.store.getSortedNotes() : this.state.notes;

    if (notes.length === 0) {
      container.innerHTML = this._renderEmpty();
      return container;
    }

    // 渲染列表项
    notes.forEach((note, index) => {
      const item = this._renderItem(note);
      container.appendChild(item);

      if (note.pinned && (index === notes.length - 1 || !notes[index + 1]?.pinned)) {
        const divider = document.createElement('div');
        divider.className = 'pinned-divider';
        divider.dataset.type = 'divider';
        container.appendChild(divider);
      }
    });

    return container;
  }

  /**
   * 初始化组件（在 DOM 挂载后调用）
   */
  initialize() {
    if (this.el) {
      // 填充 _itemMap
      this._itemMap.clear();
      this.el.querySelectorAll('.note-item').forEach(el => {
        const id = el.dataset.id;
        if (id) {
          this._itemMap.set(id, el);
        }
      });

      // 同步选中状态
      this._syncActiveState();
    }
  }

  /**
   * 同步所有元素的选中状态
   * @private
   */
  _syncActiveState() {
    if (!this.el || !this.state.activeId) return;

    this.el.querySelectorAll('.note-item').forEach(el => {
      const isActive = el.dataset.id === this.state.activeId;
      el.classList.toggle('active', isActive);
    });
  }

  /**
   * 渲染单个笔记项
   * @private
   */
  _renderItem(note) {
    const isActive = note.id === this.state.activeId;
    const isPinned = note.pinned || false;

    const item = document.createElement('div');
    item.className = `note-item${isPinned ? ' pinned' : ''}${isActive ? ' active' : ''}`;
    item.dataset.id = note.id;
    item.dataset.type = 'item';

    // 标题
    const title = document.createElement('div');
    title.className = 'note-item-title';
    title.textContent = note.title || t('unnamedNote');

    // 预览
    const preview = document.createElement('div');
    preview.className = 'note-item-preview';
    preview.textContent = truncateText(note.content);

    item.append(title, preview);
    return item;
  }

  /**
   * 绑定事件到单个列表项（避免每次创建新的闭包）
   */
  _bindItemEvents(container) {
    // 使用事件委托而不是为每个项单独绑定
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
      this._handleStoreChange();
    });
    if (unsubscribeChange) this._cleanup.push(unsubscribeChange);

    // 监听笔记选择变化
    const unsubscribeSelect = this.props.bus?.on('note:select', (id) => {
      const oldState = this.setState({ activeId: id });
      this._updateActiveState(oldState.activeId, id);
    });
    if (unsubscribeSelect) this._cleanup.push(unsubscribeSelect);

    // 监听搜索
    const unsubscribeSearch = this.props.bus?.on('search:change', (query) => {
      const oldState = this.setState({ searchQuery: query });
      this._handleSearchChange(oldState.searchQuery, query);
    });
    if (unsubscribeSearch) this._cleanup.push(unsubscribeSearch);
  }

  /**
   * 处理存储变化 - 差异化更新
   * @private
   */
  _handleStoreChange() {
    const oldNotes = this.state.notes;
    const newNotes = this.props.store?.searchNotes(this.state.searchQuery) || [];

    // 缓存当前笔记 ID 集合，用于快速查找
    const oldIds = new Set(oldNotes.map(n => n.id));
    const newIds = new Set(newNotes.map(n => n.id));

    // 如果数量差异太大，直接重渲染
    if (Math.abs(oldNotes.length - newNotes.length) > 50) {
      this._fullRender(newNotes);
      return;
    }

    // 标记需要删除的元素
    const elementsToRemove = [];
    this._itemMap.forEach((el, id) => {
      if (!newIds.has(id)) {
        elementsToRemove.push(el);
        this._itemMap.delete(id);
      }
    });

    // 删除不存在的元素
    elementsToRemove.forEach(el => el.remove());

    // 更新或添加元素
    newNotes.forEach((note, index) => {
      const existingEl = this._itemMap.get(note.id);
      if (existingEl) {
        // 更新现有元素
        this._updateItemElement(existingEl, note);
        // 更新位置
        const parent = existingEl.parentNode;
        if (parent) {
          // 简单的位置更新：移到正确位置
          const referenceEl = this._getReferenceElement(parent, index, note, newNotes);
          if (referenceEl && referenceEl !== existingEl && referenceEl.nextSibling !== existingEl) {
            parent.insertBefore(existingEl, referenceEl);
          }
        }
      } else {
        // 添加新元素
        const newEl = this._renderItem(note);
        this._itemMap.set(note.id, newEl);

        const parent = this.el;
        if (parent) {
          const referenceEl = this._getReferenceElement(parent, index, note, newNotes);
          if (referenceEl) {
            parent.insertBefore(newEl, referenceEl);
          } else {
            parent.appendChild(newEl);
          }

          // 同步选中状态
          if (note.id === this.state.activeId) {
            newEl.classList.add('active');
          }
        }
      }
    });

    // 更新分隔线
    this._updateDividers(newNotes);

    // 更新内部状态
    this.state.notes = newNotes;
  }

  /**
   * 获取参考元素（用于插入位置）
   * @private
   */
  _getReferenceElement(container, index, note, sortedNotes) {
    const items = Array.from(container.querySelectorAll('.note-item'));
    // 找到应该在这个位置之前的元素
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemNote = sortedNotes.find(n => n.id === item.dataset.id);
      if (!itemNote) continue; // 跳过找不到的笔记
      const currentIndex = sortedNotes.indexOf(itemNote);
      if (currentIndex > index) {
        return item;
      }
    }
    return null;
  }

  /**
   * 更新单个列表项的内容
   * @private
   */
  _updateItemElement(el, note) {
    const isActive = note.id === this.state.activeId;
    const isPinned = note.pinned || false;

    // 更新 class
    el.className = `note-item${isPinned ? ' pinned' : ''}${isActive ? ' active' : ''}`;

    // 更新内容
    const titleEl = el.querySelector('.note-item-title');
    const previewEl = el.querySelector('.note-item-preview');

    if (titleEl && titleEl.textContent !== (note.title || t('unnamedNote'))) {
      titleEl.textContent = note.title || t('unnamedNote');
    }

    if (previewEl) {
      const newPreview = truncateText(note.content);
      if (previewEl.textContent !== newPreview) {
        previewEl.textContent = newPreview;
      }
    }
  }

  /**
   * 更新分隔线
   * @private
   */
  _updateDividers(notes) {
    // 移除所有旧分隔线
    this.el.querySelectorAll('.pinned-divider').forEach(d => d.remove());

    // 找到需要插入分隔线的位置
    let lastPinnedIndex = -1;
    for (let i = notes.length - 1; i >= 0; i--) {
      if (notes[i].pinned) {
        lastPinnedIndex = i;
        break;
      }
    }

    if (lastPinnedIndex >= 0 && lastPinnedIndex < notes.length - 1) {
      const pinnedItems = this.el.querySelectorAll('.note-item.pinned');
      const lastPinnedEl = pinnedItems[pinnedItems.length - 1];
      if (lastPinnedEl) {
        const divider = document.createElement('div');
        divider.className = 'pinned-divider';
        divider.dataset.type = 'divider';
        lastPinnedEl.parentNode.insertBefore(divider, lastPinnedEl.nextSibling);
      }
    }
  }

  /**
   * 处理搜索变化
   * @private
   */
  _handleSearchChange(oldQuery, newQuery) {
    const newNotes = this.props.store?.searchNotes(newQuery) || [];

    // 搜索时直接重渲染（因为列表可能完全不同）
    this._fullRender(newNotes);
    this.state.notes = newNotes;
  }

  /**
   * 更新激活状态（只更新 class，不重渲染）
   * @private
   */
  _updateActiveState(oldActiveId, newActiveId) {
    if (oldActiveId === newActiveId) return;

    // 移除旧的激活状态
    if (oldActiveId) {
      const oldEl = this._itemMap.get(oldActiveId);
      if (oldEl) {
        oldEl.classList.remove('active');
      }
    }

    // 添加新的激活状态
    if (newActiveId) {
      const newEl = this._itemMap.get(newActiveId);
      if (newEl) {
        newEl.classList.add('active');
      }
    }
  }

  /**
   * 确保 activeId 对应的元素在 _itemMap 中
   * @private
   */
  _ensureItemMapSynced() {
    if (!this.el || this._itemMap.size === 0) return;

    // 遍历所有 DOM 元素，确保 _itemMap 同步
    this.el.querySelectorAll('.note-item').forEach(el => {
      const id = el.dataset.id;
      if (id && !this._itemMap.has(id)) {
        this._itemMap.set(id, el);
      }
    });
  }

  /**
   * 完全重渲染（仅在必要时使用）
   * @private
   */
  _fullRender(notes) {
    if (!this.el) return;

    // 清空缓存
    this._itemMap.clear();

    // 重新渲染
    this.el.innerHTML = '';

    if (notes.length === 0) {
      this.el.innerHTML = this._renderEmpty();
      return;
    }

    const fragment = document.createDocumentFragment();
    notes.forEach((note, index) => {
      const item = this._renderItem(note);
      this._itemMap.set(note.id, item);
      fragment.appendChild(item);

      if (note.pinned && (index === notes.length - 1 || !notes[index + 1]?.pinned)) {
        const divider = document.createElement('div');
        divider.className = 'pinned-divider';
        divider.dataset.type = 'divider';
        fragment.appendChild(divider);
      }
    });

    this.el.appendChild(fragment);
  }

  /**
   * 处理选择
   * @private
   */
  _handleSelect(note) {
    this.props.store?.setActiveNote(note.id);
    this.props.bus?.emit('note:select', note.id);
  }

  /**
   * 显示右键菜单
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
    this._itemMap.clear();
    this.el?.remove();
  }
}
