/**
 * ConfirmDialog - 确认弹窗组件
 *
 * @example
 * const dialog = new ConfirmDialog({
 *   title: '确认删除',
 *   message: '确定删除「xxx」吗？',
 *   onConfirm: () => console.log('confirmed'),
 * });
 * dialog.show();
 */

import { t } from '../utils/i18n.js';

export class ConfirmDialog {
  constructor(props = {}) {
    this.props = props;
    this.el = null;
    this._confirmBtn = null;
  }

  /**
   * 显示弹窗
   */
  show() {
    if (this.el) return;

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    // 点击遮罩关闭
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.close();
      }
    };

    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.onclick = (e) => e.stopPropagation();

    // 图标
    const icon = document.createElement('div');
    icon.className = 'dialog-icon';
    icon.textContent = '🗑️';

    // 标题
    const title = document.createElement('div');
    title.className = 'dialog-title';
    title.textContent = this.props.title || t('confirmDelete');

    // 消息
    const message = document.createElement('div');
    message.className = 'dialog-message';
    message.innerHTML = this.props.message || '';

    // 按钮
    const buttons = document.createElement('div');
    buttons.className = 'dialog-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'dialog-btn dialog-btn-cancel';
    cancelBtn.textContent = t('cancel');
    cancelBtn.onclick = () => this.close();

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'dialog-btn dialog-btn-confirm';
    confirmBtn.textContent = t('confirm');
    confirmBtn.onclick = () => {
      this.props.onConfirm?.();
      this.close();
    };

    buttons.append(cancelBtn, confirmBtn);
    dialog.append(icon, title, message, buttons);
    overlay.appendChild(dialog);

    this._confirmBtn = confirmBtn;
    this.el = overlay;

    document.body.appendChild(overlay);
  }

  /**
   * 关闭弹窗
   */
  close() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }
}
