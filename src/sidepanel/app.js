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

    // 社交链接
    const socialDiv = document.createElement('div');
    socialDiv.className = 'footer-social';

    // GitHub
    const githubLink = this._createSocialLink('https://github.com/maoruibin/SlideNote', 'GitHub', '/icons/social-github.svg');

    // Twitter/X
    const twitterLink = this._createSocialLink('https://x.com/dxgudong', 'X', '/icons/social-x.svg');

    // 即刻
    const jikeLink = this._createSocialLink('https://web.okjike.com/u/3f000c6d-bd82-4695-a404-f184652e622e', '即刻', '/icons/social-jike.svg');

    // 小红书
    const xhsLink = this._createSocialLink('https://www.xiaohongshu.com/user/profile/6690863b000000001e00e6a4', '小红书', '/icons/social-xiaohongshu.svg');

    socialDiv.append(githubLink, twitterLink, jikeLink, xhsLink);

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

  /**
   * 创建社交链接
   * @private
   */
  _createSocialLink(href, title, iconPath) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.className = 'footer-social-link';
    link.title = title;

    // 创建图片元素加载 SVG
    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = title;
    img.className = 'footer-social-icon';
    link.appendChild(img);

    return link;
  }
}

// 创建并初始化应用
const app = new App();
app.init();

// 导出用于调试
window.__SLIDENOTE__ = { app, Store, bus };
