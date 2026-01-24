# SlideNote UI 设计规范

> **版本**: v0.0.7
> **日期**: 2025-01-21
> **状态**: 设计中

---

## 一、设计原则

| 原则 | 说明 |
|------|------|
| **简洁优先** | 减少视觉干扰，让用户专注于内容 |
| **即时反馈** | 所有操作都有明确的视觉反馈 |
| **轻量化** | 保持轻量，不使用厚重的设计元素 |
| **一致性** | 相同功能使用相同的交互模式 |

---

## 二、颜色系统

### 2.1 品牌色

```css
/* 主色 - 用于主要操作、链接、选中状态 */
--color-primary: #3b82f6;
--color-primary-hover: #2563eb;
--color-primary-active: #1d4ed8;
--color-primary-light: #eff6ff;  /* 背景用 */
--color-primary-lighter: #dbeafe; /* 边框用 */
```

### 2.2 功能色

```css
/* 成功 */
--color-success: #10b981;
--color-success-light: #d1fae5;

/* 警告 */
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;

/* 错误 */
--color-error: #ef4444;
--color-error-light: #fee2e2;

/* 信息 */
--color-info: #6366f1;
--color-info-light: #e0e7ff;
```

### 2.3 中性色

```css
/* 文字 */
--color-text-primary: #1f2937;    /* 主要文字 */
--color-text-secondary: #6b7280;  /* 次要文字 */
--color-text-tertiary: #9ca3af;   /* 辅助文字 */
--color-text-disabled: #d1d5db;   /* 禁用文字 */

/* 背景 */
--color-bg-primary: #ffffff;      /* 主背景 */
--color-bg-secondary: #f9fafb;    /* 次要背景 */
--color-bg-tertiary: #f3f4f6;     /* 三级背景 */
--color-bg-hover: #f3f4f6;        /* 悬停背景 */

/* 边框 */
--color-border: #e5e7eb;
--color-border-light: #f3f4f6;
--color-border-dark: #d1d5db;
```

### 2.4 颜色使用场景

| 场景 | 颜色 | 用途 |
|------|------|------|
| 主按钮 | `--color-primary` | 新建、确认等主要操作 |
| 链接/图标激活 | `--color-primary` | 意见反馈、GitHub 链接 |
| 选中状态背景 | `--color-primary-light` | 笔记选中 |
| 选中状态边框 | `--color-primary` | 笔记左侧蓝条 |
| 置顶图标 | `--color-warning` | 📌 置顶标识 |
| 分隔线 | `--color-border` | 各区域分隔 |
| 辅助文字 | `--color-text-secondary` | 预览、时间、占位符 |

---

## 三、字体系统

### 3.1 字体族

```css
--font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                     "Helvetica Neue", Arial, sans-serif;
--font-family-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono",
                     Consolas, "Courier New", monospace;
```

### 3.2 字体大小

```css
--font-size-xs: 11px;    /* 极小文字：版本号、辅助信息 */
--font-size-sm: 12px;    /* 小文字：预览、时间戳 */
--font-size-base: 13px;  /* 基础文字：菜单、按钮 */
--font-size-md: 14px;    /* 中等文字：标题、正文 */
--font-size-lg: 16px;    /* 大文字：弹窗标题 */
--font-size-xl: 20px;    /* 特大文字：页面标题 */
```

### 3.3 字重

```css
--font-weight-normal: 400;   /* 常规 */
--font-weight-medium: 500;   /* 中等：笔记标题 */
--font-weight-semibold: 600; /* 半粗：弹窗标题 */
--font-weight-bold: 700;     /* 粗体：强调 */
```

### 3.4 行高

```css
--line-height-tight: 1.25;   /* 紧凑：标题 */
--line-height-base: 1.5;     /* 常规：正文 */
--line-height-relaxed: 1.75; /* 宽松：长文本 */
```

---

## 四、间距系统

### 4.1 间距规范

```css
--spacing-xs: 4px;    /* 极小：图标与文字间距 */
--spacing-sm: 8px;    /* 小：相关元素间距 */
--spacing-md: 12px;   /* 中：组件内边距 */
--spacing-lg: 16px;   /* 大：区块间距 */
--spacing-xl: 24px;   /* 极大：页面级间距 */
--spacing-2xl: 32px;  /* 超大：特殊间距 */
```

### 4.2 间距使用场景

| 场景 | 间距 |
|------|------|
| 图标与文字 | `4px` |
| 列表项内边距 | `12px 16px` |
| 按钮内边距 | `8px 16px` |
| 组件间距 | `12px` |
| 区块间距 | `16px` |
| 页面边距 | `20px` |

---

## 五、圆角系统

```css
--radius-sm: 4px;   /* 小圆角：标签、徽章 */
--radius-md: 6px;   /* 中圆角：按钮、输入框 */
--radius-lg: 8px;   /* 大圆角：卡片、弹窗 */
--radius-xl: 12px;  /* 极大圆角：容器 */
--radius-full: 9999px; /* 完全圆角：胶囊按钮 */
```

---

## 六、阴影系统

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
```

### 使用场景

| 场景 | 阴影 |
|------|------|
| 按钮（悬停） | `--shadow-sm` |
| 下拉菜单 | `--shadow-md` |
| 弹窗 | `--shadow-xl` |
| 浮动元素 | `--shadow-lg` |

---

## 七、布局规范

### 7.1 侧边栏尺寸

```css
/* 侧边栏宽度 */
--sidebar-width-expanded: 280px;  /* 展开状态 */
--sidebar-width-collapsed: 90px;  /* 收起状态 */

/* 各区域高度 */
--toolbar-height: 56px;
--footer-height: 40px;
```

### 7.2 区域划分

```
┌────────────────────────────────┐
│  Toolbar (56px)                │  ← 搜索 + 新建
├────────────────────────────────┤
│                                │
│  Note List (flex: 1)           │  ← 笔记列表
│                                │
├────────────────────────────────┤
│  Footer (40px)                 │  ← 意见反馈 + 更多
└────────────────────────────────┘
```

### 7.3 编辑器区域

```
┌────────────────────────────────┐
│  Editor Header (48px)          │  ← 标题输入 + 操作按钮
├────────────────────────────────┤
│                                │
│  Editor Content (flex: 1)      │  ← 内容编辑区
│                                │
└────────────────────────────────┘
```

---

## 八、组件规范

### 8.1 按钮

#### 主按钮

```css
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}
```

**状态**：

```
正常: [  + 新建  ]
悬停: [  + 新建  ]  ← 背景变深
点击: [  + 新建  ]  ← 轻微缩小
禁用: [  + 新建  ]  ← 灰色，不可点击
```

#### 次按钮（文字按钮）

```css
.btn-text {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.btn-text:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}
```

#### 图标按钮

```css
.btn-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.btn-icon:hover {
  background: var(--color-bg-hover);
}
```

### 8.2 输入框

```css
.input {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--color-bg-primary);
  transition: all 0.15s;
}

.input:hover {
  border-color: var(--color-border-dark);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-lighter);
}
```

### 8.3 笔记列表项

```css
.note-item {
  padding: 12px 16px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background 0.15s;
}

.note-item:hover {
  background: var(--color-bg-hover);
}

.note-item.active {
  background: var(--color-primary-light);
  border-left-color: var(--color-primary);
}
```

**视觉**：

```
正常:
│  AI 提示词
│  用于 DeepSeek 写作...

悬停:
░░AI 提示词░░░░░░░░░░░░░░░░░
░░用于 DeepSeek 写作...░░░░

选中:
███████████████████████████
█▌ AI 提示词               █  ← 蓝色背景 + 左侧蓝条
█  用于 DeepSeek 写作...    █
███████████████████████████
```

### 8.4 下拉菜单

```css
.dropdown-menu {
  min-width: 180px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.dropdown-item {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--color-bg-hover);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}
```

### 8.5 弹窗

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 400px;
  max-width: 90vw;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

### 8.6 Toast 提示

```css
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-base);
  animation: toastIn 0.2s ease;
}

.toast.success { border-left: 3px solid var(--color-success); }
.toast.error { border-left: 3px solid var(--color-error); }
```

---

## 九、图标规范

### 9.1 图标尺寸

```css
--icon-xs: 12px;  /* 极小图标：列表项内小标识 */
--icon-sm: 14px;  /* 小图标：按钮图标 */
--icon-md: 16px;  /* 中图标：菜单图标 */
--icon-lg: 20px;  /* 大图标：工具栏图标 */
--icon-xl: 24px;  /* 特大图标：主要功能图标 */
```

### 9.2 图标样式

- 使用 SVG 格式
- `stroke-width: 2` 保持线条一致性
- `fill="none" stroke="currentColor"` 支持颜色继承
- 圆角端点 `stroke-linecap="round"`

### 9.3 图标使用场景

| 场景 | 尺寸 | 示例 |
|------|------|------|
| 按钮内图标 | 14px | 搜索 🔍 |
| 菜单项图标 | 16px | 导出 📤 |
| 工具栏图标 | 20px | 新建 + |
| 装饰图标 | 24px | 置顶 📌 |

---

## 十、交互状态

### 10.1 状态列表

| 状态 | 说明 | 表现 |
|------|------|------|
| `default` | 默认状态 | 常规样式 |
| `hover` | 鼠标悬停 | 背景变浅/边框变深 |
| `active` | 鼠标按下 | 轻微缩小 + 背景更深 |
| `focus` | 键盘聚焦 | 边框高亮 + 外发光 |
| `disabled` | 禁用状态 | 灰色 + 不可交互 |
| `loading` | 加载中 | 显示加载动画 |

### 10.2 过渡动画

```css
--transition-fast: 0.1s;
--transition-base: 0.15s;
--transition-slow: 0.2s;

/* 使用 */
transition: background var(--transition-base),
            border-color var(--transition-base);
```

---

## 十一、响应式适配

### 11.1 侧边栏收起状态

```css
/* 收起时宽度 */
.sidebar.collapsed {
  width: 90px;
}

/* 收起时隐藏的元素 */
.sidebar.collapsed .toolbar,
.sidebar.collapsed .footer {
  display: none;
}

/* 收起时笔记项样式 */
.sidebar.collapsed .note-item {
  padding: 8px 6px;
  text-align: center;
}

.sidebar.collapsed .note-preview {
  display: none;
}
```

---

## 十二、无障碍设计

### 12.1 焦点管理

- 所有可交互元素支持 Tab 键导航
- 焦点状态有清晰的视觉反馈（外发光）
- 弹窗打开时焦点进入弹窗内

### 12.2 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + N` | 新建笔记 |
| `Cmd/Ctrl + F` | 搜索 |
| `ESC` | 关闭弹窗/退出搜索 |
| `↑ / ↓` | 上下选择笔记 |

---

## 十三、CSS 变量速查表

```css
/* === 颜色 === */
--color-primary: #3b82f6;
--color-primary-hover: #2563eb;
--color-primary-light: #eff6ff;
--color-text-primary: #1f2937;
--color-text-secondary: #6b7280;
--color-text-tertiary: #9ca3af;
--color-bg-primary: #ffffff;
--color-bg-secondary: #f9fafb;
--color-bg-hover: #f3f4f6;
--color-border: #e5e7eb;

/* === 字体 === */
--font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 13px;
--font-size-md: 14px;
--font-size-lg: 16px;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;

/* === 间距 === */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;

/* === 圆角 === */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;

/* === 阴影 === */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);

/* === 布局 === */
--sidebar-width-expanded: 280px;
--sidebar-width-collapsed: 90px;
--toolbar-height: 56px;
--footer-height: 40px;

/* === 动画 === */
--transition-fast: 0.1s;
--transition-base: 0.15s;
--transition-slow: 0.2s;
```

---

> **设计原则**：简洁、轻量、一致、即时反馈
