# 导出功能 UI 设计文档

> **版本**: v0.0.2
> **创建日期**: 2025-01-12
> **设计原则**: 与现有设计系统保持一致

---

## 一、现有设计系统分析

### 1.1 设计 Token

```css
/* 色彩 */
--color-primary: #0066cc;           /* 主色 */
--color-bg-primary: #ffffff;        /* 主背景 */
--color-bg-secondary: #f5f5f5;      /* 次级背景 */
--color-text-primary: #1a1a1a;      /* 主文字 */
--color-text-secondary: #666666;    /* 次级文字 */
--color-text-tertiary: #999999;     /* 辅助文字 */
--color-border: #e5e5e5;            /* 边框 */
--color-overlay: rgba(0,0,0,0.4);   /* 遮罩 */

/* 尺寸 */
--radius-md: 6px;                   /* 圆角 */
--radius-lg: 8px;                   /* 大圆角 */
--spacing-sm: 6px;                  /* 小间距 */
--spacing-md: 12px;                 /* 中间距 */
--spacing-lg: 18px;                 /* 大间距 */
--spacing-xl: 24px;                 /* 超大间距 */

/* 动画 */
--duration-fast: 150ms;             /* 快速动画 */
--duration-base: 200ms;             /* 基础动画 */
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

### 1.2 组件模式

| 组件 | 模式 |
|------|------|
| **Dialog** | `dialog-overlay` + `dialog`，缩放淡入动画 |
| **ContextMenu** | 固定定位，菜单项 `context-menu-item` |
| **Button** | 文字按钮 + SVG 图标，hover 背景变化 |
| **Icon** | 内联 SVG，14-16px |

---

## 二、导出对话框设计

### 2.1 入口位置

**方案：在笔记列表底部 Footer 添加更多按钮**

```
┌─────────────────────────────────────┐
│  笔记列表                           │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  .note-list-footer                  │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │    由 咕咚同学 开发              ││
│  │    Simple notes...              ││
│  │                                 ││
│  │    [ ⋯ ]                        ││ ← 更多按钮（新增）
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 2.2 更多菜单

```
.more-menu (弹出菜单)
┌──────────────────┐
│  📤 导出笔记      │
│  ℹ️ 关于          │
└──────────────────┘
```

### 2.3 导出对话框

```
┌─────────────────────────────────────────────┐
│  导出笔记                              [×]  │ ← 标题栏，× 关闭
├─────────────────────────────────────────────┤
│                                             │
│  选择导出格式                               │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📦                                  │   │ ← 选中状态：蓝色边框+浅蓝底
│  │  JSON 完整备份                       │   │
│  │  包含元数据，适合恢复                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📝                                  │   │
│  │  Markdown 可读备份                   │   │
│  │  适合查看和迁移到其他应用             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐ │
│  │   取消           │  │   导出           │ │
│  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────┘

宽度: 320px
圆角: 8px (--radius-lg)
阴影: --shadow-lg
```

### 2.4 交互状态

| 状态 | 视觉表现 |
|------|----------|
| **默认** | 选项卡片白色背景，灰色边框 |
| **悬停** | 边框变为主色，浅蓝背景 |
| **选中** | 蓝色边框 `#0066cc`，浅蓝背景 `#f0f7ff` |
| **导出中** | 导出按钮显示 "导出中..."，禁用状态 |

### 2.5 反馈提示

**成功 Toast**：
```
┌─────────────────────────────────┐
│  ✓ 导出成功                      │
│  文件已保存到下载文件夹           │
└─────────────────────────────────┘
位置: 右下角
颜色: 绿色文字 + 浅绿背景
```

**失败 Toast**：
```
┌─────────────────────────────────┐
│  ✗ 导出失败                      │
│  {具体错误原因}                  │
└─────────────────────────────────┘
颜色: 红色文字 + 浅红背景
```

---

## 三、右键菜单增强

### 3.1 笔记列表项右键菜单

在现有排序菜单中添加"导出"选项：

```
┌──────────────────────┐
│  ⇧ 移动到顶部         │
│  ↑ 上移               │
│  ↓ 下移               │
│  ⇩ 移动到底部         │
│  ──────────────────  │
│  📤 导出为 Markdown  │ ← 新增
│  × 删除               │
└──────────────────────┘
```

---

## 四、样式规范

### 4.1 导出对话框样式

```css
/* ============================================
   导出对话框 ExportDialog
   ============================================ */

/* 选项卡片 */
.export-format-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  background: var(--color-bg-primary);
}

.export-format-option:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.export-format-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

/* 格式图标 */
.export-format-icon {
  font-size: 24px;
  flex-shrink: 0;
}

/* 格式信息 */
.export-format-info {
  flex: 1;
  min-width: 0;
}

.export-format-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.export-format-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* 更多菜单按钮 */
.btn-more {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
  margin: var(--spacing-sm) auto 0;
}

.btn-more:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

/* 更多菜单 */
.more-menu {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: var(--spacing-sm);
  min-width: 120px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 4px 0;
  animation: menuFadeIn var(--duration-fast) var(--ease-out);
}

.more-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
}

.more-menu-item:hover {
  background: var(--color-bg-secondary);
}

/* Toast 提示 */
.toast {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  min-width: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: slideInRight var(--duration-base) var(--ease-out);
  z-index: 2000;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.toast-success {
  background: #dcfce7;
  color: #166534;
}

.toast.toast-error {
  background: #fee2e2;
  color: #991b1b;
}

.toast-icon {
  margin-right: var(--spacing-sm);
}

.toast-message {
  flex: 1;
}
```

---

## 五、HTML 结构

### 5.1 导出对话框

```html
<div class="dialog-overlay">
  <div class="dialog dialog-export">
    <!-- 头部 -->
    <div class="dialog-header">
      <span class="dialog-title">导出笔记</span>
      <button class="dialog-close" data-action="close">×</button>
    </div>

    <!-- 主体 -->
    <div class="dialog-body">
      <div class="export-format-section">
        <!-- JSON 选项 -->
        <div class="export-format-option selected" data-format="json">
          <span class="export-format-icon">📦</span>
          <div class="export-format-info">
            <div class="export-format-name">JSON 完整备份</div>
            <div class="export-format-desc">包含元数据，适合恢复</div>
          </div>
        </div>

        <!-- Markdown 选项 -->
        <div class="export-format-option" data-format="markdown">
          <span class="export-format-icon">📝</span>
          <div class="export-format-info">
            <div class="export-format-name">Markdown 可读备份</div>
            <div class="export-format-desc">适合查看和迁移到其他应用</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="dialog-footer">
      <button class="dialog-btn dialog-btn-cancel" data-action="close">取消</button>
      <button class="dialog-btn dialog-btn-confirm" data-action="export">导出</button>
    </div>
  </div>
</div>
```

### 5.2 更多菜单

```html
<div class="more-menu">
  <div class="more-menu-item" data-action="export">
    <span>📤</span>
    <span>导出笔记</span>
  </div>
  <div class="more-menu-item" data-action="about">
    <span>ℹ️</span>
    <span>关于</span>
  </div>
</div>
```

### 5.3 Toast 提示

```html
<div class="toast toast-success">
  <span class="toast-icon">✓</span>
  <span class="toast-message">导出成功，文件已保存到下载文件夹</span>
</div>
```

---

## 六、组件复用策略

### 6.1 复用现有组件

| 现有组件 | 复用方式 |
|----------|----------|
| `ConfirmDialog` | 参考 `dialog-overlay` + `dialog` 结构 |
| `ContextMenu` | 复用 `context-menu-item` 样式 |
| `btn-new-note` | 参考 `btn-more` 按钮样式 |

### 6.2 新增组件

| 组件 | 文件路径 |
|------|----------|
| `ExportDialog` | `src/sidepanel/components/ExportDialog.js` |
| `Toast` | `src/sidepanel/components/Toast.js` |
| `MoreMenu` | 复用 `ContextMenu.js` 或新建 |

---

## 七、响应式考虑

### 7.1 断点

| 状态 | 处理方式 |
|------|----------|
| 侧边栏宽度 < 400px | 对话框宽度调整为 90% |
| 侧边栏高度 < 500px | 对话框垂直居中，允许滚动 |

### 7.2 触摸设备

- 增大点击热区（最小 44px）
- 延长动画时间（150ms → 200ms）

---

## 八、可访问性

### 8.1 键盘导航

| 按键 | 功能 |
|------|------|
| `Esc` | 关闭对话框 |
| `Enter` | 确认导出 |
| `Tab` | 在选项间切换 |
| `↑/↓` | 切换格式选项 |

### 8.2 ARIA 属性

```html
<!-- 对话框 -->
<div class="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <div class="dialog">
    <h2 id="dialog-title" class="dialog-title">导出笔记</h2>
    <!-- ... -->
  </div>
</div>

<!-- 选项卡片 -->
<div class="export-format-option" role="radio" aria-checked="true" tabindex="0">
  <!-- ... -->
</div>
```

---

## 九、动画细节

### 9.1 选项切换动画

```css
.export-format-option {
  transition: border-color var(--duration-fast), background var(--duration-fast);
}
```

### 9.2 对话框入场动画

复用现有的 `fadeIn` + `scaleIn` 组合动画。

---

## 十、设计交付

### 10.1 交付清单

- [x] UI 设计文档
- [ ] 样式代码 (CSS)
- [ ] ExportDialog 组件
- [ ] Toast 组件
- [ ] 国际化文案

### 10.2 国际化文案

```javascript
// _locales/zh_CN/messages.json
{
  "exportNotes": { "message": "导出笔记" },
  "exportJSON": { "message": "JSON 完整备份" },
  "exportJSONDesc": { "message": "包含元数据，适合恢复" },
  "exportMarkdown": { "message": "Markdown 可读备份" },
  "exportMarkdownDesc": { "message": "适合查看和迁移到其他应用" },
  "exportSuccess": { "message": "导出成功" },
  "exportSuccessDesc": { "message": "文件已保存到下载文件夹" },
  "exportFailed": { "message": "导出失败" },
  "exportSingle": { "message": "导出为 Markdown" },
  "moreMenu": { "message": "更多" }
}
```

---

## 十一、附录

### 11.1 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2025-01-12 | v0.0.2 | 初始版本，基于现有设计系统 |
