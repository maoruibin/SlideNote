/**
 * ContextMenu - 右键菜单组件
 * 用于笔记列表的排序操作
 */

import { t } from '../utils/i18n.js';

/**
 * 菜单项类型定义
 * @typedef {Object} MenuItem
 * @property {string} id - 菜单项ID
 * @property {string} label - 显示文本
 * @property {string} icon - 图标（HTML）
 * @property {boolean} disabled - 是否禁用
 * @property {boolean} divider - 是否是分割线
 */

export class ContextMenu {
  constructor(props = {}) {
    this.props = props;
    this.el = null;
    this._isVisible = false;
    this._closeOnClickOutside = this._closeOnClickOutside.bind(this);
  }

  /**
   * 显示菜单
   * @param {number} x - 屏幕X坐标
   * @param {number} y - 屏幕Y坐标
   * @param {Object} options - 选项配置
   * @param {number} options.index - 当前笔记索引
   * @param {number} options.total - 总笔记数
   * @param {Object} options.note - 当前笔记对象
   */
  show(x, y, options = {}) {
    const { index = 0, total = 1, note = null } = options;

    // 如果已经显示，先关闭
    if (this._isVisible) {
      this.close();
    }

    const menu = this._renderMenu(index, total, note);
    this._positionMenu(menu, x, y);
    this._isVisible = true;

    // 延迟添加点击外部关闭，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', this._closeOnClickOutside);
    }, 10);
  }

  /**
   * 关闭菜单
   */
  close() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    this._isVisible = false;
    document.removeEventListener('click', this._closeOnClickOutside);
  }

  /**
   * 渲染菜单
   * @private
   */
  _renderMenu(index, total, note) {
    // 移除旧菜单
    if (this.el) {
      this.el.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = this._renderMenuItems(index, total, note);

    this.el = menu;
    document.body.appendChild(menu);

    return menu;
  }

  /**
   * 渲染菜单项
   * @private
   */
  _renderMenuItems(index, total, note) {
    const items = this._getMenuItems(index, total, note);

    return items.map(item => {
      if (item.divider) {
        return `<div class="context-menu-divider"></div>`;
      }

      const disabledClass = item.disabled ? ' disabled' : '';
      return `
        <div class="context-menu-item${disabledClass}" data-action="${item.id}">
          <span class="menu-icon">${item.icon}</span>
          <span class="menu-label">${item.label}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * 获取菜单项配置
   * @private
   */
  _getMenuItems(index, total, note) {
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const isOnlyOne = total === 1;
    const isPinned = note?.pinned || false;

    return [
      {
        id: 'pin',
        label: isPinned ? t('unpin') : t('pin'),
        icon: isPinned ? '○' : '📌',
        disabled: false,
      },
      {
        id: 'divider-1',
        divider: true,
      },
      {
        id: 'move-up',
        label: t('moveUp'),
        icon: '↑',
        disabled: isFirst || isOnlyOne,
      },
      {
        id: 'move-down',
        label: t('moveDown'),
        icon: '↓',
        disabled: isLast || isOnlyOne,
      },
      {
        id: 'divider-2',
        divider: true,
      },
      {
        id: 'delete',
        label: t('delete'),
        icon: '×',
        disabled: false,
      },
    ];
  }

  /**
   * 定位菜单
   * @private
   */
  _positionMenu(menu, x, y) {
    // 确保菜单不会超出视口
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let posX = x;
    let posY = y;

    // 右边界检测
    if (x + rect.width > viewportWidth - 10) {
      posX = viewportWidth - rect.width - 10;
    }

    // 下边界检测
    if (y + rect.height > viewportHeight - 10) {
      posY = viewportHeight - rect.height - 10;
    }

    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;
  }

  /**
   * 点击外部关闭
   * @private
   */
  _closeOnClickOutside(e) {
    if (this.el && !this.el.contains(e.target)) {
      this.close();
    }
  }

  /**
   * 设置菜单项点击事件
   * @param {Function} callback - 回调函数 (actionId) => void
   */
  onItemClick(callback) {
    if (!this.el) return;

    const items = this.el.querySelectorAll('.context-menu-item:not(.disabled)');
    items.forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        this.close();
        callback?.(action);
      };
    });
  }
}

/**
 * 创建并显示右键菜单的便捷函数
 * @param {Object} options - 选项
 * @param {number} options.x - X坐标
 * @param {number} options.y - Y坐标
 * @param {number} options.index - 当前笔记索引
 * @param {number} options.total - 总笔记数
 * @param {Object} options.note - 当前笔记对象
 * @param {Function} options.onSelect - 选择回调
 * @returns {ContextMenu}
 */
export function showContextMenu(options) {
  const { x, y, index, total, note, onSelect } = options;
  const menu = new ContextMenu();
  menu.show(x, y, { index, total, note });
  menu.onItemClick(onSelect);
  return menu;
}
