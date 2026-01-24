/**
 * Store - 数据存储管理
 * 封装 Chrome Storage API，提供统一的数据操作接口
 */

import { bus } from './EventBus.js';

/**
 * 存储键名
 */
const STORAGE_KEYS = {
  NOTES: 'slidenote_notes',
  ACTIVE_NOTE_ID: 'slidenote_active_id',
  SIDEBAR_COLLAPSED: 'slidenote_sidebar_collapsed',
};

/**
 * 简单的 EventEmitter 实现
 */
class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
    return this;
  }

  emit(event, ...args) {
    const callbacks = this._events[event] || [];
    callbacks.forEach(cb => cb(...args));
    return this;
  }

  off(event, callback) {
    const callbacks = this._events[event] || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    return this;
  }
}

/**
 * 数据存储管理类
 *
 * @example
 * const store = new Store();
 * await store.init();
 * const note = await store.createNote();
 */
export class Store extends EventEmitter {
  constructor() {
    super();
    this.state = {
      notes: [],
      activeNoteId: null,
      searchQuery: '',
      sidebarCollapsed: false,  // 侧边栏折叠状态
    };
    this._ready = false;
    this._localChanges = new Map();  // 跟踪本地变更的时间戳
    this._isApplyingRemoteChanges = false;  // 是否正在应用远程变更
    this._syncManager = null;  // 引用 SyncManager
  }

  /**
   * 设置 SyncManager 引用（用于同步标志控制）
   * @param {SyncManager} syncManager
   */
  setSyncManager(syncManager) {
    this._syncManager = syncManager;
  }

  /**
   * 初始化：从 Chrome Storage 加载数据
   */
  async init() {
    const result = await chrome.storage.sync.get({
      [STORAGE_KEYS.NOTES]: [],
      [STORAGE_KEYS.ACTIVE_NOTE_ID]: null,
      [STORAGE_KEYS.SIDEBAR_COLLAPSED]: false,
    });

    this.state.notes = result[STORAGE_KEYS.NOTES] || [];
    this.state.activeNoteId = result[STORAGE_KEYS.ACTIVE_NOTE_ID];
    this.state.sidebarCollapsed = result[STORAGE_KEYS.SIDEBAR_COLLAPSED] || false;

    // 按创建时间倒序排序
    this._sortNotes();

    this._ready = true;
    this.emit('ready');
  }

  /**
   * 创建新笔记
   * @param {Object} options - 可选的笔记数据（用于导入）
   * @param {string} options.id - 指定笔记 ID
   * @param {string} options.title - 笔记标题
   * @param {string} options.content - 笔记内容
   * @param {number} options.createdAt - 创建时间
   * @param {number} options.updatedAt - 更新时间
   * @param {number} options.order - 排序值
   * @returns {Promise<Object>} 返回笔记对象，包含 isNew 标记
   */
  async createNote(options = {}) {
    const note = {
      id: options.id || `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: options.title !== undefined ? options.title : '',
      content: options.content !== undefined ? options.content : '',
      createdAt: options.createdAt || Date.now(),
      updatedAt: options.updatedAt || Date.now(),
      // 如果指定了 order 就用指定的，否则放在最顶部
      order: options.order !== undefined ? options.order : (Math.max(...this.state.notes.map(n => n.order ?? 0), 0) + 1),
    };

    this.state.notes.unshift(note);
    this.state.activeNoteId = note.id;

    await this._persist();
    this.emit('change');
    this.emit('note-created', note);

    // 返回笔记对象 + isNew 标记（用于 UI 聚焦处理）
    return { ...note, isNew: true };
  }

  /**
   * 批量导入笔记（不触发逐个事件，用于导入功能）
   * @param {Array} notes - 要导入的笔记数组
   * @returns {Promise<number>} 导入的笔记数量
   */
  async importNotes(notes) {
    for (const note of notes) {
      // 直接添加到数组，不触发单个笔记的事件
      this.state.notes.unshift(note);
    }

    // 按排序值重新排序
    this._sortNotes();

    // 一次性持久化
    await this._persist();

    // 触发一次全局变化事件
    this.emit('change');

    return notes.length;
  }

  /**
   * 更新笔记
   * @param {string} id
   * @param {Object} changes
   */
  async updateNote(id, changes) {
    const note = this.state.notes.find(n => n.id === id);
    if (!note) return;

    const now = Date.now();
    Object.assign(note, changes, { updatedAt: now });

    // 记录本地变更时间戳（用于冲突检测）
    this._localChanges.set(id, now);

    await this._persist();
    this.emit('change');
    this.emit('note-updated', note);
  }

  /**
   * 删除笔记
   * @param {string} id
   */
  async deleteNote(id) {
    const index = this.state.notes.findIndex(n => n.id === id);
    if (index === -1) return;

    this.state.notes.splice(index, 1);

    // 如果删除的是当前笔记，切换到下一条
    if (this.state.activeNoteId === id) {
      const nextNoteId = this.state.notes[0]?.id || null;
      this.state.activeNoteId = nextNoteId;

      // 发出 note:select 事件到全局 bus，让编辑器更新
      bus.emit('note:select', nextNoteId);
    }

    await this._persist();
    this.emit('change');
    this.emit('note-deleted', id);
  }

  /**
   * 设置当前激活的笔记
   * @param {string} id
   */
  async setActiveNote(id) {
    this.state.activeNoteId = id;
    await chrome.storage.sync.set({
      [STORAGE_KEYS.ACTIVE_NOTE_ID]: id,
    });
    this.emit('active-changed', id);
  }

  /**
   * 搜索笔记
   * @param {string} query
   * @returns {Array}
   */
  searchNotes(query) {
    if (!query.trim()) return this.state.notes;

    const q = query.toLowerCase();
    return this.state.notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
  }

  /**
   * 获取当前激活的笔记
   * @returns {Object|null}
   */
  getActiveNote() {
    return this.state.notes.find(n => n.id === this.state.activeNoteId) || null;
  }

  /**
   * 移动笔记到顶部
   * @param {string} id
   */
  async moveNoteToTop(id) {
    const noteIndex = this.state.notes.findIndex(n => n.id === id);
    if (noteIndex <= 0) return; // 已经在顶部或不存在

    const currentNotes = [...this.state.notes];
    const maxOrder = Math.max(...currentNotes.map(n => n.order ?? 0), 0);
    const note = this.state.notes.find(n => n.id === id);
    if (note) {
      note.order = maxOrder + 1;
      note.updatedAt = Date.now();
      this._localChanges.set(id, Date.now());
    }

    this._sortNotes();
    await this._persist();
    this.emit('change');
    this.emit('note-reordered', this.state.notes);
  }

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

  /**
   * 移动笔记到底部
   * @param {string} id
   */
  async moveNoteToBottom(id) {
    const noteIndex = this.state.notes.findIndex(n => n.id === id);
    const lastIndex = this.state.notes.length - 1;
    if (noteIndex === -1 || noteIndex === lastIndex) return;

    const minOrder = Math.min(...this.state.notes.map(n => n.order ?? 0), 0);
    const note = this.state.notes.find(n => n.id === id);
    if (note) {
      note.order = minOrder - 1;
      note.updatedAt = Date.now();
      this._localChanges.set(id, Date.now());
    }

    this._sortNotes();
    await this._persist();
    this.emit('change');
    this.emit('note-reordered', this.state.notes);
  }

  /**
   * 上移笔记一位
   * @param {string} id
   */
  async moveNoteUp(id) {
    const noteIndex = this.state.notes.findIndex(n => n.id === id);
    if (noteIndex <= 0) return; // 已经在顶部或不存在

    const note = this.state.notes[noteIndex];
    const prevNote = this.state.notes[noteIndex - 1];

    // 交换 order 值
    const noteOrder = note.order ?? 0;
    const prevOrder = prevNote.order ?? 0;
    note.order = prevOrder;
    prevNote.order = noteOrder;
    note.updatedAt = Date.now();
    prevNote.updatedAt = Date.now();

    this._localChanges.set(id, Date.now());
    this._localChanges.set(prevNote.id, Date.now());

    this._sortNotes();
    await this._persist();
    this.emit('change');
    this.emit('note-reordered', this.state.notes);
  }

  /**
   * 下移笔记一位
   * @param {string} id
   */
  async moveNoteDown(id) {
    const noteIndex = this.state.notes.findIndex(n => n.id === id);
    const lastIndex = this.state.notes.length - 1;
    if (noteIndex === -1 || noteIndex >= lastIndex) return;

    const note = this.state.notes[noteIndex];
    const nextNote = this.state.notes[noteIndex + 1];

    // 交换 order 值
    const noteOrder = note.order ?? 0;
    const nextOrder = nextNote.order ?? 0;
    note.order = nextOrder;
    nextNote.order = noteOrder;
    note.updatedAt = Date.now();
    nextNote.updatedAt = Date.now();

    this._localChanges.set(id, Date.now());
    this._localChanges.set(nextNote.id, Date.now());

    this._sortNotes();
    await this._persist();
    this.emit('change');
    this.emit('note-reordered', this.state.notes);
  }

  /**
   * 持久化到 Chrome Storage
   * @private
   */
  async _persist() {
    // 设置同步标志，防止触发同步循环
    if (this._syncManager) {
      this._syncManager._syncInProgress = true;
    }

    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.NOTES]: this.state.notes,
        [STORAGE_KEYS.ACTIVE_NOTE_ID]: this.state.activeNoteId,
      });
    } finally {
      // 延迟重置标志
      if (this._syncManager) {
        setTimeout(() => {
          this._syncManager._syncInProgress = false;
        }, 1000);
      }
    }
  }

  /**
   * 检测并解决冲突
   * 策略：本地未提交的变更优先，否则使用时间戳更新的版本
   * @param {Array} remoteNotes 远程笔记数据
   * @returns {Array} 合并后的笔记
   * @private
   */
  _resolveConflicts(remoteNotes) {
    const resolvedNotes = [];
    const remoteNoteMap = new Map(remoteNotes.map(n => [n.id, n]));

    // 处理本地笔记
    for (const localNote of this.state.notes) {
      const remoteNote = remoteNoteMap.get(localNote.id);

      if (!remoteNote) {
        // 远程不存在，本地新增的笔记
        resolvedNotes.push(localNote);
      } else {
        // 两边都存在，检查冲突
        const localChangeTime = this._localChanges.get(localNote.id);

        if (localChangeTime && localChangeTime > localNote.updatedAt) {
          // 本地有未提交的变更，保留本地版本
          resolvedNotes.push(localNote);
        } else if (remoteNote.updatedAt > localNote.updatedAt) {
          // 远程版本更新，使用远程版本
          resolvedNotes.push(remoteNote);
        } else {
          // 时间戳相同或本地更新，保留本地版本
          resolvedNotes.push(localNote);
        }
      }

      remoteNoteMap.delete(localNote.id);
    }

    // 添加远程新增的笔记
    for (const remoteNote of remoteNoteMap.values()) {
      resolvedNotes.push(remoteNote);
    }

    return this._sortNotesArray(resolvedNotes);
  }

  /**
   * 排序笔记数组
   * @param {Array} notes
   * @returns {Array} 排序后的笔记
   * @private
   */
  _sortNotesArray(notes) {
    return notes.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  }

  /**
   * 内部排序
   * @private
   */
  _sortNotes() {
    this.state.notes.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  }

  /**
   * 切换侧边栏折叠状态
   * @param {boolean} collapsed 是否折叠
   */
  async setSidebarCollapsed(collapsed) {
    this.state.sidebarCollapsed = collapsed;
    await chrome.storage.sync.set({
      [STORAGE_KEYS.SIDEBAR_COLLAPSED]: collapsed,
    });
    this.emit('sidebar-toggled', collapsed);
  }

  /**
   * 获取侧边栏折叠状态
   * @returns {boolean}
   */
  isSidebarCollapsed() {
    return this.state.sidebarCollapsed;
  }
}

/**
 * 同步管理器
 * 监听 Chrome Storage 变化，处理多端同步
 */
export class SyncManager {
  /**
   * @param {Store} store
   */
  constructor(store) {
    this.store = store;
    this._syncInProgress = false;  // 防止同步循环
    this._setupListener();
  }

  /**
   * 设置监听器
   * @private
   */
  _setupListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;

      // 检查是否有我们的数据变化
      const hasChanges =
        changes[STORAGE_KEYS.NOTES] ||
        changes[STORAGE_KEYS.ACTIVE_NOTE_ID];

      if (hasChanges && !this._syncInProgress) {
        this._handleSyncChange(changes);
      }
    });
  }

  /**
   * 处理同步变化
   * @param {Object} changes Chrome Storage 变化对象
   * @private
   */
  async _handleSyncChange(changes) {
    this._syncInProgress = true;

    try {
      // 获取远程数据
      const result = await chrome.storage.sync.get({
        [STORAGE_KEYS.NOTES]: [],
        [STORAGE_KEYS.ACTIVE_NOTE_ID]: null,
      });

      const remoteNotes = result[STORAGE_KEYS.NOTES] || [];
      const remoteActiveId = result[STORAGE_KEYS.ACTIVE_NOTE_ID];

      // 使用冲突解决策略合并数据
      const mergedNotes = this.store._resolveConflicts(remoteNotes);

      // 检查是否有变化
      const hasChanges =
        JSON.stringify(mergedNotes) !== JSON.stringify(this.store.state.notes) ||
        remoteActiveId !== this.store.state.activeNoteId;

      if (hasChanges) {
        // 更新本地状态
        const previousNotes = this.store.state.notes;
        this.store.state.notes = mergedNotes;
        this.store.state.activeNoteId = remoteActiveId;

        // 清除已同步的本地变更标记
        for (const note of mergedNotes) {
          const localChangeTime = this.store._localChanges.get(note.id);
          if (localChangeTime && localChangeTime <= note.updatedAt) {
            this.store._localChanges.delete(note.id);
          }
        }

        // 通知 UI 刷新
        this.store.emit('change');
        bus.emit('sync:complete', {
          type: 'remote',
          previousNotes,
          mergedNotes,
        });

        console.log('SlideNote: Synced from cloud with conflict resolution');
      }
    } finally {
      // 延迟重置标志，避免在同步过程中再次触发
      setTimeout(() => {
        this._syncInProgress = false;
      }, 1000);
    }
  }
}
