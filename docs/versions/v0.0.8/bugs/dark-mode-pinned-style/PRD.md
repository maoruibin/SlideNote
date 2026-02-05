# 夜间模式置顶笔记颜色问题 - Bug 修复

> **版本**: v0.0.8
> **类型**: Bug 修复
> **优先级**: P1
> **日期**: 2025-01-28

---

## 一、问题描述

### 1.1 现象

在夜间模式下，置顶笔记的颜色显示存在问题：

1. **背景颜色过亮** - 置顶笔记使用 `#fff9f0` 浅橙色背景，在深色背景下非常刺眼
2. **橙色竖条看不清** - 橙色 `#f59e0b` 在深色背景下对比度不足
3. **文字可读性差** - 亮色背景 + 亮色文字，对比度不够

### 1.2 复现步骤

1. 开启系统夜间模式
2. 置顶一条笔记
3. 观察置顶笔记在列表中的显示效果

### 1.3 当前样式代码

```css
/* src/sidepanel/styles.css */

/* 置顶笔记：极浅橙背景 */
.note-item.pinned {
  background: #fff9f0;  /* 亮色 - 夜间模式不适用 */
}

/* 置顶笔记选中状态 */
.note-item.pinned.active {
  background: #ffe8cc;
}

/* 置顶笔记选中时显示橙色竖条 */
.note-item.pinned.active::before {
  background: #f59e0b;  /* 橙色 - 夜间模式对比度不足 */
}
```

### 1.4 夜间模式配置

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #1a1a1a;
    --color-text-primary: #e8e8e8;
    /* ... 但没有定义置顶笔记的暗色变量 */
  }
}
```

---

## 二、预期效果

在夜间模式下，置顶笔记应该：
1. 使用深色/暗橙色背景，与整体深色主题协调
2. 竖条颜色更亮，保证对比度
3. 文字清晰可读

---

## 三、技术方案

### 3.1 设计变量

在夜间模式下为置顶笔记定义专用变量：

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* 置顶笔记 - 暗色友好的橙色调 */
    --pinned-bg: #2d1f0f;        /* 深橙底色 */
    --pinned-bg-hover: #3a2a14;   /* 悬停稍亮 */
    --pinned-bg-active: #4a351a;  /* 选中态 */
    --pinned-accent: #f59e0b;     /* 橙色竖条（保持鲜艳）*/
    --pinned-accent-alt: #fbbf24; /* 亮橙色（用于高亮）*/
  }
}
```

### 3.2 使用变量修改样式

```css
/* 将硬编码颜色替换为 CSS 变量 */
.note-item.pinned {
  background: var(--pinned-bg, #fff9f0);
}

.note-item.pinned:hover {
  background: var(--pinned-bg-hover, #fff3e0);
}

.note-item.pinned.active {
  background: var(--pinned-bg-active, #ffe8cc);
}

.note-item.pinned.active::before {
  background: var(--pinned-accent, #f59e0b);
}
```

### 3.3 文件修改

**文件**: `src/sidepanel/styles.css`

1. 在 `@media (prefers-color-scheme: dark)` 块中添加置顶笔记变量
2. 修改 `.note-item.pinned` 相关样式使用 CSS 变量

---

## 四、验收标准

- [ ] 夜间模式下，置顶笔记背景为深橙色，不刺眼
- [ ] 夜间模式下，橙色竖条清晰可见
- [ ] 夜间模式下，置顶笔记文字清晰可读
- [ ] 日间模式下，样式保持不变（浅橙色背景）
- [ ] 悬停和选中状态在两种模式下都正常

---

## 五、参考

- **当前样式位置**: `src/sidepanel/styles.css` 第 546-590 行
- **夜间模式位置**: `src/sidepanel/styles.css` 第 68-110 行
- **相关功能**: 置顶笔记 (v0.0.7 新增)
