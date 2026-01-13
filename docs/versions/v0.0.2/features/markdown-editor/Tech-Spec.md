# SlideNote Markdown 编辑器技术方案文档 v2.0

> **版本**: v0.0.2
> **文档类型**: 技术方案（插件化架构）
> **创建日期**: 2025-01-13
> **状态**: 设计中

---

## 文档信息

| 项目 | 内容 |
|------|------|
| 功能名称 | Markdown 编辑器 |
| 版本号 | v0.0.2 |
| 依赖版本 | SlideNote v0.0.1+ |
| 技术栈 | Vanilla JS + Chrome Extension API |

---

## 一、架构原则

### 1.1 设计目标

| 目标 | 说明 | 实现方式 |
|------|------|----------|
| **扩展性** | 新增语法无需修改核心代码 | 插件化架构 + 配置驱动 |
| **稳定性** | 核心功能不受新功能影响 | 隔离变更、向后兼容 |
| **简洁性** | 代码清晰、易维护 | 统一接口、约定优于配置 |
| **性能** | 大文本渲染不卡顿 | 增量解析、虚拟化 |

### 1.2 架构演进

```
v1.0 硬编码架构（已废弃）：
新增语法 → 修改 Parser → 修改 Renderer → 修改 CSS
            ↓                ↓               ↓
         风险高           风险高          风险高

v2.0 插件化架构（当前）：
新增语法 → 注册插件 → 配置规则 → 自动集成
            ↓               ↓              ↓
         零风险          零风险         零风险
```

---

## 二、核心架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MarkdownEngine                                  │
│                      (核心引擎 - 单例)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      PluginRegistry                              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ Heading │ │  Bold   │ │ Italic  │ │  Code   │ │  Link   │ ...│   │
│  │  │ Plugin  │ │ Plugin  │ │ Plugin  │ │ Plugin  │ │ Plugin  │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       TokenPipeline                               │   │
│  │   原始文本 → 词法分析 → 语法分析 → AST → 渲染树 → HTML           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       RendererChain                               │   │
│  │   Token → StyleResolver → ElementBuilder → HTML                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

扩展方式：
┌─────────────┐       注册        ┌─────────────────────────────────┐
│ 新增语法插件 │ ───────────────► │ PluginRegistry.get(name)        │
│ TablePlugin │                  │ → 自动集成到解析/渲染流程        │
└─────────────┘                  └─────────────────────────────────┘
```

### 2.2 插件规范

每个 Markdown 语法插件必须实现统一的接口：

```javascript
/**
 * Markdown 语法插件接口
 * @interface SyntaxPlugin
 */
const SyntaxPlugin = {
  /**
   * 插件元数据
   * @type {PluginMetadata}
   */
  meta: {
    name: 'bold',           // 插件唯一标识
    type: 'inline',         // 'inline' | 'block' | 'container'
    priority: 10,           // 解析优先级（数字越大越优先）
    version: '1.0.0',       // 插件版本
  },

  /**
   * 语法配置
   * @type {SyntaxConfig}
   */
  syntax: {
    // 正则模式（支持多模式）
    patterns: [
      {
        // 简单模式
        regex: /\*\*([^*]+?)\*\*/g,
        // 或函数模式（复杂场景）
        match: (text, context) => { /* ... */ }
      }
    ],
    // 触发字符（用于快捷输入提示）
    trigger: '*',
  },

  /**
   * Token 工厂
   * @param {MatchResult} match - 正则匹配结果
   * @param {ParseContext} context - 解析上下文
   * @returns {Token}
   */
  createToken(match, context) {
    return {
      type: 'bold',
      content: match[1],
      raw: match[0],
    };
  },

  /**
   * 渲染函数
   * @param {Token} token - Token 对象
   * @param {RenderContext} context - 渲染上下文
   * @returns {HTMLElement|string}
   */
  render(token, context) {
    const span = document.createElement('span');
    span.className = 'md-bold';
    span.innerHTML = `
      <span class="md-delimiter">**</span>
      ${context.escapeHtml(token.content)}
      <span class="md-delimiter">**</span>
    `;
    return span;
  },
};
```

### 2.3 核心类设计

```javascript
/**
 * Markdown 引擎核心
 * 职责：管理插件、协调解析和渲染
 */
export class MarkdownEngine {
  constructor() {
    /** @type {Map<string, SyntaxPlugin>} */
    this.plugins = new Map();

    /** @type {TokenPipeline} */
    this.pipeline = new TokenPipeline();

    /** @type {RendererChain} */
    this.renderer = new RendererChain();

    /** @type {StyleTheme} */
    this.theme = new StyleTheme();
  }

  /**
   * 注册插件
   * @param {SyntaxPlugin} plugin
   * @returns {this}
   */
  use(plugin) {
    if (!plugin.meta?.name) {
      throw new Error('Plugin must have a unique name');
    }

    this.plugins.set(plugin.meta.name, plugin);

    // 按优先级排序
    this._sortPlugins();

    return this;
  }

  /**
   * 批量注册插件
   * @param {SyntaxPlugin[]} plugins
   */
  useAll(plugins) {
    plugins.forEach(p => this.use(p));
    return this;
  }

  /**
   * 解析 Markdown
   * @param {string} text
   * @returns {AST}
   */
  parse(text) {
    return this.pipeline.process(text, Array.from(this.plugins.values()));
  }

  /**
   * 渲染为 HTML
   * @param {AST|string} input
   * @returns {string}
   */
  render(input) {
    const ast = typeof input === 'string' ? this.parse(input) : input;
    return this.renderer.render(ast, this.theme);
  }

  /**
   * 一站式：直接转换 Markdown 为 HTML
   * @param {string} markdown
   * @returns {string}
   */
  process(markdown) {
    return this.render(this.parse(markdown));
  }

  /**
   * 按优先级排序插件
   * @private
   */
  _sortPlugins() {
    // 内联插件优先级高，块级优先级低
    const sorted = Array.from(this.plugins.values())
      .sort((a, b) => (b.meta?.priority || 0) - (a.meta?.priority || 0));

    this.plugins = new Map(sorted.map(p => [p.meta.name, p]));
  }
}
```

---

## 三、内置插件

### 3.1 插件列表

| 插件 | 类型 | 优先级 | 语法 |
|------|------|--------|------|
| `heading` | block | 100 | `# 标题` |
| `codeBlock` | block | 90 | ` ```代码``` ` |
| `blockquote` | block | 80 | `> 引用` |
| `list` | block | 70 | `- 项目` |
| `hr` | block | 60 | `---` |
| `link` | inline | 50 | `[文本](url)` |
| `inlineCode` | inline | 40 | `` `代码` `` |
| `bold` | inline | 30 | `**粗体**` |
| `italic` | inline | 20 | `*斜体*` |

### 3.2 插件示例代码

```javascript
/**
 * 粗体插件
 * @file plugins/bold.js
 */
export const BoldPlugin = {
  meta: {
    name: 'bold',
    type: 'inline',
    priority: 30,
  },

  syntax: {
    patterns: [
      {
        // **粗体**
        regex: /\*\*([^*]+?)\*\*(?!\*)/g,
      },
      {
        // __粗体__（可选）
        regex: /__([^_]+?)__(?!_)/g,
      },
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

  render(token, context) {
    return context.createElement('span', {
      className: 'md-bold',
      innerHTML: `
        <span class="md-delimiter">${token.delimiters[0]}</span>
        ${context.escapeHtml(token.content)}
        <span class="md-delimiter">${token.delimiters[1]}</span>
      `,
    });
  },
};

/**
 * 列表插件（支持嵌套）
 * @file plugins/list.js
 */
export const ListPlugin = {
  meta: {
    name: 'list',
    type: 'block',
    priority: 70,
  },

  syntax: {
    patterns: [
      {
        // 无序：- 或 *
        regex: /^([\-\*])\s+(.+)$/gm,
      },
      {
        // 有序：1.
        regex: /^(\d+)\.\s+(.+)$/gm,
      },
    ],
    trigger: '-',
  },

  createToken(match, context) {
    const isOrdered = /^\d+$/.test(match[1]);
    return {
      type: isOrdered ? 'orderedList' : 'unorderedList',
      content: match[2],
      marker: match[1],
      indent: context.indent || 0,
    };
  },

  render(token, context) {
    const item = context.createElement('div', {
      className: token.type === 'orderedList'
        ? 'md-ordered-item'
        : 'md-list-item',
    });

    // 列表标记（半透明）
    const marker = context.createElement('span', {
      className: 'md-delimiter',
      textContent: token.type === 'orderedList'
        ? `${token.marker}. `
        : '',
    });

    // 如果是无序列表，使用 CSS 伪元素
    if (token.type === 'unorderedList') {
      item.innerHTML = `
        <span class="md-delimiter"></span>
        ${context.escapeHtml(token.content)}
      `;
    } else {
      item.innerHTML = `
        <span class="md-ordered-num md-delimiter">${token.marker}.</span>
        ${context.escapeHtml(token.content)}
      `;
    }

    return item;
  },
};
```

### 3.3 未来扩展示例

假设 v0.0.3 需要添加表格支持：

```javascript
/**
 * 表格插件
 * @file plugins/table.js
 * 新增语法无需修改核心代码
 */
export const TablePlugin = {
  meta: {
    name: 'table',
    type: 'block',
    priority: 75, // 在列表之前、引用之后
  },

  syntax: {
    patterns: [
      {
        // 表格检测（简化版）
        regex: /^\|(.+)\|$\n^\|[-:|\s]+\|$/gm,
      },
    ],
    trigger: '|',
  },

  createToken(match, context) {
    // 解析表格行和列
    const headerRow = match[1].split('|').map(s => s.trim()).filter(Boolean);
    return {
      type: 'table',
      headers: headerRow,
      rows: [], // 解析后续行
    };
  },

  render(token, context) {
    const table = context.createElement('table', {
      className: 'md-table',
    });

    // 表头
    const thead = context.createElement('thead');
    const tr = context.createElement('tr');
    token.headers.forEach(h => {
      const th = context.createElement('th', {
        textContent: h,
      });
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    return table;
  },
};

// 注册表格插件
engine.use(TablePlugin);
```

---

## 四、解析流程

### 4.1 Token Pipeline

```javascript
/**
 * Token 处理管道
 * 职责：协调多个插件进行增量解析
 */
export class TokenPipeline {
  constructor() {
    /** @type {ProcessingStage[]} */
    this.stages = [];
    this._setupDefaultStages();
  }

  /**
   * 处理文本为 AST
   * @param {string} text - 原始 Markdown
   * @param {SyntaxPlugin[]} plugins - 已排序的插件列表
   * @returns {AST}
   */
  process(text, plugins) {
    let context = new ParseContext(text);

    // 阶段1：预处理（转义字符处理）
    context = this._runStage('preprocess', context, plugins);

    // 阶段2：词法分析（分块）
    context = this._runStage('tokenize', context, plugins);

    // 阶段3：语法分析（嵌套处理）
    context = this._runStage('parse', context, plugins);

    // 阶段4：后处理（优化）
    context = this._runStage('postprocess', context, plugins);

    return context.ast;
  }

  /**
   * 运行处理阶段
   * @private
   */
  _runStage(stageName, context, plugins) {
    for (const plugin of plugins) {
      const handler = plugin[stageName];
      if (typeof handler === 'function') {
        context = handler(context) || context;
      }
    }
    return context;
  }

  /**
   * 设置默认阶段
   * @private
   */
  _setupDefaultStages() {
    // 内置阶段
    this.stages = ['preprocess', 'tokenize', 'parse', 'postprocess'];
  }
}

/**
 * 解析上下文
 * 携带解析过程中的状态和辅助方法
 */
export class ParseContext {
  constructor(input) {
    /** @type {string} */
    this.input = input;

    /** @type {AST} */
    this.ast = { type: 'root', children: [] };

    /** @type {Token[]} */
    this.tokens = [];

    /** @type {Map} */
    this.metadata = new Map();

    /** @type {number} */
    this.position = 0;

    /** @type {number} */
    this.indent = 0;
  }

  /**
   * 添加 Token
   */
  addToken(token) {
    token.index = this.tokens.length;
    this.tokens.push(token);
    return token;
  }

  /**
   * 获取当前行
   */
  getCurrentLine() {
    return this.input.split('\n')[this.position];
  }

  /**
   * 创建子上下文（用于嵌套解析）
   */
  createChild() {
    const child = new ParseContext(this.input.slice(this.position));
    child.indent = this.indent + 1;
    return child;
  }
}
```

### 4.2 增量解析（性能优化）

```javascript
/**
 * 增量解析器
 * 只重新解析变化的部分
 */
export class IncrementalParser {
  constructor() {
    /** @type {Map<string, CachedResult>} */
    this.cache = new Map();
  }

  /**
   * 增量解析
   * @param {string} fullText - 完整文本
   * @param {Change} change - 变更信息 {start, end, text}
   * @returns {AST}
   */
  parse(fullText, change) {
    // 1. 确定受影响的行范围
    const affectedLines = this._getAffectedLines(fullText, change);

    // 2. 只重新解析受影响的行
    const partialAST = this._parseRange(fullText, affectedLines);

    // 3. 合并到现有 AST
    return this._mergeAST(this.cache.get('last'), partialAST, affectedLines);
  }

  /**
   * 获取受影响的行范围
   * @private
   */
  _getAffectedLines(text, change) {
    const before = text.slice(0, change.start);
    const after = text.slice(change.end);

    const startLine = before.split('\n').length - 1;
    const endLine = startLine + after.split('\n').length;

    return { start: Math.max(0, startLine - 1), end: endLine + 1 };
  }

  /**
   * 解析指定范围
   * @private
   */
  _parseRange(text, range) {
    const lines = text.split('\n').slice(range.start, range.end);
    return MarkdownEngine.default.parse(lines.join('\n'));
  }

  /**
   * 合并 AST
   * @private
   */
  _mergeAST(existing, partial, range) {
    // 合并逻辑...
    return { ...existing, children: mergedChildren };
  }

  /**
   * 清除缓存
   */
  invalidate() {
    this.cache.clear();
  }
}
```

---

## 五、渲染流程

### 5.1 RendererChain

```javascript
/**
 * 渲染链
 * 支持自定义渲染器和中间件
 */
export class RendererChain {
  constructor() {
    /** @type {RenderMiddleware[]} */
    this.middlewares = [];

    /** @type {Map<string, Function>} */
    this.renderers = new Map();
  }

  /**
   * 添加中间件
   * @param {RenderMiddleware} middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * 注册渲染器
   * @param {string} tokenType
   * @param {Function} renderer
   */
  register(tokenType, renderer) {
    this.renderers.set(tokenType, renderer);
    return this;
  }

  /**
   * 渲染 AST
   * @param {AST} ast
   * @param {StyleTheme} theme
   * @returns {string}
   */
  render(ast, theme) {
    let context = new RenderContext({ theme, renderers: this.renderers });

    // 执行中间件链
    for (const middleware of this.middlewares) {
      context = middleware.beforeRender?.(context) || context;
    }

    // 递归渲染
    const result = this._renderNode(ast, context);

    // 执行后处理
    for (const middleware of this.middlewares) {
      const processed = middleware.afterRender?.(result, context);
      if (processed !== undefined) {
        return processed;
      }
    }

    return result;
  }

  /**
   * 渲染单个节点
   * @private
   */
  _renderNode(node, context) {
    if (node.type === 'root') {
      return node.children.map(child => this._renderNode(child, context)).join('');
    }

    const renderer = this.renderers.get(node.type);
    if (renderer) {
      return renderer(node, context);
    }

    // 默认渲染：转义后输出
    return context.escapeHtml(String(node.content || ''));
  }
}

/**
 * 渲染上下文
 * 提供渲染辅助方法
 */
export class RenderContext {
  constructor(options) {
    this.theme = options.theme;
    this.renderers = options.renderers;
  }

  /**
   * 创建元素
   */
  createElement(tag, props = {}) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(props)) {
      if (key === 'textContent') {
        el.textContent = value;
      } else if (key === 'innerHTML') {
        el.innerHTML = value;
      } else if (key === 'className') {
        el.className = value;
      } else if (key.startsWith('data-')) {
        el.dataset[key.slice(5)] = value;
      } else {
        el.setAttribute(key, value);
      }
    }

    return el;
  }

  /**
   * HTML 转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  /**
   * 渲染子节点
   */
  renderChildren(node) {
    if (!node.children) return '';
    return node.children.map(child => this._renderNode(child, this)).join('');
  }
}
```

### 5.2 样式主题系统

```javascript
/**
 * 样式主题管理
 * 支持主题切换和自定义
 */
export class StyleTheme {
  constructor(options = {}) {
    /** @type {Object} */
    this.variables = {
      ...StyleTheme.DEFAULTS,
      ...options.variables,
    };

    /** @type {Map<string, string>} */
    this.tokenClassMap = new Map(
      Object.entries({
        heading: 'md-h{level}',
        bold: 'md-bold',
        italic: 'md-italic',
        inlineCode: 'md-inline-code',
        codeBlock: 'md-code-block',
        link: 'md-link',
        unorderedList: 'md-list-item',
        orderedList: 'md-ordered-item',
        blockquote: 'md-blockquote',
        hr: 'md-hr',
      })
    );
  }

  /**
   * 获取 Token 对应的 CSS 类名
   * @param {Token} token
   * @returns {string}
   */
  getClass(token) {
    const template = this.tokenClassMap.get(token.type);
    if (!template) return '';

    // 支持动态模板
    return template.replace(/\{(\w+)\}/g, (_, key) => token[key] || '');
  }

  /**
   * 获取 CSS 变量值
   * @param {string} name
   * @returns {string}
   */
  getVar(name) {
    return this.variables[`--md-${name}`] || this.variables[name];
  }

  /**
   * 导出 CSS 变量定义
   * @returns {string}
   */
  exportCSS() {
    return `:root {\n${Object.entries(this.variables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')}\n}`;
  }

  /**
   * 默认变量
   */
  static DEFAULTS = {
    // 色彩
    '--md-delimiter-color': 'rgba(102, 102, 102, 0.25)',
    '--md-code-bg': '#f8f9fa',
    '--md-code-text': '#e83e8c',
    '--md-link-color': '#0066cc',
    '--md-quote-bg': '#f8f9fa',
    '--md-quote-border': '#dee2e6',

    // 尺寸
    '--md-h1-size': '20px',
    '--md-h2-size': '16px',
    '--md-h3-size': '14px',
    // ... 更多变量
  };
}
```

---

## 六、文件结构

### 6.1 最终目录结构

```
src/sidepanel/
├── components/
│   ├── NoteEditor.js           # 修改：集成 MarkdownEngine
│   ├── EditorMoreMenu.js       # 新建：更多菜单
│   └── SyntaxHelpModal.js      # 新建：语法帮助
│
├── utils/
│   └── markdown/
│       │
│       ├── core/                        # 核心（不常修改）
│       │   ├── MarkdownEngine.js       # 引擎核心
│       │   ├── TokenPipeline.js        # Token 管道
│       │   ├── RendererChain.js        # 渲染链
│       │   ├── ParseContext.js         # 解析上下文
│       │   ├── RenderContext.js        # 渲染上下文
│       │   └── StyleTheme.js           # 样式主题
│       │
│       ├── plugins/                     # 插件（扩展点）
│       │   ├── index.js                # 插件注册入口
│       │   ├── heading.js              # 标题插件
│       │   ├── bold.js                 # 粗体插件
│       │   ├── italic.js               # 斜体插件
│       │   ├── inline-code.js          # 行内代码插件
│       │   ├── code-block.js           # 代码块插件
│       │   ├── link.js                 # 链接插件
│       │   ├── list.js                 # 列表插件
│       │   ├── blockquote.js           # 引用插件
│       │   └── hr.js                   # 分割线插件
│       │
│       ├── renderers/                   # 渲染器（可选）
│       │   └── custom/                 # 自定义渲染器
│       │
│       ├── themes/                      # 主题（可选）
│       │   ├── default.js              # 默认主题
│       │   └── dark.js                 # 暗色主题（未来）
│       │
│       └── index.js                     # 统一导出
│
└── styles/
    └── markdown.css                     # Markdown 样式
```

### 6.2 插件注册入口

```javascript
/**
 * Markdown 工具入口
 * @file utils/markdown/index.js
 */

import { MarkdownEngine } from './core/MarkdownEngine.js';
import { StyleTheme } from './core/StyleTheme.js';

// 导入所有插件
import * as plugins from './plugins/index.js';

/**
 * 创建默认引擎
 */
export function createEngine() {
  const engine = new MarkdownEngine();

  // 注册所有内置插件
  engine.useAll(Object.values(plugins));

  return engine;
}

/**
 * 创建默认主题
 */
export function createTheme(options) {
  return new StyleTheme(options);
}

// 导出核心类（供高级用户）
export { MarkdownEngine, StyleTheme };

// 导出插件接口（供扩展）
export { SyntaxPlugin };
```

---

## 七、扩展性示例

### 7.1 添加新语法（高亮）

```javascript
/**
 * 高亮插件
 * ==高亮文本== 类似 Obsidian
 * @file plugins/highlight.js
 */
export const HighlightPlugin = {
  meta: {
    name: 'highlight',
    type: 'inline',
    priority: 35, // 在粗体之后
  },

  syntax: {
    patterns: [
      { regex: /==([^=]+?)==/g },
    ],
    trigger: '=',
  },

  createToken(match) {
    return {
      type: 'highlight',
      content: match[1],
      delimiters: ['==', '=='],
    };
  },

  render(token, context) {
    return context.createElement('span', {
      className: 'md-highlight',
      innerHTML: `
        <span class="md-delimiter">${token.delimiters[0]}</span>
        ${context.escapeHtml(token.content)}
        <span class="md-delimiter">${token.delimiters[1]}</span>
      `,
    });
  },
};

// 注册即可使用
import { createEngine } from './index.js';
import { HighlightPlugin } from './plugins/highlight.js';

const engine = createEngine();
engine.use(HighlightPlugin);
```

### 7.2 自定义渲染器

```javascript
/**
 * 自定义渲染器示例
 * 将代码块渲染为带行号的版本
 */
engine.renderer.register('codeBlock', (token, context) => {
  const lines = token.content.split('\n');

  const pre = context.createElement('pre', { className: 'md-code-block' });

  const code = context.createElement('code');
  lines.forEach((line, i) => {
    const lineDiv = context.createElement('div', {
      className: 'code-line',
    });
    const lineNum = context.createElement('span', {
      className: 'line-num',
      textContent: i + 1,
    });
    const lineContent = context.createElement('span', {
      textContent: line,
    });
    lineDiv.append(lineNum, lineContent);
    code.appendChild(lineDiv);
  });

  pre.appendChild(code);
  return pre.outerHTML;
});
```

### 7.3 中间件示例

```javascript
/**
 * 添加复制按钮中间件
 */
engine.renderer.use({
  afterRender(result, context) {
    // 为代码块添加复制按钮
    return result.replace(
      /<pre class="md-code-block">/g,
      '<pre class="md-code-block"><button class="code-copy-btn">复制</button>'
    );
  },
});
```

---

## 八、稳定性保障

### 8.1 隔离机制

| 机制 | 说明 |
|------|------|
| **插件沙箱** | 插件只能访问通过上下文暴露的 API |
| **错误边界** | 单个插件错误不影响其他插件 |
| **版本锁定** | 插件声明依赖的核心版本 |

```javascript
/**
 * 插件加载器
 * 带错误边界和版本检查
 */
export class PluginLoader {
  constructor(engine) {
    this.engine = engine;
    this.errors = [];
  }

  /**
   * 安全加载插件
   */
  load(plugin) {
    try {
      // 版本检查
      if (plugin.meta?.engineVersion) {
        if (!this._checkVersion(plugin.meta.engineVersion)) {
          throw new Error(
            `Plugin ${plugin.meta.name} requires engine ${plugin.meta.engineVersion}`
          );
        }
      }

      // 接口验证
      this._validatePlugin(plugin);

      // 注册
      this.engine.use(plugin);

      return { success: true };
    } catch (err) {
      this.errors.push({ plugin: plugin.meta?.name, error: err });
      return { success: false, error: err };
    }
  }

  /**
   * 版本检查
   * @private
   */
  _checkVersion(required) {
    const current = MarkdownEngine.VERSION;
    // 简化版本比较
    return current >= required;
  }

  /**
   * 插件接口验证
   * @private
   */
  _validatePlugin(plugin) {
    const required = ['meta', 'syntax', 'createToken', 'render'];
    const missing = required.filter(key => !plugin[key]);

    if (missing.length) {
      throw new Error(
        `Plugin missing required fields: ${missing.join(', ')}`
      );
    }
  }

  /**
   * 获取加载错误
   */
  getErrors() {
    return this.errors;
  }
}
```

### 8.2 测试策略

```javascript
/**
 * 插件测试套件
 */
export class PluginTester {
  /**
   * 测试插件
   */
  static test(plugin) {
    const results = [];

    // 测试1：接口完整性
    results.push(this._testInterface(plugin));

    // 测试2：正则匹配
    results.push(this._testPatterns(plugin));

    // 测试3：Token 创建
    results.push(this._testTokenCreation(plugin));

    // 测试4：渲染输出
    results.push(this._testRendering(plugin));

    return results;
  }

  static _testInterface(plugin) {
    const required = ['meta', 'syntax', 'createToken', 'render'];
    const hasAll = required.every(key => typeof plugin[key] !== 'undefined');

    return {
      name: 'interface',
      passed: hasAll,
      message: hasAll ? 'OK' : 'Missing required fields',
    };
  }

  // ... 更多测试方法
}
```

---

## 九、性能优化

### 9.1 优化策略

| 策略 | 实现 | 效果 |
|------|------|------|
| **增量解析** | 只重解析变化行 | O(1) → O(n) |
| **虚拟滚动** | 长文本分屏渲染 | 大幅减少 DOM |
| **请求合并** | RAF 批量更新 | 减少重排 |
| **Worker 解析** | 后台线程解析 | 不阻塞 UI |

### 9.2 虚拟滚动

```javascript
/**
 * 虚拟滚动渲染器
 * 用于超长文档
 */
export class VirtualScrollRenderer {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 20;
    this.viewportHeight = options.viewportHeight || 600;
    this.bufferSize = options.bufferSize || 5;

    this.visibleStart = 0;
    this.visibleEnd = 0;
  }

  /**
   * 渲染可见区域
   */
  renderVisible(items, scrollTop) {
    const totalHeight = items.length * this.itemHeight;

    // 计算可见范围
    const start = Math.floor(scrollTop / this.itemHeight) - this.bufferSize;
    const end = Math.ceil((scrollTop + this.viewportHeight) / this.itemHeight) + this.bufferSize;

    this.visibleStart = Math.max(0, start);
    this.visibleEnd = Math.min(items.length, end);

    // 生成占位
    const paddingTop = this.visibleStart * this.itemHeight;
    const paddingBottom = (items.length - this.visibleEnd) * this.itemHeight;

    return {
      items: items.slice(this.visibleStart, this.visibleEnd),
      style: `padding-top: ${paddingTop}px; padding-bottom: ${paddingBottom}px;`,
    };
  }
}
```

---

## 十、实施计划

### 10.1 开发阶段

| 阶段 | 任务 | 产出 |
|------|------|------|
| **Phase 1** | 核心框架 | Engine, Pipeline, Context |
| **Phase 2** | 内置插件 | 9 个基础语法 |
| **Phase 3** | 组件集成 | NoteEditor 菜单 |
| **Phase 4** | 性能优化 | 增量解析 |
| **Phase 5** | 测试 | 单元测试 + 集成测试 |

### 10.2 文件创建清单

```
Phase 1 - 核心框架 (6 个文件):
  ☐ core/MarkdownEngine.js
  ☐ core/TokenPipeline.js
  ☐ core/RendererChain.js
  ☐ core/ParseContext.js
  ☐ core/RenderContext.js
  ☐ core/StyleTheme.js

Phase 2 - 内置插件 (10 个文件):
  ☐ plugins/index.js
  ☐ plugins/heading.js
  ☐ plugins/bold.js
  ☐ plugins/italic.js
  ☐ plugins/inline-code.js
  ☐ plugins/code-block.js
  ☐ plugins/link.js
  ☐ plugins/list.js
  ☐ plugins/blockquote.js
  ☐ plugins/hr.js

Phase 3 - 组件 (3 个文件):
  ☐ components/EditorMoreMenu.js
  ☐ components/SyntaxHelpModal.js
  ☐ 修改 components/NoteEditor.js

Phase 4 - 样式 (1 个文件):
  ☐ styles/markdown.css

Phase 5 - 入口 (1 个文件):
  ☐ utils/markdown/index.js
```

---

## 十一、总结

### 11.1 架构优势

| 维度 | v1.0 硬编码 | v2.0 插件化 |
|------|------------|------------|
| **扩展性** | 新语法改核心 | 注册插件即可 |
| **稳定性** | 变更影响全局 | 插件隔离 |
| **简洁性** | 代码分散 | 统一接口 |
| **可测试** | 需集成测试 | 插件独立测试 |

### 11.2 扩展清单

未来可轻松添加的功能：

| 功能 | 实现方式 | 工作量 |
|------|----------|--------|
| 表格 | 新增 TablePlugin | 1 个插件文件 |
| 任务列表 | 新增 TaskListPlugin | 1 个插件文件 |
| 脚注 | 新增 FootnotePlugin | 1 个插件文件 |
| 数学公式 | 新增 KaTeXPlugin | 1 个插件文件 |
| Mermaid 图表 | 新增 MermaidPlugin | 1 个插件文件 |
| 暗色主题 | 新建 DarkTheme | 1 个主题文件 |

### 11.3 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2025-01-13 | v2.0 | 重构为插件化架构，提升扩展性 |
