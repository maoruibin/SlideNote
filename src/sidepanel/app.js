/**
 * SlideNote 应用入口
 *
 * @module app
 */

import { Store, SyncManager } from './core/Store.js';
import { bus } from './core/EventBus.js';
import { Toolbar } from './components/Toolbar.js';
import { NoteList } from './components/NoteList.js';
import { NoteEditor } from './components/NoteEditor.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';

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

    // 创建左侧笔记列表区域
    const listSection = document.createElement('div');
    listSection.className = 'note-list-section';

    // 顶部工具栏
    this.components.toolbar = new Toolbar({ bus });
    const toolbarEl = this.components.toolbar.render();
    listSection.appendChild(toolbarEl);

    // 笔记列表
    this.components.noteList = new NoteList({ store: this.store, bus });
    const noteListEl = this.components.noteList.render();
    this.components.noteList.el = noteListEl;
    listSection.appendChild(noteListEl);

    // 底部页脚
    const footer = document.createElement('div');
    footer.className = 'note-list-footer';

    const appFooter = document.createElement('div');
    appFooter.className = 'app-footer';

    // 作者链接
    const authorDiv = document.createElement('div');
    authorDiv.className = 'footer-author';
    authorDiv.innerHTML = '由 <a href="https://blog.gudong.site/" target="_blank" class="author-link">咕咚同学</a> 开发';

    // 社交链接（GitHub）
    const socialDiv = document.createElement('div');
    socialDiv.className = 'footer-social';

    const githubLink = document.createElement('a');
    githubLink.href = 'https://github.com/maoruibin/SlideNote';
    githubLink.target = '_blank';
    githubLink.className = 'footer-github';
    githubLink.title = 'GitHub';
    githubLink.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.02 0-.15 0-.38 0-.74.01-1.08-.01-1.52-.02-.48.01-.96.01-1.44 0-3.55-2.16-4.41-4.15-4.41-1.03 0-1.96.28-2.27.76-.85-.51-1.3-.2-2.7-.2-2.83 0-.03-.15-.15-.4-.6-.56-.3-.12-.74-.33-.74-.33l-.18-.03c-.16-.01-.34.01-.52.05-.18.04-.35.11-.53.23-.1.07-.15.14-.22.21-.13.13-.23.28-.3.43-.08.16-.12.31-.14.44-.02.12-.02.2-.01.25.01.06.05.08.17.14.33.09.21.17.45.24.68.07.23.09.44.07.62-.01.09-.03.17-.06.22-.09.09-.06.13-.14-.11-.26.02-.16.1-.36.25-.59.47-.23.22-.36.37-.39.45-.03.08-.02.17.01.28.03.1.1.26.25.48.43.22.18.44.33.65.43.21.1.39.15.53.14.28-.01.44-.2.44-.47 0-.12-.04-.23-.11-.33-.07-.1-.17-.19-.3-.27-.13-.08-.28-.14-.45-.17-.17-.03-.34-.03-.5 0-.15.01-.29.04-.41.09-.12.05-.23.12-.32.21-.09.09-.15.19-.18.3-.03.11-.03.21-.01.29.02.07.06.11.16.12.26.01.05.02.11.01.17 0 .06-.01.13-.04.2-.09.07-.15.11-.24.1-.18-.01-.3-.08-.37-.21-.07-.13-.08-.29-.02-.48.06-.19.17-.34.33-.44.16-.1.27-.14.32-.12.05.02.06.09.04.19-.02.2-.11.39-.27.55-.48.16-.21.23-.36.19-.43-.04-.07-.1-.1-.19-.08-.18.02-.35.14-.5.35-.15.21-.2.39-.16.53.04.14.11.23.22.27.33.04.1.05.18.02.24-.03.06-.09.07-.17.04-.25-.05-.08-.14-.13-.26-.14-.24-.01-.39.1-.47.33-.08.23-.08.49 0 .78.09.29.26.54.52.73.26.19.45.29.56.28.11-.01.2-.1.26-.31.06-.21-.02-.47-.11-.77-.28-.3-.17-.52-.4-.65-.68-.13-.28-.15-.55-.05-.8.1-.25.25-.42.47-.5.21-.08.42-.09.63-.02.2.07.37.22.49.44.12.22.16.45.12.68-.04.23-.15.42-.32.56-.17.14-.36.22-.56.24-.2.02-.39-.02-.56-.13-.17-.11-.27-.29-.28-.52-.01-.23.05-.44.17-.63.12-.19.27-.34.45-.43.18-.09.33-.12.44-.09.11.03.16.12.14.27-.02.15-.11.33-.27.52-.16.19-.29.3-.39.33-.1.03-.16.05-.17.19-.01.14-.08.32-.2.54-.12.22-.2.36-.23.43-.03.07.01.12.06.12.14 0 .12.09.22.26.3.17.08.36.11.57.1.4-.01.64-.16.76-.45.12-.29.12-.6 0-.92-.12-.32-.34-.59-.66-.79-.32-.2-.58-.3-.77-.3-.19 0-.34.1-.46.3-.12.2-.12.44 0 .73.12.29.35.55.67.76.32.21.55.33.7.34.15.01.26-.08.26-.27 0-.19-.11-.42-.34-.69-.23-.27-.39-.48-.47-.63-.08-.15-.08-.27.02-.34.1-.07.2-.09.33-.06.26.03.47.13.63.3.16.17.27.36.32.56.05.2.05.36-.01.46-.18.1-.17.09-.4-.03-.69-.12-.29-.3-.52-.55-.68-.25-.16-.42-.22-.51-.18-.09.04-.12.14-.07.25.05.11.17.29.36.54.19.25.35.47.47.65.12.18.17.32.14.41-.04.09-.17.08-.42-.12-.76z"/>
      </svg>
    `;
    socialDiv.appendChild(githubLink);

    const taglineDiv = document.createElement('div');
    taglineDiv.className = 'footer-tagline';
    taglineDiv.textContent = 'Slide notes, always by your side';

    appFooter.append(authorDiv, socialDiv, taglineDiv);
    footer.appendChild(appFooter);
    listSection.appendChild(footer);

    // 创建右侧内容区域
    const contentSection = document.createElement('div');
    contentSection.className = 'note-content-section';

    // 笔记编辑器
    this.components.noteEditor = new NoteEditor({ store: this.store, bus });
    const editorEl = this.components.noteEditor.render();
    this.components.noteEditor.el = editorEl;
    contentSection.appendChild(editorEl);

    // 添加到容器
    container.append(listSection, contentSection);
  }

  /**
   * 设置全局事件监听
   * @private
   */
  _setupGlobalListeners() {
    // 新建笔记
    bus.on('note:create', async () => {
      const note = await this.store.createNote();
      bus.emit('note:select', note.id);
    });

    // 删除笔记请求
    bus.on('note:delete-request', (note) => {
      this._showDeleteConfirm(note);
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

    this.dialog = new ConfirmDialog({
      title: '确认删除',
      message: `确定删除「${note.title}」吗？<br>此操作无法撤销。`,
      onConfirm: async () => {
        await this.store.deleteNote(note.id);
        this.dialog = null;
      },
    });

    this.dialog.show();
  }
}

// 创建并初始化应用
const app = new App();
app.init();

// 导出用于调试
window.__SLIDENOTE__ = { app, Store, bus };
