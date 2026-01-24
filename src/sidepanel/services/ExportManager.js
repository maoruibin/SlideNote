/**
 * ExportManager - 导出管理器
 *
 * 提供导出笔记为 JSON 和 Markdown 格式的功能
 * 单例模式
 *
 * @example
 * const exporter = ExportManager.getInstance(store);
 * await exporter.exportJSON();
 * await exporter.exportMarkdown();
 */

import { t } from '../utils/i18n.js';

export class ExportManager {
  static #instance = null;

  constructor(store) {
    this.store = store;
    this.bus = store._localChanges ? null : store; // Store 本身是 EventEmitter
  }

  /**
   * 获取单例实例
   * @param {Store} store - Store 实例
   * @returns {ExportManager}
   */
  static getInstance(store) {
    if (!ExportManager.#instance) {
      ExportManager.#instance = new ExportManager(store);
    }
    return ExportManager.#instance;
  }

  /**
   * 重置单例（用于测试或重新初始化）
   */
  static resetInstance() {
    ExportManager.#instance = null;
  }

  /**
   * 导出为 JSON 格式
   * @returns {Promise<boolean>} 是否成功
   */
  async exportJSON() {
    const notes = this.store.state.notes || [];

    if (notes.length === 0) {
      this._showToast('info', t('noNotesToExport') || '没有笔记可导出');
      return false;
    }

    try {
      const manifest = chrome.runtime.getManifest();
      const data = {
        _meta: {
          version: manifest.version,
          exportedAt: new Date().toISOString(),
          exportedBy: 'SlideNote',
        },
        data: {
          notes,
          activeNoteId: this.store.state.activeNoteId,
        },
      };

      const json = JSON.stringify(data, null, 2);
      const filename = this._getFilename('json');
      this._download(json, filename, 'application/json');

      this._showToast('success', t('exportSuccess') || '导出成功');
      return true;
    } catch (error) {
      console.error('Export JSON failed:', error);
      this._showToast('error', (t('exportFailed') || '导出失败') + ': ' + error.message);
      return false;
    }
  }

  /**
   * 导出为 Markdown 格式
   * @returns {Promise<boolean>} 是否成功
   */
  async exportMarkdown() {
    const notes = this.store.state.notes || [];

    if (notes.length === 0) {
      this._showToast('info', t('noNotesToExport') || '没有笔记可导出');
      return false;
    }

    try {
      const date = new Date().toLocaleDateString('zh-CN');
      let content = `# SlideNote Notes\n\n> ${t('exportedAt') || '导出时间'}：${date}\n> ${t('noteCount') || '笔记数量'}：${notes.length}\n\n---\n\n`;

      for (const note of notes) {
        const title = note.title || t('unnamedNote') || '无标题笔记';
        const created = new Date(note.createdAt).toLocaleDateString('zh-CN');

        content += `## ${title}\n\n> ${t('lastEdited') || '最后编辑'}：${created}\n\n${(note.content || '')}\n\n---\n\n`;
      }

      const filename = this._getFilename('md');
      this._download(content, filename, 'text/markdown');

      this._showToast('success', t('exportSuccess') || '导出成功');
      return true;
    } catch (error) {
      console.error('Export Markdown failed:', error);
      this._showToast('error', (t('exportFailed') || '导出失败') + ': ' + error.message);
      return false;
    }
  }

  /**
   * 触发浏览器下载
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME 类型
   * @private
   */
  _download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * 生成文件名
   * @param {string} ext - 文件扩展名
   * @returns {string} 文件名
   * @private
   */
  _getFilename(ext) {
    const date = new Date().toISOString().split('T')[0];
    const prefix = ext === 'json' ? 'SlideNote-Backup' : 'SlideNote-Notes';
    return `${prefix}-${date}.${ext}`;
  }

  /**
   * 显示提示消息
   * @param {string} type - 消息类型: 'success', 'error', 'info'
   * @param {string} message - 消息内容
   * @private
   */
  _showToast(type, message) {
    // 通过全局 bus 发送 toast 事件
    if (window.__SLIDENOTE__?.bus) {
      window.__SLIDENOTE__.bus.emit('toast:show', { type, message });
    }
  }
}
