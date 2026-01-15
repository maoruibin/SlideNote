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
    this._listSection = null;  // 笔记列表区域引用
    this._collapseBtn = null;  // 折叠按钮引用
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

    // 初始化侧边栏折叠状态
    this._initSidebarState();

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

    // 创建左侧笔记列表区域
    const listSection = document.createElement('div');
    listSection.className = 'note-list-section';
    this._listSection = listSection;

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

    // 作者链接（根据语言环境选择不同链接）
    const authorDiv = document.createElement('div');
    authorDiv.className = 'footer-author';
    const author = t('author');
    const developedByText = t('developedBy', [author]);
    // 中文用 blog，英文用 dev.to
    const uiLang = chrome.i18n.getUILanguage();
    const authorUrl = uiLang.startsWith('zh') ? 'https://blog.gudong.site/' : 'https://dev.to/gudong';
    authorDiv.innerHTML = developedByText.replace(
      author,
      `<a href="${authorUrl}" target="_blank" class="author-link">${author}</a>`
    );

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

    // 微信公众号 (带二维码)
    const wechatLink = this._createWeChatLink('https://gudong.s3.bitiful.net/asset/gongzhonghao.jpg');

    socialDiv.append(githubLink, twitterLink, jikeLink, xhsLink, wechatLink);

    const taglineDiv = document.createElement('div');
    taglineDiv.className = 'footer-tagline';
    taglineDiv.textContent = t('tagline');

    appFooter.append(authorDiv, socialDiv, taglineDiv);
    footer.appendChild(appFooter);
    listSection.appendChild(footer);

    // 添加侧边栏折叠/展开按钮
    this._collapseBtn = this._createCollapseButton();
    listSection.appendChild(this._collapseBtn);

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
    // 新建笔记 - 延迟触发编辑模式
    bus.on('note:create', async () => {
      // 侧边栏折叠时自动展开
      await this.expandSidebar();
      const result = await this.store.createNote();
      bus.emit('note:select', result.id, { isNew: true });
      // 延迟触发编辑模式（等待渲染完成）
      setTimeout(() => {
        bus.emit('editor:set-edit-mode');
      }, 300);
    });

    // 删除笔记请求
    bus.on('note:delete-request', (note) => {
      this._showDeleteConfirm(note);
    });

    // 搜索展开时自动展开侧边栏
    bus.on('search:expand', async () => {
      await this.expandSidebar();
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
   * 创建社交链接
   * @private
   */
  _createSocialLink(href, tooltip, iconPath) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.className = 'footer-social-link';
    link.setAttribute('data-tooltip', tooltip);

    // 创建图片元素加载 SVG
    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = tooltip;
    img.className = 'footer-social-icon';
    link.appendChild(img);

    return link;
  }

  /**
   * 创建微信链接（带二维码）
   * @private
   */
  _createWeChatLink(qrCodeUrl) {
    const link = document.createElement('span');
    link.className = 'footer-social-link footer-wechat-link';

    // 创建图片元素加载 SVG 图标
    const img = document.createElement('img');
    img.src = '/icons/social-wechat.svg';
    img.alt = '微信公众号';
    img.className = 'footer-social-icon';
    link.appendChild(img);

    // 创建二维码弹层
    const qrPopup = document.createElement('div');
    qrPopup.className = 'footer-qr-popup';

    const qrImg = document.createElement('img');
    qrImg.src = qrCodeUrl;
    qrImg.alt = '公众号二维码';
    qrImg.className = 'footer-qr-img';
    qrPopup.appendChild(qrImg);

    // 添加文案
    const qrText = document.createElement('div');
    qrText.className = 'footer-qr-text';
    qrText.textContent = '扫码关注 公众号 咕咚同学';
    qrPopup.appendChild(qrText);

    link.appendChild(qrPopup);

    return link;
  }

  /**
   * 创建侧边栏折叠/展开按钮
   * @private
   */
  _createCollapseButton() {
    const btn = document.createElement('button');
    btn.className = 'sidebar-collapse-btn';
    // 向左箭头（收起）
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="11 17 6 12 11 7"/>
      </svg>
    `;
    btn.title = '收起侧边栏';
    btn.onclick = () => this._toggleSidebar();

    return btn;
  }

  /**
   * 切换侧边栏折叠状态
   * @private
   */
  async _toggleSidebar() {
    const isCollapsed = this.store.isSidebarCollapsed();
    const newState = !isCollapsed;

    // 更新按钮状态
    this._updateCollapseButton(newState);

    // 更新 CSS 类
    if (newState) {
      this._listSection.classList.add('collapsed');
      this._collapseBtn.title = '展开侧边栏';
    } else {
      this._listSection.classList.remove('collapsed');
      this._collapseBtn.title = '收起侧边栏';
    }

    // 持久化状态
    await this.store.setSidebarCollapsed(newState);
  }

  /**
   * 更新折叠按钮的显示状态
   * @param {boolean} isCollapsed
   * @private
   */
  _updateCollapseButton(isCollapsed) {
    if (!this._collapseBtn) return;

    if (isCollapsed) {
      // 切换为展开按钮样式（向右箭头，圆形按钮）
      this._collapseBtn.className = 'sidebar-expand-btn';
      this._collapseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 14 12 9 7"/>
        </svg>
      `;
      this._collapseBtn.setAttribute('data-tooltip', '展开侧边栏');
    } else {
      // 切换为折叠按钮样式（向左箭头，窄长按钮）
      this._collapseBtn.className = 'sidebar-collapse-btn';
      this._collapseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="11 17 6 12 11 7"/>
        </svg>
      `;
      this._collapseBtn.title = '收起侧边栏';
    }
  }

  /**
   * 初始化侧边栏折叠状态
   * @private
   */
  _initSidebarState() {
    const isCollapsed = this.store.isSidebarCollapsed();

    if (isCollapsed) {
      this._listSection.classList.add('collapsed');
      this._updateCollapseButton(true);
    }
  }

  /**
   * 展开侧边栏（在需要时调用）
   */
  async expandSidebar() {
    if (!this.store.isSidebarCollapsed()) return;

    this._listSection.classList.remove('collapsed');
    this._updateCollapseButton(false);
    await this.store.setSidebarCollapsed(false);
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
        bus.emit('note:select', activeNoteId, { isRestore: true });
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
