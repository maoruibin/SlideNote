/**
 * MoreMenu - 更多菜单组件
 *
 * Footer 右侧的"更多"菜单，支持 hover 和点击触发
 * 包含：导出笔记、导入备份、GitHub、关于
 *
 * @example
 * const moreMenu = new MoreMenu({ bus });
 * footer.appendChild(moreMenu.render());
 */

import { t } from '../utils/i18n.js';

export class MoreMenu {
  #isOpen = false;
  #menuEl = null;
  #triggerEl = null;
  #handleOutsideClick = null;
  #handleEscape = null;
  #hoverTimer = null;
  #isHovering = false;

  constructor(props = {}) {
    this.props = props;
    this.bus = props.bus;
    this.el = null;
  }

  /**
   * 渲染更多菜单（返回触发按钮和菜单容器）
   * @returns {HTMLElement}
   */
  render() {
    const container = document.createElement('div');
    container.className = 'footer-more';

    // 触发按钮（只显示三点）
    const trigger = document.createElement('div');
    trigger.className = 'footer-more-trigger';
    trigger.title = t('more') || '更多';
    trigger.innerHTML = `
      <div class="more-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    // 点击触发（兼容移动端）
    trigger.onclick = (e) => {
      e.stopPropagation();
      this.toggle();
    };

    this.#triggerEl = trigger;
    container.appendChild(trigger);

    // 菜单容器
    const menu = this.#createMenu();
    this.#menuEl = menu;
    container.appendChild(menu);

    // Hover 触发（桌面端）
    container.addEventListener('mouseenter', () => {
      this.#isHovering = true;
      this.#clearHoverTimer();
      this.open();
    });

    container.addEventListener('mouseleave', () => {
      this.#isHovering = false;
      // 延迟关闭，给用户时间移动到菜单上
      this.#hoverTimer = setTimeout(() => {
        if (!this.#isHovering) {
          this.close();
        }
      }, 300);
    });

    // 菜单项也要监听 hover，防止从触发器移动到菜单时关闭
    menu.addEventListener('mouseenter', () => {
      this.#isHovering = true;
      this.#clearHoverTimer();
    });

    menu.addEventListener('mouseleave', () => {
      this.#isHovering = false;
      this.#hoverTimer = setTimeout(() => {
        if (!this.#isHovering) {
          this.close();
        }
      }, 300);
    });

    this.el = container;
    return container;
  }

  /**
   * 清除 hover 定时器
   * @private
   */
  #clearHoverTimer() {
    if (this.#hoverTimer) {
      clearTimeout(this.#hoverTimer);
      this.#hoverTimer = null;
    }
  }

  /**
   * 创建菜单内容
   * @returns {HTMLElement}
   * @private
   */
  #createMenu() {
    const menu = document.createElement('div');
    menu.className = 'more-menu';

    // 菜单项定义
    const items = [
      { id: 'export', icon: '📤', label: t('exportNotes') || '导出笔记', action: () => this.#handleExport() },
      { id: 'import', icon: '📥', label: t('importBackup') || '导入备份', action: () => this.#handleImport() },
      { divider: true },
      { id: 'feedback', icon: '💬', label: t('feedback') || '意见反馈', action: () => this.#handleFeedback() },
      { id: 'github', icon: '🔗', label: 'GitHub', action: () => this.#handleGitHub() },
      { id: 'about', icon: 'ℹ️', label: t('about') || '关于', action: () => this.#handleAbout() },
    ];

    items.forEach(item => {
      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'more-menu-divider';
        menu.appendChild(divider);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'more-menu-item';
        menuItem.innerHTML = `<span class="menu-icon">${item.icon}</span><span class="menu-label">${item.label}</span>`;
        menuItem.onclick = () => {
          item.action();
          this.close();
        };
        menu.appendChild(menuItem);
      }
    });

    return menu;
  }

  /**
   * 切换菜单显示状态
   */
  toggle() {
    if (this.#isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 打开菜单
   */
  open() {
    if (this.#isOpen) return;

    this.#isOpen = true;
    this.#menuEl.classList.add('show');
    this.#triggerEl.classList.add('active');

    // 点击外部关闭（只在非 hover 模式下生效）
    this.#handleOutsideClick = (e) => {
      if (!this.#isHovering && !this.el.contains(e.target)) {
        this.close();
      }
    };
    document.addEventListener('click', this.#handleOutsideClick);

    // ESC 键关闭
    this.#handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.#handleEscape);
  }

  /**
   * 关闭菜单
   */
  close() {
    if (!this.#isOpen) return;

    this.#isOpen = false;
    this.#menuEl.classList.remove('show');
    this.#triggerEl.classList.remove('active');

    if (this.#handleOutsideClick) {
      document.removeEventListener('click', this.#handleOutsideClick);
      this.#handleOutsideClick = null;
    }

    if (this.#handleEscape) {
      document.removeEventListener('keydown', this.#handleEscape);
      this.#handleEscape = null;
    }

    this.#clearHoverTimer();
  }

  /**
   * 导出笔记
   * @private
   */
  #handleExport() {
    this.bus?.emit('export:show-dialog');
  }

  /**
   * 导入备份
   * @private
   */
  #handleImport() {
    this.bus?.emit('import:show-dialog');
  }

  /**
   * 意见反馈
   * @private
   */
  #handleFeedback() {
    chrome.tabs.create({ url: 'https://my.feishu.cn/share/base/form/shrcnnfhgGcaqzU3lUfrDxamVZc' });
  }

  /**
   * GitHub 链接
   * @private
   */
  #handleGitHub() {
    chrome.tabs.create({ url: 'https://github.com/maoruibin/SlideNote' });
  }

  /**
   * 关于
   * @private
   */
  #handleAbout() {
    this.bus?.emit('about:show');
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.close();
    this.el?.remove();
  }
}
