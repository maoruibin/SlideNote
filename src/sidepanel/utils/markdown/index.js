/**
 * Markdown 工具统一入口
 *
 * 提供开箱即用的 Markdown 渲染功能
 *
 * @module markdown/index
 * @example
 * import { render, createEngine } from './utils/markdown/index.js';
 * const html = render('# Hello\n**World**');
 */

import { MarkdownEngine, createEngine as createEngineCore } from './MarkdownEngine.js';
import { defaultPlugins } from './plugins.js';

/**
 * 创建默认配置的引擎
 * @param {Object} options - 配置选项
 * @param {Array<Object>} options.plugins - 自定义插件列表（可选）
 * @returns {MarkdownEngine}
 */
export function createEngine(options) {
  const engine = createEngineCore();

  // 注册默认插件
  const plugins = (options && options.plugins) ? options.plugins : defaultPlugins;
  engine.useAll(plugins);

  return engine;
}

/**
 * 全局默认引擎实例（延迟初始化）
 */
let defaultEngineInstance = null;

/**
 * 获取默认引擎实例
 * @private
 */
function getDefaultEngine() {
  if (!defaultEngineInstance) {
    defaultEngineInstance = createEngine({});
  }
  return defaultEngineInstance;
}

/**
 * 渲染 Markdown 为 HTML（便捷函数）
 * @param {string} markdown - Markdown 文本
 * @returns {string} HTML 字符串
 *
 * @example
 * render('# Hello\n**World**')
 * // 返回: '<div class="md-h1"># Hello</div><div>**World**</div>'
 */
export function render(markdown) {
  return getDefaultEngine().process(markdown);
}

/**
 * 解析 Markdown 为 Token（便捷函数）
 * @param {string} markdown - Markdown 文本
 * @returns {Array} Token 数组
 */
export function parse(markdown) {
  return getDefaultEngine().parse(markdown);
}

/**
 * 去除 Markdown 语法符号，保留纯文本
 * 用于复制时生成可读性更好的纯文本
 * @param {string} markdown - Markdown 文本
 * @returns {string} 纯文本
 */
export function stripMarkdown(markdown) {
  return markdown
    // 标题
    .replace(/^#{1,3}\s+/gm, '')
    // 粗体
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    // 斜体
    .replace(/\*([^*]+?)\*/g, '$1')
    // 行内代码
    .replace(/`([^`]+?)`/g, '$1')
    // 代码块
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?|```/g, ''))
    // 链接
    .replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1')
    // 引用符号
    .replace(/^>\s*/gm, '')
    // 无序列表符号
    .replace(/^[\-\*]\s+/gm, '• ')
    // 有序列表符号
    .replace(/^\d+\.\s+/gm, '')
    // 分割线
    .replace(/^[\-\*]{3,}$/gm, '')
    // 清理多余空行
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 提取纯文本预览（用于列表预览）
 * 去除 Markdown 符号，截取指定长度
 * @param {string} markdown - Markdown 文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 预览文本
 */
export function getPreview(markdown, maxLength = 30) {
  const clean = stripMarkdown(markdown);
  // 移除换行
  const oneline = clean.replace(/\n/g, ' ');
  // 截取
  if (oneline.length <= maxLength) return oneline;
  return oneline.slice(0, maxLength) + '...';
}

/**
 * 检测文本中是否包含 Markdown 语法
 * @param {string} text - 待检测文本
 * @returns {boolean} 是否包含 Markdown 语法
 */
export function hasMarkdown(text) {
  const patterns = [
    /^#{1,3}\s/m,           // 标题
    /\*\*[^*]+\*\*/,        // 粗体
    /\*[^*]+\*/,            // 斜体（可能误判）
    /`[^`]+`/,              // 行内代码
    /```[\s\S]*?```/,        // 代码块
    /\[[^\]]+\]\([^\)]+\)/, // 链接
    /^>\s/m,                // 引用
    /^[\-\*]\s/m,           // 列表
    /^\d+\.\s/m,            // 有序列表
    /^[\-\*]{3,}$/m,         // 分割线
  ];

  return patterns.some(p => p.test(text));
}

// 导出核心类和插件
export { MarkdownEngine };
export { defaultPlugins };

// 导出类型定义（供 JSDoc 使用）
/**
 * @typedef {Object} SyntaxPlugin
 * @property {Object} meta - 插元元数据
 * @property {string} meta.name - 插件唯一标识
 * @property {string} meta.type - 类型：'inline' | 'block'
 * @property {number} meta.priority - 优先级（数字越大越优先）
 * @property {Object} syntax - 语法配置
 * @property {Array} syntax.patterns - 正则模式数组
 * @property {Function} createToken - Token 工厂函数
 * @property {Function} render - 渲染函数
 */

/**
 * @typedef {Object} Token
 * @property {string} type - Token 类型
 * @property {string} content - 内容
 */

/**
 * @typedef {Object} RenderContext
 * @property {Function} escapeHtml - HTML 转义函数
 * @property {Function} createElement - 创建元素函数
 */
