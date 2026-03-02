/**
 * ImportDialog - 导入备份对话框
 *
 * 支持点击选择文件和拖拽上传
 *
 * @example
 * const dialog = new ImportDialog({ store, bus });
 * dialog.show();
 */

import { t } from '../utils/i18n.js';
import { Toast } from './Toast.js';
import { ImportManager } from '../services/ImportManager.js';

export class ImportDialog {
  #overlay = null;
  #dialog = null;
  #fileInput = null;
  #handleEscape = null;
  #selectedFile = null;  // 保存选中的文件

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
    dialog.className = 'import-dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <span class="dialog-title">${t('importBackup') || '导入备份'}</span>
        <button class="dialog-close" data-action="close" aria-label="${t('close') || '关闭'}">×</button>
      </div>

      <div class="dialog-body">
        <div class="import-area" data-action="select-file" role="button" tabindex="0">
          <div class="import-icon">📁</div>
          <div class="import-text">
            <div class="import-title">${t('selectFile') || '选择备份文件'}</div>
            <div class="import-desc">.json 格式</div>
          </div>
        </div>
        <input type="file" accept=".json" class="file-input" style="display:none">

        <p class="import-tip">${t('importTip') || '导入前请先导出当前备份'}</p>

        <label class="import-option">
          <input type="checkbox" class="import-clear-checkbox" id="importClear">
          <span>${t('clearBeforeImport') || '清空现有数据后导入'}</span>
        </label>
        <p class="import-option-tip">${t('clearBeforeImportTip') || '勾选后将删除所有现有笔记，仅保留备份文件中的数据'}</p>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" data-action="close">
          ${t('cancel') || '取消'}
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    this.#overlay = overlay;
    this.#dialog = dialog;
    this.#fileInput = dialog.querySelector('.file-input');
    this.el = overlay;
  }

  /**
   * 绑定事件
   * @private
   */
  #bindEvents() {
    // 关闭按钮
    this.#dialog.querySelector('[data-action="close"]')?.addEventListener('click', () => this.hide());

    // 点击遮罩关闭
    this.#overlay.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.hide();
    });

    // 点击选择文件
    const selectArea = this.#dialog.querySelector('[data-action="select-file"]');
    selectArea?.addEventListener('click', () => {
      this.#fileInput?.click();
    });

    // 键盘支持
    selectArea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.#fileInput?.click();
      }
    });

    // 文件选择
    this.#fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.#doImport(e.target.files[0]);
      }
    });

    // 拖拽支持
    const dropArea = this.#dialog.querySelector('.import-area');
    if (dropArea) {
      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
      });
      dropArea.addEventListener('dragleave', (e) => {
        // 只在真正离开拖拽区域时移除样式
        if (e.target === dropArea) {
          dropArea.classList.remove('drag-over');
        }
      });
      dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) {
          this.#doImport(file);
        }
      });
    }

    // ESC 关闭
    this.#handleEscape = (e) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.#handleEscape);
  }

  /**
   * 执行导入
   * @param {File} file - 文件对象
   * @private
   */
  async #doImport(file) {
    // 检查是否选择了清空选项
    const shouldClear = this.#dialog.querySelector('.import-clear-checkbox')?.checked || false;

    // 如果选择了清空，显示确认对话框
    if (shouldClear) {
      const confirmed = await this.#showConfirmDialog();
      if (!confirmed) {
        // 用户取消，重置文件输入
        this.#fileInput.value = '';
        return;
      }
    }

    try {
      const importer = ImportManager.getInstance(this.store);

      // 如果需要清空，先执行清空
      if (shouldClear) {
        await this.#clearExistingNotes();
      }

      const result = await importer.importFromFile(file);

      if (result.success) {
        this.hide();
        // 刷新笔记列表
        this.bus?.emit('notes:refresh');

        if (result.count > 0) {
          // 显示成功提示（ImportManager 内部已显示 toast）
        } else {
          // 没有新笔记
          const tip = t('noNewNotesToImport') || '没有新笔记需要导入';
          Toast.info(tip);
        }
      } else {
        Toast.error((t('importFailed') || '导入失败') + ': ' + result.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      Toast.error((t('importFailed') || '导入失败') + ': ' + error.message);
    }
  }

  /**
   * 显示确认对话框
   * @returns {Promise<boolean>} 用户是否确认
   * @private
   */
  #showConfirmDialog() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '1001';

      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';
      dialog.innerHTML = `
        <div class="dialog-header">
          <span class="dialog-title">${t('confirmClear') || '确认清空'}</span>
        </div>
        <div class="dialog-body">
          <p>${t('confirmClearMessage') || '清空后将删除所有现有笔记，此操作无法撤销。是否继续？'}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" data-action="cancel">${t('cancel') || '取消'}</button>
          <button class="btn btn-primary" data-action="confirm">${t('confirm') || '确认'}</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.classList.add('show');
      });

      const cleanup = () => {
        overlay.classList.remove('show');
        setTimeout(() => {
          overlay.remove();
        }, 200);
      };

      dialog.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      dialog.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  /**
   * 清空现有笔记
   * @private
   */
  async #clearExistingNotes() {
    // 清空 sync storage 中的笔记
    await chrome.storage.sync.remove(['slidenote_notes']);
    // 清空 local storage 中的网页摘录
    await chrome.storage.local.remove(['slidenote_web_clippings']);
    // 重置 store 中的笔记
    this.store.state.notes = [];
    this.store.state.activeNoteId = null;
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
