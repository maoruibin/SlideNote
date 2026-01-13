# SlideNote 侧边栏折叠功能 PRD

> 为用户提供更大的编辑空间

---

## 一、需求背景

当前侧边栏固定宽度为 180px，占用了一定空间。用户在编辑较长内容时，希望有更宽敞的编辑区域。折叠侧边栏可以让用户在需要专注编辑时获得更多空间。

---

## 二、功能概述

允许用户折叠/展开左侧笔记列表区域，折叠后为右侧编辑区提供更大空间。

---

## 三、交互设计

### 3.1 触发方式

| 触发方式 | 描述 | 优先级 |
|---------|------|--------|
| 折叠按钮 | 左侧区域右边缘的折叠/展开按钮 | P0 |
| 快捷键 | `Cmd/Ctrl + [` 折叠, `Cmd/Ctrl + ]` 展开 | P1 |

### 3.2 视觉设计

#### 展开状态（当前状态）
```
┌────────────┬────────────────────────────────────────┐
│  🔍  [+新建]│                                        │
├────────────┤                                        │
│  笔记1     │                                        │
│  笔记2     │         编辑区域                         │
│  笔记3     │                                        │
│            │                                        │
│  作者信息   │                                        │
└────────────┴────────────────────────────────────────┘
    180px
```

#### 折叠状态
```
┌──┬───────────────────────────────────────────────┐
│ >│                                               │
├──┤                                               │
│  │                                               │
│  │          编辑区域（更宽）                       │
│  │                                               │
│  │                                               │
└──┴───────────────────────────────────────────────┘
 40px
```

**折叠后显示内容**：
- 一个展开按钮（`>` 图标）
- 图标居中显示
- 鼠标悬停时显示 tooltip "展开笔记列表"

### 3.3 动画效果

- 过渡时间：200ms
- 缓动函数：`ease-out`
- 使用 CSS `transition` 实现平滑过渡

---

## 四、功能规格

### 4.1 折叠/展开行为

| 场景 | 行为 |
|------|------|
| 点击折叠按钮 | 左侧区域收缩到 40px，只显示展开按钮 |
| 点击展开按钮 | 左侧区域展开到 180px，恢复完整内容 |
| 折叠状态下点击新建 | 自动展开侧边栏，然后创建新笔记 |
| 折叠状态下点击搜索 | 自动展开侧边栏，然后展开搜索框 |

### 4.2 状态持久化

- 使用 Chrome Storage 保存折叠状态
- Storage Key: `slidenote_sidebar_collapsed`
- 值类型: `boolean`
- 下次打开时恢复上次的状态

### 4.3 响应式行为

当侧边栏折叠时：
- 笔记列表内容隐藏
- Toolbar 内容隐藏（搜索框、新建按钮）
- Footer 内容隐藏
- 只保留展开按钮

---

## 五、技术实现要点

### 5.1 组件结构

```
app.js
├── 新增状态: sidebarCollapsed
├── 新增事件:
│   ├── sidebar:collapse  - 折叠侧边栏
│   └── sidebar:expand    - 展开侧边栏
│
├── Toolbar.js
│   ├── 新增折叠/展开按钮
│   └── 根据状态显示不同内容
│
├── NoteList.js
│   └── 折叠时隐藏内容
│
└── Store.js
    └── getSidebarCollapsed() / setSidebarCollapsed()
```

### 5.2 CSS 设计

```css
/* 折叠状态 */
.note-list-section.collapsed {
  width: 40px;
}

/* 折叠按钮 */
.collapse-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 32px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

/* 过渡动画 */
.note-list-section {
  transition: width 200ms ease-out;
}
```

### 5.3 事件流程

#### 折叠流程
```
用户点击折叠按钮
    ↓
emit('sidebar:collapse')
    ↓
store.setSidebarCollapsed(true)
    ↓
note-list-section 添加 .collapsed 类
    ↓
Chrome Storage 保存状态
```

#### 展开流程
```
用户点击展开按钮
    ↓
emit('sidebar:expand')
    ↓
store.setSidebarCollapsed(false)
    ↓
note-list-section 移除 .collapsed 类
    ↓
Chrome Storage 保存状态
```

---

## 六、边界情况处理

| 场景 | 处理方式 |
|------|---------|
| 折叠状态下右键删除笔记 | 允许操作（当前选中的笔记仍可删除） |
| 折叠状态下同步更新 | 允许（静默更新，不影响折叠状态） |
| 只有一条笔记 | 可以折叠 |
| 没有笔记时 | 可以折叠 |
| 折叠状态下刷新页面 | 保持折叠状态 |

---

## 七、实施计划

### Phase 1: 基础折叠功能 (P0)
- [ ] Store 添加折叠状态管理
- [ ] CSS 添加折叠样式和过渡动画
- [ ] Toolbar 添加折叠/展开按钮
- [ ] 实现折叠/展开逻辑
- [ ] 状态持久化到 Chrome Storage

### Phase 2: 交互优化 (P1)
- [ ] 折叠状态下自动展开逻辑（新建/搜索时）
- [ ] 快捷键支持
- [ ] Tooltip 提示

---

## 八、验收标准

### 基础功能
- [x] 点击折叠按钮，侧边栏收缩到 40px
- [x] 点击展开按钮，侧边栏恢复到 180px
- [x] 折叠/展开动画流畅（200ms）

### 状态持久化
- [x] 折叠后刷新页面，保持折叠状态
- [x] 展开后刷新页面，保持展开状态

### 交互细节
- [x] 折叠状态下只显示展开按钮
- [x] 折叠状态下点击新建，自动展开后创建
- [x] 折叠状态下点击搜索，自动展开后搜索

### 视觉效果
- [x] 折叠按钮位置正确（右边缘居中）
- [x] 过渡动画平滑无卡顿
- [x] 折叠状态下无内容溢出
