/**
 * StorageBar - 存储容量显示组件
 *
 * 显示同步笔记的存储使用情况，点击查看详情
 *
 * @example
 * const storageBar = new StorageBar({ store });
 * document.body.appendChild(storageBar.render());
 */

import { t } from '../utils/i18n.js';

export class StorageBar {
  #syncSize = 0;
  #syncTotal = 8192; // 8KB
  #syncPercent = 0;
  #updateDebounce = null;
  #hasShownWarning = false;

  constructor(props = {}) {
    this.props = props;
    this.store = props.store;
    this.el = null;
  }

  /**
   * 渲染组件
   */
  render() {
    const bar = document.createElement('div');
    bar.className = 'storage-bar';
    bar.innerHTML = `
      <div class="storage-info" data-action="show-detail">
        <span class="storage-icon">💾</span>
        <span class="storage-text">计算中...</span>
        <span class="storage-percent"></span>
      </div>
      <div class="storage-progress">
        <div class="storage-progress-fill"></div>
      </div>
    `;

    this.el = bar;
    this.#bindEvents();

    // 初始化时计算一次
    this.#updateStorageInfo();

    // 监听 store 变化
    this.store.on('change', () => this.#scheduleUpdate());
    this.store.on('note-created', () => this.#scheduleUpdate());
    this.store.on('note-deleted', () => this.#scheduleUpdate());

    return bar;
  }

  /**
   * 绑定事件
   * @private
   */
  #bindEvents() {
    const info = this.el.querySelector('.storage-info');
    info?.addEventListener('click', () => this.#showDetailDialog());
  }

  /**
   * 调度更新（防抖）
   * @private
   */
  #scheduleUpdate() {
    if (this.#updateDebounce) {
      clearTimeout(this.#updateDebounce);
    }
    this.#updateDebounce = setTimeout(() => {
      this.#updateStorageInfo();
    }, 300);
  }

  /**
   * 更新存储信息
   * @private
   */
  async #updateStorageInfo() {
    try {
      // 计算 sync 笔记
      const result = await chrome.storage.sync.get({ slidenote_notes: [] });
      const notes = result.slidenote_notes || [];
      const size = JSON.stringify(notes).length;

      this.#syncSize = size;
      this.#syncPercent = Math.min(100, (size / this.#syncTotal) * 100);

      this.#updateUI();
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  }

  /**
   * 更新 UI 显示
   * @private
   */
  #updateUI() {
    if (!this.el) return;

    const textEl = this.el.querySelector('.storage-text');
    const percentEl = this.el.querySelector('.storage-percent');
    const fillEl = this.el.querySelector('.storage-progress-fill');
    const infoEl = this.el.querySelector('.storage-info');

    const sizeKB = (this.#syncSize / 1024).toFixed(1);
    const totalKB = (this.#syncTotal / 1024).toFixed(0);
    const percent = Math.round(this.#syncPercent);

    // 更新文本
    if (textEl) {
      textEl.textContent = `${t('syncStorage') || '同步'}: ${sizeKB}/${totalKB}KB`;
    }

    // 更新百分比（只在超过50%时显示）
    if (percentEl) {
      percentEl.textContent = percent >= 50 ? ` ${percent}%` : '';
    }

    // 更新进度条
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
    }

    // 更新颜色
    if (infoEl) {
      infoEl.classList.remove('warning', 'danger');
      if (percent >= 80) {
        infoEl.classList.add('danger');
      } else if (percent >= 50) {
        infoEl.classList.add('warning');
      }
    }

    // 接近限制时显示 Toast
    if (percent >= 80 && !this.#hasShownWarning) {
      this.#showWarning();
      this.#hasShownWarning = true;
    }
  }

  /**
   * 显示警告 Toast
   * @private
   */
  #showWarning() {
    // Toast is imported in app.js and available globally
    if (window.Toast && window.Toast.error) {
      window.Toast.error(t('storageAlmostFull') || '存储空间不足，请删除部分笔记');
    }
  }

  /**
   * 显示详情对话框
   * @private
   */
  async #showDetailDialog() {
    // 获取同步笔记信息
    const syncData = await chrome.storage.sync.get({ slidenote_notes: [] });
    const notes = syncData.slidenote_notes || [];

    const syncSize = JSON.stringify(notes).length;
    const syncPercent = Math.min(100, (syncSize / 8192) * 100);

    // 创建对话框
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal storage-modal';
    modal.style.width = '320px';

    modal.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">${t('storageDetail') || '存储空间'}</span>
        <button class="modal-close" data-action="close" aria-label="${t('close') || '关闭'}">×</button>
      </div>

      <div class="modal-body" style="max-height: none;">
        <div class="storage-detail-section">
          <div class="storage-detail-header">
            <span class="storage-detail-title">${t('syncNotes') || '笔记'}</span>
            <span class="storage-detail-percent">${Math.round(syncPercent)}%</span>
          </div>
          <div class="storage-detail-size">${(syncSize / 1024).toFixed(2)} KB / 8 KB</div>
          <div class="storage-detail-progress">
            <div class="storage-detail-fill ${syncPercent >= 80 ? 'danger' : syncPercent >= 50 ? 'warning' : ''}"
                 style="width: ${syncPercent}%"></div>
          </div>
          <div class="storage-detail-note">${t('syncNotesDesc') || '跨设备同步，可在所有设备上访问'}</div>
        </div>

        <div class="storage-detail-tip">
          💡 ${t('storageTip') || '建议只存储重要信息，避免超出同步限制。'}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-primary" data-action="close">
          ${t('gotIt') || '知道了'}
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    // 绑定关闭事件
    const close = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
    };

    modal.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', close);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  /**
   * 销毁组件
   */
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}
