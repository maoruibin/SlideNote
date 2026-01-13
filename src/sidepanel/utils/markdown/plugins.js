/**
 * Markdown 语法插件集
 *
 * 包含 9 种常用 Markdown 语法：
 * - 标题 (H1-H3)
 * - 粗体 (**text**)
 * - 斜体 (*text*)
 * - 行内代码 (`code`)
 * - 代码块 (```code```)
 * - 链接 ([text](url))
 * - 列表 (- item / 1. item)
 * - 引用 (> text)
 * - 分割线 (---)
 *
 * @module markdown/plugins
 */

/**
 * 标题插件 (H1-H3)
 * 语法: # 标题, ## 标题, ### 标题
 */
export const HeadingPlugin = {
  meta: {
    name: 'heading',
    type: 'block',
    priority: 100,
  },
  syntax: {
    patterns: [
      { regex: /^###\s+(.+)$/ },
      { regex: /^##\s+(.+)$/ },
      { regex: /^#\s+(.+)$/ },
    ],
    trigger: '#',
  },
  createToken(match) {
    const level = match[0].match(/^#+/)[0].length;
    return {
      type: 'heading',
      level,
      content: match[1],
      raw: match[0],
    };
  },
  render(token, ctx) {
    const sizes = { 1: 'md-h1', 2: 'md-h2', 3: 'md-h3' };
    const delimiter = '#'.repeat(token.level) + ' ';
    return `<div class="${sizes[token.level]}">
      <span class="md-delimiter">${delimiter}</span>${ctx.escapeHtml(token.content)}
    </div>`;
  },
};

/**
 * 粗体插件
 * 语法: **粗体**
 */
export const BoldPlugin = {
  meta: {
    name: 'bold',
    type: 'inline',
    priority: 30,
  },
  syntax: {
    patterns: [
      { regex: /\*\*([^*]+?)\*\*(?!\*)/g },
    ],
    trigger: '*',
  },
  createToken(match) {
    return {
      type: 'bold',
      content: match[1],
      delimiters: ['**', '**'],
    };
  },
  render(token, ctx) {
    return `<span class="md-bold">
      <span class="md-delimiter">${token.delimiters[0]}</span>${ctx.escapeHtml(token.content)}<span class="md-delimiter">${token.delimiters[1]}</span>
    </span>`;
  },
};

/**
 * 斜体插件
 * 语法: *斜体* (不匹配已匹配粗体的)
 */
export const ItalicPlugin = {
  meta: {
    name: 'italic',
    type: 'inline',
    priority: 20,
  },
  syntax: {
    patterns: [
      { regex: /(?<!\*)\*([^*]+?)\*(?!\*)/g },
    ],
    trigger: '*',
  },
  createToken(match) {
    return {
      type: 'italic',
      content: match[1],
      delimiters: ['*', '*'],
    };
  },
  render(token, ctx) {
    return `<span class="md-italic">
      <span class="md-delimiter">${token.delimiters[0]}</span>${ctx.escapeHtml(token.content)}<span class="md-delimiter">${token.delimiters[1]}</span>
    </span>`;
  },
};

/**
 * 行内代码插件
 * 语法: `代码`
 */
export const InlineCodePlugin = {
  meta: {
    name: 'inlineCode',
    type: 'inline',
    priority: 40,
  },
  syntax: {
    patterns: [
      { regex: /`([^`\n]+?)`/g },
    ],
    trigger: '`',
  },
  createToken(match) {
    return {
      type: 'inlineCode',
      content: match[1],
    };
  },
  render(token, ctx) {
    return `<code class="md-inline-code">${ctx.escapeHtml(token.content)}</code>`;
  },
};

/**
 * 代码块插件
 * 语法: ```代码```
 */
export const CodeBlockPlugin = {
  meta: {
    name: 'codeBlock',
    type: 'block',
    priority: 90,
  },
  syntax: {
    patterns: [
      { regex: /```(\w*)\n([\s\S]*?)```/ },
    ],
    trigger: '`',
  },
  createToken(match) {
    return {
      type: 'codeBlock',
      lang: match[1],
      content: match[2],
    };
  },
  render(token, ctx) {
    return `<pre class="md-code-block"><code>${ctx.escapeHtml(token.content)}</code></pre>`;
  },
};

/**
 * 链接插件
 * 语法: [文本](url)
 */
export const LinkPlugin = {
  meta: {
    name: 'link',
    type: 'inline',
    priority: 50,
  },
  syntax: {
    patterns: [
      { regex: /\[([^\]]+?)\]\(([^\)]+?)\)/g },
    ],
    trigger: '[',
  },
  createToken(match) {
    return {
      type: 'link',
      content: match[1],
      url: match[2],
    };
  },
  render(token, ctx) {
    return `<a href="${ctx.escapeHtml(token.url)}" class="md-link" target="_blank" rel="noopener">${ctx.escapeHtml(token.content)}</a><span class="md-delimiter">(${ctx.escapeHtml(token.url)})</span>`;
  },
};

/**
 * 列表插件 (无序/有序)
 * 语法: - 项目 或 1. 项目
 */
export const ListPlugin = {
  meta: {
    name: 'list',
    type: 'block',
    priority: 70,
  },
  syntax: {
    patterns: [
      { regex: /^[\-\*]\s+(.+)$/ },
      { regex: /^\d+\.\s+(.+)$/ },
    ],
    trigger: '-',
  },
  createToken(match) {
    const isOrdered = /^\d/.test(match[0]);
    const marker = isOrdered ? match[0].match(/^(\d+)\./)[1] : '•';
    return {
      type: isOrdered ? 'orderedList' : 'unorderedList',
      content: match[1],
      marker,
    };
  },
  render(token, ctx) {
    if (token.type === 'orderedList') {
      return `<div class="md-ordered-item">
        <span class="md-ordered-num md-delimiter">${token.marker}.</span>${ctx.escapeHtml(token.content)}
      </div>`;
    }
    return `<div class="md-list-item">
      <span class="md-delimiter"></span>${ctx.escapeHtml(token.content)}
    </div>`;
  },
};

/**
 * 引用插件
 * 语法: > 引用
 */
export const BlockquotePlugin = {
  meta: {
    name: 'blockquote',
    type: 'block',
    priority: 80,
  },
  syntax: {
    patterns: [
      { regex: /^>\s*(.+)$/ },
    ],
    trigger: '>',
  },
  createToken(match) {
    return {
      type: 'blockquote',
      content: match[1],
    };
  },
  render(token, ctx) {
    return `<div class="md-blockquote">
      <span class="md-delimiter"> </span>${ctx.escapeHtml(token.content)}
    </div>`;
  },
};

/**
 * 分割线插件
 * 语法: ---
 */
export const HrPlugin = {
  meta: {
    name: 'hr',
    type: 'block',
    priority: 60,
  },
  syntax: {
    patterns: [
      { regex: /^[\-\*]{3,}$/ },
    ],
    trigger: '-',
  },
  createToken(match) {
    return {
      type: 'hr',
      content: '',
    };
  },
  render() {
    return `<hr class="md-hr">`;
  },
};

/**
 * 默认插件集合导出
 */
export const defaultPlugins = [
  HeadingPlugin,
  CodeBlockPlugin,
  BlockquotePlugin,
  ListPlugin,
  HrPlugin,
  LinkPlugin,
  InlineCodePlugin,
  BoldPlugin,
  ItalicPlugin,
];
