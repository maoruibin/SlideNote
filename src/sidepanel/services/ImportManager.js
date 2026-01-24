/**
 * ImportManager - 导入管理器
 *
 * 提供从备份文件导入笔记的功能
 * 单例模式，使用简单合并策略（按 ID 去重）
 *
 * @example
 * const importer = ImportManager.getInstance(store);
 * const result = await importer.importFromFile(file);
 */

import { t } from '../utils/i18n.js';

export class ImportManager {
  static #instance = null;

  constructor(store) {
    this.store = store;
  }

  /**
   * 获取单例实例
   * @param {Store} store - Store 实例
   * @returns {ImportManager}
   */
  static getInstance(store) {
    if (!ImportManager.#instance) {
      ImportManager.#instance = new ImportManager(store);
    }
    return ImportManager.#instance;
  }

  /**
   * 重置单例（用于测试或重新初始化）
   */
  static resetInstance() {
    ImportManager.#instance = null;
  }

  /**
   * 从文件导入
   * @param {File} file - 文件对象
   * @returns {Promise<Object>} 导入结果 { success: boolean, count?: number, error?: string }
   */
  async importFromFile(file) {
    try {
      // 验证文件类型
      if (!file.name.endsWith('.json')) {
        return {
          success: false,
          error: t('invalidFileType') || '请选择 JSON 格式的备份文件'
        };
      }

      // 读取并解析文件
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证格式
      const validation = this._validateFormat(data);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || (t('invalidBackupFormat') || '无效的备份文件格式')
        };
      }

      // 执行导入
      const result = await this._doImport(data.data.notes);

      return result;
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: error.message || (t('importFailed') || '导入失败')
      };
    }
  }

  /**
   * 验证文件格式
   * @param {Object} data - 解析后的数据
   * @returns {Object} { valid: boolean, error?: string }
   * @private
   */
  _validateFormat(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: '数据格式无效' };
    }

    if (!data._meta || !data.data) {
      return { valid: false, error: '缺少必要的元数据或数据字段' };
    }

    if (!Array.isArray(data.data.notes)) {
      return { valid: false, error: '笔记数据格式无效' };
    }

    // 验证笔记结构
    for (const note of data.data.notes) {
      if (!note.id) {
        return { valid: false, error: '笔记缺少 ID 字段' };
      }
    }

    return { valid: true };
  }

  /**
   * 执行导入（简单合并模式：按 ID 去重，只添加新笔记）
   * @param {Array} importedNotes - 导入的笔记数组
   * @returns {Promise<Object>} { success: boolean, count: number, skipped: number }
   * @private
   */
  async _doImport(importedNotes) {
    const existingNotes = this.store.state.notes || [];
    const existingIds = new Set(existingNotes.map(n => n.id));

    // 过滤出新笔记（ID 不存在于当前笔记中）
    const newNotes = importedNotes.filter(n => !existingIds.has(n.id));

    if (newNotes.length === 0) {
      this._showToast('info', t('noNewNotesToImport') || '没有新笔记需要导入');
      return {
        success: true,
        count: 0,
        skipped: importedNotes.length
      };
    }

    // 规范化笔记数据，确保所有必需字段都存在
    const normalizedNotes = newNotes.map(note => ({
      id: note.id,
      title: note.title ?? '',
      content: note.content ?? '',
      createdAt: note.createdAt || Date.now(),
      updatedAt: note.updatedAt || Date.now(),
      order: note.order ?? 0,
    }));

    // 使用批量导入方法
    await this.store.importNotes(normalizedNotes);

    this._showToast(
      'success',
      (t('importSuccess') || '已导入 $1$ 条笔记').replace('$1$', newNotes.length)
    );

    return {
      success: true,
      count: newNotes.length,
      skipped: importedNotes.length - newNotes.length
    };
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
