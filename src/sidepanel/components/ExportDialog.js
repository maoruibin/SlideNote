/**
 * ExportDialog - 导出格式选择对话框
 *
 * 让用户选择导出格式（JSON 或 Markdown）
 *
 * @example
 * const dialog = new ExportDialog({ store, bus });
 * dialog.show();
 */

import { t } from '../utils/i18n.js';
import { Toast } from './Toast.js';
import { ExportManager } from '../services/ExportManager.js';

export class ExportDialog {
  #overlay = null;
  #dialog = null;
  #selectedFormat = 'json';
  #handleEscape = null;

  constructor(props = {}) {
    this.props = props;
    this.store = props.store;
    this.bus = props.bus;
    this.el = null;
  }

  /**
   * 显示对话框
   */
  show() {
    if (this.el) return;

    this.#render();
    document.body.appendChild(this.el);
    this.#bindEvents();

    // 进入动画
    requestAnimationFrame(() => {
      this.#overlay.classList.add('show');
    });
  }

  /**
   * 渲染对话框
   * @private
   */
  #render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'export-dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <span class="dialog-title">${t('exportNotes') || '导出笔记'}</span>
        <button class="dialog-close" data-action="close" aria-label="${t('close') || '关闭'}">×</button>
      </div>

      <div class="dialog-body">
        <div class="export-formats">
          <div class="format-option ${this.#selectedFormat === 'json' ? 'selected' : ''}"
               data-format="json" data-action="select-format" role="button" tabindex="0">
            <div class="format-icon">📦</div>
            <div class="format-info">
              <div class="format-name">JSON</div>
              <div class="format-desc">${t('formatJSONDesc') || '完整备份，包含元数据'}</div>
            </div>
          </div>

          <div class="format-option ${this.#selectedFormat === 'markdown' ? 'selected' : ''}"
               data-format="markdown" data-action="select-format" role="button" tabindex="0">
            <div class="format-icon">📝</div>
            <div class="format-info">
              <div class="format-name">Markdown</div>
              <div class="format-desc">${t('formatMDDesc') || '可读性强，适合查看'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" data-action="close">
          ${t('cancel') || '取消'}
        </button>
        <button class="btn btn-primary" data-action="export">
          ${t('export') || '导出'}
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    this.#overlay = overlay;
    this.#dialog = dialog;
    this.el = overlay;
  }

  /**
   * 绑定事件
   * @private
   */
  #bindEvents() {
    // 点击关闭按钮
    this.#dialog.querySelector('[data-action="close"]')?.addEventListener('click', () => this.hide());

    // 点击遮罩关闭
    this.#overlay.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.hide();
    });

    // 选择格式
    this.#dialog.querySelectorAll('[data-action="select-format"]').forEach(el => {
      const handleClick = () => {
        this.#selectedFormat = el.dataset.format;
        this.#updateSelection();
      };
      el.addEventListener('click', handleClick);

      // 键盘支持
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      });
    });

    // 确认导出
    this.#dialog.querySelector('[data-action="export"]')?.addEventListener('click', () => {
      this.#doExport();
    });

    // ESC 关闭
    this.#handleEscape = (e) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.#handleEscape);
  }

  /**
   * 更新格式选择状态
   * @private
   */
  #updateSelection() {
    this.#dialog.querySelectorAll('.format-option').forEach(el => {
      if (el.dataset.format === this.#selectedFormat) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  /**
   * 执行导出
   * @private
   */
  async #doExport() {
    try {
      const exporter = ExportManager.getInstance(this.store);

      let success = false;
      if (this.#selectedFormat === 'json') {
        success = await exporter.exportJSON();
      } else {
        success = await exporter.exportMarkdown();
      }

      if (success) {
        this.hide();
      }
    } catch (error) {
      console.error('Export failed:', error);
      Toast.error((t('exportFailed') || '导出失败') + ': ' + error.message);
    }
  }

  /**
   * 隐藏对话框
   */
  hide() {
    if (!this.el) return;

    this.#overlay.classList.remove('show');

    if (this.#handleEscape) {
      document.removeEventListener('keydown', this.#handleEscape);
      this.#handleEscape = null;
    }

    setTimeout(() => {
      this.el?.remove();
      this.el = null;
    }, 200);
  }

  /**
   * 销毁对话框
   */
  destroy() {
    this.hide();
  }
}
