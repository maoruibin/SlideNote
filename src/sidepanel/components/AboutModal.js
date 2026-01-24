/**
 * AboutModal - 关于弹窗
 *
 * 显示应用信息、版本号、社交链接等
 *
 * @example
 * const modal = new AboutModal({ store, bus });
 * modal.show();
 */

import { t } from '../utils/i18n.js';

export class AboutModal {
  #overlay = null;
  #modal = null;
  #handleEscape = null;
  #isOpen = false;

  constructor(props = {}) {
    this.props = props;
    this.store = props.store;
    this.bus = props.bus;
    this.el = null;
  }

  /**
   * 显示弹窗
   */
  show() {
    if (this.#isOpen) return;

    if (!this.el) {
      this.#render();
      this.#bindEvents();
    }

    document.body.appendChild(this.el);

    requestAnimationFrame(() => {
      this.#overlay.classList.add('show');
    });

    this.#isOpen = true;
  }

  /**
   * 渲染弹窗
   * @private
   */
  #render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal about-modal';

    const version = chrome.runtime.getManifest().version;

    modal.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">${t('aboutTitle') || '关于 SlideNote'}</span>
        <button class="modal-close" data-action="close" aria-label="${t('close') || '关闭'}">×</button>
      </div>

      <div class="modal-body">
        <!-- Logo 区域 -->
        <div class="about-logo">
          <div class="about-icon">📝</div>
          <div class="about-name">SlideNote</div>
          <div class="about-tagline">${t('tagline') || '侧边笔记，常伴左右'}</div>
        </div>

        <!-- 版本信息 -->
        <div class="about-info">
          <div class="about-info-item">
            <span>📦</span>
            <span>v${version}</span>
          </div>
          <div class="about-info-item">
            <span>👨‍💻</span>
            <span>${t('author') || '咕咚同学'}</span>
          </div>
        </div>

        <div class="about-divider"></div>

        <!-- 更多作品 -->
        <div class="about-section">
          <div class="section-title">${t('moreWorks') || '更多作品'}</div>
          <div class="works-grid">
            ${this.#renderWorkCard('📝', 'inBox 笔记', 'Local-First 极简笔记', 'https://doc.gudong.site/inbox/')}
            ${this.#renderWorkCard('✍️', 'WeiMD', '公众号 Markdown 排版', 'https://weimd.gudong.site/')}
            ${this.#renderWorkCard('📇', 'inBox Card', '公共知识卡片项目', 'https://github.com/maoruibin/inBoxCard')}
            ${this.#renderWorkCard('🖼️', 'GudongCover', '封面制作工具', 'https://cover.gudong.site/')}
          </div>
          <a href="https://doc.gudong.site" target="_blank" class="view-all-works" rel="noopener noreferrer">
            查看全部作品 →
          </a>
        </div>

        <div class="about-divider"></div>

        <!-- 社交链接 -->
        <div class="about-section">
          <div class="section-title">${t('socialLinks') || '社交链接'}</div>
          <div class="social-links">
            ${this.#renderSocialLink('https://github.com/maoruibin', 'GitHub',
              '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>')}
            ${this.#renderSocialLink('https://x.com/dxgudong', 'X',
              '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>')}
            ${this.#renderEmojiLink('https://weibo.com/u/1874136301', '微博', '🌭')}
            ${this.#renderEmojiLink('https://web.okjike.com/u/3f000c6d-bd82-4695-a404-f184652e622e', '即刻', '🚀')}
            ${this.#renderEmojiLink('https://www.xiaohongshu.com/user/profile/6690863b000000001e00e6a4', '小红书', '📕')}
            ${this.#renderWeChatLink()}
          </div>
        </div>

        <div class="about-divider"></div>

        <!-- 更多 -->
        <div class="about-section">
          <div class="section-title">${t('more') || '更多'}</div>
          <div class="about-links">
            ${this.#renderLink('https://blog.gudong.site',
              '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
              t('blog') || '个人博客')}
            ${this.#renderLink('https://my.feishu.cn/share/base/form/shrcnnfhgGcaqzU3lUfrDxamVZc',
              '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
              t('feedback') || '意见反馈')}
            ${this.#renderLink('https://github.com/maoruibin/SlideNote/blob/main/CHANGELOG.md',
              '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
              t('changelog') || '查看更新日志')}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-primary" data-action="close">
          ${t('close') || '关闭'}
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    this.#overlay = overlay;
    this.#modal = modal;
    this.el = overlay;
  }

  /**
   * 渲染社交链接
   * @param {string} href - 链接地址
   * @param {string} title - 标题
   * @param {string} svgContent - SVG 内容
   * @returns {string} HTML 字符串
   * @private
   */
  #renderSocialLink(href, title, svgContent) {
    return `
      <a href="${href}" target="_blank" class="social-link" title="${title}" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          ${svgContent}
        </svg>
      </a>
    `;
  }

  /**
   * 渲染微信链接（带二维码弹层）
   * @returns {string} HTML 字符串
   * @private
   */
  #renderWeChatLink() {
    return `
      <span class="social-link social-link-emoji social-link-wechat" title="微信公众号：咕咚同学">
        💬
        <div class="wechat-qr-popup">
          <img src="https://gudong.s3.bitiful.net/asset/gongzhonghao.jpg" alt="公众号二维码" class="wechat-qr-img">
          <div class="wechat-qr-text">扫码关注 公众号 咕咚同学</div>
        </div>
      </span>
    `;
  }

  /**
   * 渲染表情图标链接
   * @param {string} href - 链接地址
   * @param {string} title - 标题
   * @param {string} emoji - 表情
   * @returns {string} HTML 字符串
   * @private
   */
  #renderEmojiLink(href, title, emoji) {
    return `
      <a href="${href}" target="_blank" class="social-link social-link-emoji" title="${title}" rel="noopener noreferrer">
        ${emoji}
      </a>
    `;
  }

  /**
   * 渲染作品卡片
   * @param {string} emoji - 表情图标
   * @param {string} title - 作品标题
   * @param {string} desc - 作品描述
   * @param {string} url - 作品链接
   * @returns {string} HTML 字符串
   * @private
   */
  #renderWorkCard(emoji, title, desc, url) {
    return `
      <a href="${url}" target="_blank" class="work-card" rel="noopener noreferrer">
        <span class="work-emoji">${emoji}</span>
        <div class="work-info">
          <div class="work-title">${title}</div>
          <div class="work-desc">${desc}</div>
        </div>
      </a>
    `;
  }

  /**
   * 渲染链接按钮
   * @param {string} href - 链接地址
   * @param {string} svgContent - SVG 内容
   * @param {string} text - 按钮文字
   * @returns {string} HTML 字符串
   * @private
   */
  #renderLink(href, svgContent, text) {
    return `
      <a href="${href}" target="_blank" class="about-link" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${svgContent}
        </svg>
        <span>${text}</span>
      </a>
    `;
  }

  /**
   * 绑定事件
   * @private
   */
  #bindEvents() {
    // 关闭按钮
    this.#modal.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });

    // 点击遮罩关闭
    this.#overlay.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.hide();
    });

    // ESC 关闭
    this.#handleEscape = (e) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.#handleEscape);
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    if (!this.#isOpen) return;

    this.#overlay.classList.remove('show');

    if (this.#handleEscape) {
      document.removeEventListener('keydown', this.#handleEscape);
      this.#handleEscape = null;
    }

    setTimeout(() => {
      this.el?.remove();
    }, 200);

    this.#isOpen = false;
  }

  /**
   * 销毁弹窗
   */
  destroy() {
    this.hide();
  }
}
