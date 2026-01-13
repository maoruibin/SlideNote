/**
 * MarkdownEngine - Markdown 渲染引擎核心
 *
 * 采用插件化架构，支持动态注册语法插件
 *
 * @module markdown/MarkdownEngine
 * @example
 * import { createEngine } from './markdown/index.js';
 * const engine = createEngine();
 * const html = engine.process('# Hello\n**World**');
 */

/**
 * MarkdownEngine 引擎类
 * 职责：管理插件、协调解析和渲染
 */
export class MarkdownEngine {
  constructor() {
    /** @type {Map<string, Object>} */
    this.plugins = new Map();

    /** @type {Array<Object>} */
    this.sortedPlugins = [];

    /** @type {Object|null} */
    this.context = null;
  }

  /**
   * 注册单个插件
   * @param {Object} plugin - 插件对象
   * @returns {MarkdownEngine} 返回 this，支持链式调用
   */
  use(plugin) {
    if (!plugin.meta?.name) {
      throw new Error('Plugin must have a unique name in meta.name');
    }

    // 检查是否已注册
    if (this.plugins.has(plugin.meta.name)) {
      console.warn(`Plugin "${plugin.meta.name}" is already registered, skipping.`);
      return this;
    }

    // 注册插件
    this.plugins.set(plugin.meta.name, plugin);

    // 重新排序
    this._sortPlugins();

    return this;
  }

  /**
   * 批量注册插件
   * @param {Array<Object>} plugins - 插件数组
   * @returns {MarkdownEngine}
   */
  useAll(plugins) {
    plugins.forEach(p => this.use(p));
    return this;
  }

  /**
   * 解析 Markdown 文本为 Token 数组
   * @param {string} text - Markdown 文本
   * @returns {Array<Object>} 解析后的 Token 数组
   */
  parse(text) {
    if (!text) return [];

    // 按行分割，逐行处理
    const lines = text.split('\n');
    const tokens = [];

    // 代码块状态跟踪
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检查代码块
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // 进入代码块
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3);
          codeBlockContent = [];
        } else {
          // 退出代码块
          inCodeBlock = false;
          tokens.push({
            type: 'codeBlock',
            lang: codeBlockLang,
            content: codeBlockContent.join('\n'),
            raw: '```' + codeBlockLang + '\n' + codeBlockContent.join('\n') + '\n```',
          });
          codeBlockContent = [];
        }
        continue;
      }

      // 在代码块内，收集内容
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // 非代码块行，应用插件解析
      const lineTokens = this._parseLine(line, i);
      tokens.push(...lineTokens);
    }

    return tokens;
  }

  /**
   * 解析单行文本
   * @private
   * @param {string} line - 行文本
   * @param {number} lineIndex - 行号
   * @returns {Array<Object>} Token 数组
   */
  _parseLine(line, lineIndex) {
    const tokens = [];

    // 首先检查块级插件
    for (const plugin of this.sortedPlugins) {
      if (plugin.meta?.type !== 'block') continue;

      const patterns = plugin.syntax?.patterns || [];
      for (const pattern of patterns) {
        if (pattern.regex) {
          // 重置正则索引
          pattern.regex.lastIndex = 0;
          const match = pattern.regex.exec(line);
          if (match) {
            const token = plugin.createToken?.(match, { line, lineIndex });
            if (token) {
              tokens.push(token);
              return tokens; // 块级元素独占一行
            }
          }
        }
      }
    }

    // 如果没有块级匹配，解析行内元素
    return this._parseInline(line);
  }

  /**
   * 解析行内元素
   * @private
   * @param {string} text - 文本
   * @returns {Array<Object>} Token 数组
   */
  _parseInline(text) {
    if (!text) return [];

    const tokens = [];
    let remaining = text;
    let position = 0;

    // 按优先级从高到低匹配行内插件
    for (const plugin of this.sortedPlugins) {
      if (plugin.meta?.type !== 'inline') continue;

      const patterns = plugin.syntax?.patterns || [];
      for (const pattern of patterns) {
        if (!pattern.regex) continue;

        let match;
        // 重置正则索引
        pattern.regex.lastIndex = 0;

        while ((match = pattern.regex.exec(remaining)) !== null) {
          // 添加匹配前的纯文本
          if (match.index > position) {
            tokens.push({
              type: 'text',
              content: remaining.slice(position, match.index),
            });
          }

          // 创建匹配的 Token
          const token = plugin.createToken?.(match, { text });
          if (token) {
            tokens.push(token);
          }

          position = match.index + match[0].length;
        }
      }
    }

    // 添加剩余文本
    if (position < remaining.length) {
      tokens.push({
        type: 'text',
        content: remaining.slice(position),
      });
    }

    // 如果没有匹配任何 Token，返回纯文本
    if (tokens.length === 0) {
      return [{ type: 'text', content: text }];
    }

    return tokens;
  }

  /**
   * 渲染 Token 数组为 HTML
   * @param {Array<Object>|string} input - Token 数组或 Markdown 文本
   * @returns {string} HTML 字符串
   */
  render(input) {
    const tokens = typeof input === 'string' ? this.parse(input) : input;
    if (!tokens || tokens.length === 0) return '';

    return tokens
      .map(token => this._renderToken(token))
      .join('');
  }

  /**
   * 渲染单个 Token
   * @private
   * @param {Object} token - Token 对象
   * @returns {string} HTML 字符串
   */
  _renderToken(token) {
    // 查找对应的插件
    for (const plugin of this.sortedPlugins) {
      if (plugin.meta?.name === token.type || plugin.render) {
        const html = plugin.render?.(token, this._createRenderContext());
        if (html) return html;
      }
    }

    // 默认渲染：转义后输出纯文本
    return this._escapeHtml(token.content || '');
  }

  /**
   * 创建渲染上下文
   * @private
   * @returns {Object}
   */
  _createRenderContext() {
    return {
      escapeHtml: this._escapeHtml.bind(this),
      createElement: this._createElement.bind(this),
    };
  }

  /**
   * HTML 转义
   * @private
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  /**
   * 创建元素的辅助方法
   * @private
   * @param {string} tag - 标签名
   * @param {Object} props - 属性
   * @returns {string} HTML 字符串
   */
  _createElement(tag, props = {}) {
    const attrs = Object.entries(props)
      .filter(([k]) => k !== 'textContent' && k !== 'innerHTML' && k !== 'children')
      .map(([k, v]) => `${k}="${this._escapeHtml(String(v))}"`)
      .join(' ');

    const content = props.textContent || props.innerHTML || props.children || '';

    return `<${tag}${attrs ? ' ' + attrs : ''}>${content}</${tag}>`;
  }

  /**
   * 按优先级排序插件
   * @private
   */
  _sortPlugins() {
    this.sortedPlugins = Array.from(this.plugins.values()).sort(
      (a, b) => (b.meta?.priority || 0) - (a.meta?.priority || 0)
    );
  }

  /**
   * 一站式处理：直接将 Markdown 转换为 HTML
   * @param {string} markdown - Markdown 文本
   * @returns {string} HTML 字符串
   */
  process(markdown) {
    return this.render(this.parse(markdown));
  }
}

/**
 * 引擎版本号
 */
MarkdownEngine.VERSION = '1.0.0';

/**
 * 创建默认引擎实例
 * @returns {MarkdownEngine}
 */
export function createEngine() {
  return new MarkdownEngine();
}
