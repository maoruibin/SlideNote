/**
 * Markdown 渲染工具 - 使用 marked.js
 *
 * 提供简洁、稳定的 Markdown 渲染能力
 *
 * @module utils/marked
 */

import { marked } from 'marked';

/**
 * 配置 marked
 */
marked.setOptions({
  breaks: true,      // 回车换行
  gfm: true,         // GitHub Flavored Markdown
  mangle: false,     // 不转义邮箱
  headerIds: false,  // 不生成 id
});

/**
 * 渲染 Markdown 为 HTML
 * @param {string} markdown - Markdown 文本
 * @returns {string} HTML 字符串
 */
export function render(markdown) {
  if (!markdown) return '';
  return marked(markdown);
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
    /\*[^*]+\*/,            // 斜体
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
