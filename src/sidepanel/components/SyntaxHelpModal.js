/**
 * SyntaxHelpModal - Markdown 语法帮助弹窗组件
 *
 * 居中对话框，介绍 Markdown 基本语法
 *
 * @module components/SyntaxHelpModal
 */

import { t } from '../utils/i18n.js';

/**
 * Markdown 官方文档链接
 */
const MARKDOWN_GUIDE_URL = 'https://commonmark.org/help/';

/**
 * 语法帮助弹窗类
 */
export class SyntaxHelpModal {
  constructor(props = {}) {
    this.props = props;
    this.el = null;
    this._overlay = null;
    this._modal = null;
    this._isOpen = false;
    this._isChinese = props._isChinese !== undefined ? props._isChinese : this._checkIsChinese();
    this._setupEscKey();
  }

  /**
   * 检测是否为中文环境
   * @private
   */
  _checkIsChinese() {
    const lang = chrome?.i18n?.getUILanguage?.() || navigator.language;
    return lang.startsWith('zh');
  }

  /**
   * 渲染弹窗 DOM
   * @returns {Element}
   */
  render() {
    // 遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // 弹窗主体（居中对话框）
    const modal = document.createElement('div');
    modal.className = 'modal modal-syntax-help-centered';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.onclick = (e) => e.stopPropagation();

    // 头部
    const header = this._renderHeader();

    // 内容
    const body = this._renderBody();

    // 底部按钮
    const footer = this._renderFooter();

    modal.append(header, body, footer);
    overlay.appendChild(modal);

    // 点击遮罩关闭
    overlay.onclick = () => this.close();

    this._overlay = overlay;
    this._modal = modal;
    this.el = overlay;

    return overlay;
  }

  /**
   * 渲染头部
   * @private
   */
  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = t('markdownSyntaxTitle');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.ariaLabel = t('cancel');
    closeBtn.onclick = () => this.close();

    header.append(title, closeBtn);
    return header;
  }

  /**
   * 渲染内容
   * @private
   */
  _renderBody() {
    const body = document.createElement('div');
    body.className = 'modal-body';

    // 介绍文本
    const intro = document.createElement('div');
    intro.className = 'syntax-intro';
    intro.innerHTML = this._isChinese
      ? `<p>Markdown 是一种轻量级标记语言，让你用纯文本格式编写内容。</p>
         <p>它简单易学，可以快速转换为格式化的 HTML 文档。</p>`
      : `<p>Markdown is a lightweight markup language for writing formatted text.</p>
         <p>It's simple to learn and quickly converts to formatted HTML.</p>`;
    body.appendChild(intro);

    // 语法示例
    const examples = document.createElement('div');
    examples.className = 'syntax-examples';

    const syntaxList = [
      { syntax: '**bold**', label: this._isChinese ? '粗体' : 'Bold' },
      { syntax: '*italic*', label: this._isChinese ? '斜体' : 'Italic' },
      { syntax: '`code`', label: this._isChinese ? '行内代码' : 'Inline code' },
      { syntax: '# Heading', label: this._isChinese ? '标题' : 'Heading' },
      { syntax: '- list', label: this._isChinese ? '列表' : 'List' },
      { syntax: '> quote', label: this._isChinese ? '引用' : 'Quote' },
      { syntax: '[link](url)', label: this._isChinese ? '链接' : 'Link' },
    ];

    syntaxList.forEach(item => {
      const row = document.createElement('div');
      row.className = 'syntax-example-row';
      row.innerHTML = `
        <span class="syntax-label">${item.label}</span>
        <code class="syntax-code">${this._escapeHtml(item.syntax)}</code>
      `;
      examples.appendChild(row);
    });

    body.appendChild(examples);

    // 链接
    const linkSection = document.createElement('div');
    linkSection.className = 'syntax-link-section';

    const link = document.createElement('a');
    link.href = MARKDOWN_GUIDE_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'syntax-learn-link';
    link.textContent = this._isChinese ? '了解更多关于 Markdown →' : 'Learn more about Markdown →';

    linkSection.appendChild(link);
    body.appendChild(linkSection);

    return body;
  }

  /**
   * 渲染底部
   * @private
   */
  _renderFooter() {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.textContent = this._isChinese ? '关闭' : 'Close';
    closeBtn.onclick = () => this.close();

    footer.appendChild(closeBtn);
    return footer;
  }

  /**
   * HTML 转义
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 设置 ESC 键关闭
   * @private
   */
  _setupEscKey() {
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this._isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._escHandler);
  }

  /**
   * 打开弹窗
   */
  open() {
    if (this._isOpen) return;

    if (!this.el) {
      this.render();
    }

    document.body.appendChild(this.el);

    // 触发动画
    requestAnimationFrame(() => {
      this._overlay.classList.add('show');
    });

    this._isOpen = true;

    // 聚焦关闭按钮（无障碍）
    const closeBtn = /** @type {HTMLElement} */ (this._modal?.querySelector('.modal-close'));
    closeBtn?.focus();
  }

  /**
   * 关闭弹窗
   */
  close() {
    if (!this._isOpen) return;

    this._overlay?.classList.remove('show');

    // 等待动画结束
    setTimeout(() => {
      this._overlay?.remove();
    }, 200);

    this._isOpen = false;
  }

  /**
   * 切换状态
   */
  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.close();
    document.removeEventListener('keydown', this._escHandler);
    this.el?.remove();
  }
}
