/**
 * EditorMoreMenu - 编辑器更多菜单组件
 *
 * 编辑器右上角 [⋮] 下拉菜单
 * 功能：复制为富文本、复制为 Markdown、语法帮助
 *
 * @module components/EditorMoreMenu
 */

import { bus } from '../core/EventBus.js';
import { t } from '../utils/i18n.js';

/**
 * 编辑器更多菜单类
 */
export class EditorMoreMenu {
  constructor(props = {}) {
    this.props = props;
    this.el = null;
    this._isOpen = false;
    this._anchorBtn = null;

    // 菜单项配置
    this._menuItems = [
      {
        id: 'copy-rich-text',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="4" width="8" height="10" rx="1"/>
          <path d="M5 4V2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
        </svg>`,
        label: t('copyAsRichText'),
        action: () => this._handleCopyRichText(),
      },
      {
        id: 'copy-markdown',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
          <path d="M7 6h4M7 9h4M7 12h2"/>
        </svg>`,
        label: t('copyAsMarkdown'),
        action: () => this._handleCopyMarkdown(),
      },
      {
        id: 'divider-1',
        type: 'divider',
      },
      {
        id: 'syntax-help',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="7" fill-opacity="0.1"/>
          <circle cx="8" cy="4" r="1"/>
          <path d="M8 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`,
        label: t('syntaxHelp'),
        action: () => this._handleSyntaxHelp(),
      },
      {
        id: 'divider-2',
        type: 'divider',
      },
      {
        id: 'delete',
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 4h10M5 4v1h6V4M6 4V3h4v1M5 6v7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6"/>
        </svg>`,
        label: t('delete'),
        action: () => this._handleDelete(),
      },
    ];

    this._setupOutsideClick();
  }

  /**
   * 渲染菜单 DOM
   * @returns {Element}
   */
  render() {
    const menu = document.createElement('div');
    menu.className = 'editor-more-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-hidden', 'true');

    this._menuItems.forEach(item => {
      if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'more-menu-divider';
        menu.appendChild(divider);
      } else {
        const menuItem = this._renderMenuItem(item);
        menu.appendChild(menuItem);
      }
    });

    this.el = menu;
    return menu;
  }

  /**
   * 渲染单个菜单项
   * @private
   */
  _renderMenuItem(item) {
    const element = document.createElement('div');
    element.className = 'more-menu-item';
    element.setAttribute('role', 'menuitem');
    element.dataset.id = item.id;

    // 图标
    const icon = document.createElement('span');
    icon.className = 'menu-item-icon';
    icon.innerHTML = item.icon;

    // 标签
    const label = document.createElement('span');
    label.className = 'menu-item-label';
    label.textContent = item.label;

    element.append(icon, label);

    // 点击事件
    element.onclick = () => {
      item.action();
      this.close();
    };

    return element;
  }

  /**
   * 打开菜单
   * @param {HTMLElement} anchor - 定位锚点（按钮元素）
   */
  open(anchor) {
    if (this._isOpen) return;

    this._anchorBtn = anchor;

    if (!this.el) {
      this.render();
      document.body.appendChild(this.el);
    }

    // 定位菜单
    this._positionMenu(anchor);

    this._isOpen = true;
    this.el.classList.add('show');

    // 激活按钮状态
    anchor.classList.add('active');

    // 触发动画
    requestAnimationFrame(() => {
      this.el.style.opacity = '1';
      this.el.style.transform = 'translateY(0) scale(1)';
    });
  }

  /**
   * 关闭菜单
   */
  close() {
    if (!this._isOpen) return;

    this._isOpen = false;
    this.el?.classList.remove('show');
    this._anchorBtn?.classList.remove('active');

    // 重置动画状态
    if (this.el) {
      this.el.style.opacity = '0';
      this.el.style.transform = 'translateY(-8px) scale(0.95)';
    }
  }

  /**
   * 切换菜单状态
   * @param {HTMLElement} anchor - 定位锚点
   */
  toggle(anchor) {
    if (this._isOpen) {
      this.close();
    } else {
      this.open(anchor);
    }
  }

  /**
   * 定位菜单
   * @private
   */
  _positionMenu(anchor) {
    if (!this.el || !anchor) return;

    const rect = anchor.getBoundingClientRect();
    const menuWidth = 200;
    const offset = 4;

    // 右对齐，按钮下方
    let left = rect.right - menuWidth;
    let top = rect.bottom + offset;

    // 边界检查
    if (left < 0) left = rect.left;
    if (top + 250 > window.innerHeight) {
      top = rect.top - this.el.offsetHeight - offset;
    }

    this.el.style.position = 'fixed';
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
    this.el.style.zIndex = '1000';
  }

  /**
   * 设置外部点击关闭
   * @private
   */
  _setupOutsideClick() {
    this._outsideClickHandler = (e) => {
      if (!this._isOpen) return;
      if (!this.el?.contains(e.target) && !this._anchorBtn?.contains(e.target)) {
        this.close();
      }
    };
    document.addEventListener('click', this._outsideClickHandler);
  }

  /**
   * 处理复制为富文本（带样式）
   * @private
   */
  async _handleCopyRichText() {
    const note = this.props.store?.getActiveNote();
    if (!note) return;

    const previewLayer = this.props.previewLayer;
    if (!previewLayer) return;

    try {
      // 使用 Clipboard API 复制富文本
      const blobHtml = new Blob([previewLayer.innerHTML], { type: 'text/html' });
      const blobText = new Blob([previewLayer.textContent], { type: 'text/plain' });
      const data = [new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      })];

      await navigator.clipboard.write(data);

      bus.emit('toast:show', {
        message: t('copiedRichText'),
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to copy rich text:', err);
      // 降级：尝试只复制纯文本
      try {
        await navigator.clipboard.writeText(previewLayer.textContent);
        bus.emit('toast:show', {
          message: t('copiedPlainText'),
          type: 'success',
        });
      } catch (err2) {
        bus.emit('toast:show', {
          message: t('copyFailed'),
          type: 'error',
        });
      }
    }
  }

  /**
   * 处理复制 Markdown
   * @private
   */
  async _handleCopyMarkdown() {
    const note = this.props.store?.getActiveNote();
    if (!note) return;

    try {
      await navigator.clipboard.writeText(note.content);
      bus.emit('toast:show', {
        message: t('copiedMarkdown'),
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to copy markdown:', err);
      bus.emit('toast:show', {
        message: t('copyFailed'),
        type: 'error',
      });
    }
  }

  /**
   * 处理语法帮助
   * @private
   */
  _handleSyntaxHelp() {
    bus.emit('syntax-help:show');
  }

  /**
   * 处理删除笔记
   * 触发 note:delete-request 事件，复用 App 中的删除确认逻辑
   * @private
   */
  _handleDelete() {
    const note = this.props.store?.getActiveNote();
    if (note) {
      // 复用统一的删除逻辑，触发事件即可
      bus.emit('note:delete-request', note);
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.close();
    document.removeEventListener('click', this._outsideClickHandler);
    this.el?.remove();
  }
}
