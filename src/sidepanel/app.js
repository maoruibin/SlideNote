/**
 * SlideNote 应用入口
 *
 * @module app
 */

import { Store, SyncManager } from './core/Store.js';
import { bus } from './core/EventBus.js';
import { NoteList } from './components/NoteList.js';
import { NoteEditor } from './components/NoteEditor.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';
import { Toast } from './components/Toast.js';
import { ExportDialog } from './components/ExportDialog.js';
import { ImportDialog } from './components/ImportDialog.js';
import { AboutModal } from './components/AboutModal.js';
import { StorageBar } from './components/StorageBar.js';
import { t } from './utils/i18n.js';

/**
 * 应用类
 */
class App {
  constructor() {
    this.store = null;
    this.syncManager = null;
    this.components = {};
    this.dialog = null;
  }

  /**
   * 初始化应用
   */
  async init() {
    // 创建存储实例
    this.store = new Store();
    await this.store.init();

    // 初始化同步管理
    this.syncManager = new SyncManager(this.store);
    this.store.setSyncManager(this.syncManager);

    // 挂载组件
    this._mountComponents();

    // 设置全局事件监听
    this._setupGlobalListeners();

    // 恢复上次选中的笔记
    this._restoreActiveNote();

    console.log('SlideNote initialized');
  }

  /**
   * 挂载组件
   * @private
   */
  _mountComponents() {
    const container = document.querySelector('#app');
    if (!container) {
      console.error('App container not found');
      return;
    }

    // 实例化笔记列表
    this.components.noteList = new NoteList({ store: this.store, bus });

    // 实例化存储容量条
    this.components.storageBar = new StorageBar({ store: this.store });

    // 决定并通知 NoteEditor 初始抽屉的状态（如果没有活动笔记或没有笔记，默认展开）
    const activeNoteId = this.store.state.activeNoteId;
    const hasNotes = this.store.state.notes && this.store.state.notes.length > 0;
    const initialListOpen = !activeNoteId || !hasNotes;

    // 实例化笔记编辑器，将这些子组件做为 props 传过去
    this.components.noteEditor = new NoteEditor({
      store: this.store,
      bus,
      noteList: this.components.noteList,
      storageBar: this.components.storageBar,
      initialListOpen
    });

    const editorEl = this.components.noteEditor.render();
    this.components.noteEditor.el = editorEl;

    // 直接将编辑器挂载到主容器 (100% 满屏)
    container.appendChild(editorEl);
  }

  /**
   * 设置全局事件监听
   * @private
   */
  _setupGlobalListeners() {
    // 新建笔记 - 延迟触发编辑模式
    bus.on('note:create', async () => {
      const result = await this.store.createNote();
      bus.emit('note:select', result.id);
      // 延迟触发编辑模式（等待渲染完成）
      setTimeout(() => {
        bus.emit('editor:set-edit-mode');
      }, 300);
    });

    // 删除笔记请求
    bus.on('note:delete-request', (note) => {
      this._showDeleteConfirm(note);
    });

    // 导出功能 - 显示格式选择对话框
    bus.on('export:show-dialog', () => {
      if (!this.components.exportDialog) {
        this.components.exportDialog = new ExportDialog({ store: this.store, bus });
      }
      this.components.exportDialog.show();
    });

    // 导入功能 - 显示文件选择对话框
    bus.on('import:show-dialog', () => {
      if (!this.components.importDialog) {
        this.components.importDialog = new ImportDialog({ store: this.store, bus });
      }
      this.components.importDialog.show();
    });

    // 关于弹窗
    bus.on('about:show', () => {
      if (!this.components.aboutModal) {
        this.components.aboutModal = new AboutModal({ store: this.store, bus });
      }
      this.components.aboutModal.show();
    });

    // 笔记列表刷新（导入后触发）
    bus.on('notes:refresh', () => {
      // 笔记列表会自动通过 Store 的 change 事件更新
      // 这里可以添加额外的刷新逻辑
    });

    // Toast 通知
    bus.on('toast:show', ({ type, message }) => {
      Toast.show(type, message);
    });
  }

  /**
   * 显示删除确认
   * @private
   */
  _showDeleteConfirm(note) {
    // 关闭之前的弹窗
    if (this.dialog) {
      this.dialog.close();
    }

    const noteTitle = note.title || t('unnamedNote');
    this.dialog = new ConfirmDialog({
      title: t('confirmDelete'),
      message: t('deleteConfirm', [noteTitle]).replace('\\n', '<br>'),
      onConfirm: async () => {
        await this.store.deleteNote(note.id);
        this.dialog = null;
      },
    });

    this.dialog.show();
  }

  /**
   * 恢复上次选中的笔记
   * @private
   */
  _restoreActiveNote() {
    const activeNoteId = this.store.state.activeNoteId;
    if (activeNoteId) {
      // 检查笔记是否还存在
      const noteExists = this.store.state.notes.find(n => n.id === activeNoteId);
      if (noteExists) {
        // 触发 note:select 事件，让 NoteEditor 加载内容
        bus.emit('note:select', activeNoteId);
      } else {
        // 笔记不存在了，清除 activeNoteId
        this.store.state.activeNoteId = null;
      }
    }
  }
}

// 创建并初始化应用
const app = new App();
app.init();

// 导出用于调试
window.__SLIDENOTE__ = { app, Store, bus };
