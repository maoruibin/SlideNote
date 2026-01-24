/**
 * Toast - 通知提示组件
 *
 * 显示操作成功/失败/信息的临时提示
 *
 * @example
 * Toast.show('success', '导出成功');
 * Toast.show('error', '导入失败');
 */

export class Toast {
  static #container = null;
  static #activeToasts = new Map();

  /**
   * 显示提示
   * @param {string} type - 类型: 'success', 'error', 'info'
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间（毫秒），默认 3000
   */
  static show(type, message, duration = 3000) {
    // 确保容器存在
    Toast.#ensureContainer();

    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = Toast.#getIcon(type);
    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.textContent = icon;

    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    toast.append(iconEl, messageEl);

    // 添加到容器
    Toast.#container.appendChild(toast);

    // 触发进入动画
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // 记录活跃的 toast
    const toastId = Date.now();
    Toast.#activeToasts.set(toastId, toast);

    // 自动移除
    const timeoutId = setTimeout(() => {
      Toast.#hide(toast, toastId);
    }, duration);

    // 支持点击关闭
    toast.addEventListener('click', () => {
      clearTimeout(timeoutId);
      Toast.#hide(toast, toastId);
    });

    return toastId;
  }

  /**
   * 确保容器存在
   * @private
   */
  static #ensureContainer() {
    if (!Toast.#container || !document.body.contains(Toast.#container)) {
      Toast.#container = document.createElement('div');
      Toast.#container.className = 'toast-container';
      document.body.appendChild(Toast.#container);
    }
  }

  /**
   * 隐藏提示
   * @param {HTMLElement} toast - toast 元素
   * @param {number} toastId - toast ID
   * @private
   */
  static #hide(toast, toastId) {
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
      Toast.#activeToasts.delete(toastId);

      // 如果没有活跃的 toast，移除容器
      if (Toast.#activeToasts.size === 0 && Toast.#container) {
        Toast.#container.remove();
        Toast.#container = null;
      }
    }, 200); // 等待退出动画
  }

  /**
   * 获取图标
   * @param {string} type - 类型
   * @returns {string} emoji 图标
   * @private
   */
  static #getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  /**
   * 快捷方法：成功提示
   */
  static success(message, duration) {
    return Toast.show('success', message, duration);
  }

  /**
   * 快捷方法：错误提示
   */
  static error(message, duration) {
    return Toast.show('error', message, duration);
  }

  /**
   * 快捷方法：信息提示
   */
  static info(message, duration) {
    return Toast.show('info', message, duration);
  }

  /**
   * 清除所有提示
   */
  static clearAll() {
    Toast.#activeToasts.forEach((toast, id) => {
      Toast.#hide(toast, id);
    });
  }
}
