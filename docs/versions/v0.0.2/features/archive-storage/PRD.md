# 归档功能需求文档

> **版本**: v0.0.2
> **创建日期**: 2025-01-11
> **状态**: 设计中

## 一、功能概述

### 1.1 背景

Chrome Storage Sync API 有 100KB 的总容量限制，大约只能存储 20-30 条笔记。当用户笔记增多时，会遇到存储空间不足的问题。

### 1.2 目标

- 将不常用的旧笔记归档到 `storage.local`（无容量限制，但不同步）
- 释放 sync 存储空间，保证活跃笔记能正常同步
- 用户可以手动/自动归档，也可以恢复归档的笔记

## 二、功能需求

### 2.1 功能边界

**✅ 本版本包含：**

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 手动归档单条笔记 | 笔记列表右键菜单 → 归档 | P0 |
| 批量归档 | 选择多条笔记批量归档 | P1 |
| 归档管理页面 | 查看所有归档笔记 | P0 |
| 恢复归档笔记 | 将归档笔记恢复为活跃笔记 | P0 |
| 自动归档规则 | 超过 N 天未编辑自动归档 | P2 |
| 归档容量监控 | 显示 sync 存储使用情况 | P0 |

**❌ 本版本不包含：**

- 归档笔记的搜索
- 归档笔记的分类/标签
- 归档笔记的导出（导出功能单独实现）

### 2.2 用户交互流程

```
用户打开侧边栏
    ↓
看到存储容量提示（如："已使用 85%"）
    ↓
有两种操作方式：
    A. 手动归档：右键笔记 → "归档"
    B. 批量归档：进入归档管理 → 选择多条 → "归档选中"
    ↓
笔记移至 storage.local
    ↓
sync 存储空间释放
```

## 三、数据设计

### 3.1 数据结构

```javascript
// 活跃笔记（storage.sync，100KB 限制）
{
  slidenote_notes: [
    { id, title, content, createdAt, updatedAt }
  ],
  slidenote_active_id: "note_xxx",
  slidenote_settings: {
    archiveEnabled: true,
    archiveAfterDays: 30
  }
}

// 归档笔记（storage.local，5MB+ 容量）
{
  slidenote_archived_notes: [
    { id, title, content, createdAt, updatedAt, archivedAt: number }
  ]
}
```

### 3.2 归档规则

| 规则 | 说明 |
|------|------|
| 手动归档 | 用户主动选择归档 |
| 自动归档 | 超过 N 天未编辑的笔记（可配置天数） |
| 智能归档 | 当 sync 使用率 > 90% 时，自动归档最旧的笔记 |

## 四、UI 设计

### 4.1 容量指示器

```
┌─────────────────────────────────────────┐
│  存储空间: ████████░░░░ 85% (85KB/100KB) │
│            ↑ [归档旧笔记]                │
└─────────────────────────────────────────┘
```

- 绿色：< 70%
- 橙色：70% - 90%
- 红色：> 90%

### 4.2 笔记列表右键菜单

```
┌──────────────────────┐
│  ○ 打开              │
│  ──────────────────  │
│  ✓ 归档              │
│  🗑️ 删除              │
└──────────────────────┘
```

### 4.3 归档管理页面

```
┌─────────────────────────────────────────────────────┐
│  归档管理                              [关闭]        │
├─────────────────────────────────────────────────────┤
│  🔍 搜索归档笔记...                                   │
│                                                      │
│  ☑ 旧项目配置              2024-12-01     [恢复]    │
│  ☑ 临时笔记                2024-11-15     [恢复]    │
│  ☐ 测试笔记                2024-10-20     [恢复]    │
│                                                      │
│  [全部恢复]  [删除选中]                              │
└─────────────────────────────────────────────────────┘
```

## 五、技术方案

### 5.1 存储操作

```javascript
// 归档单条笔记
async function archiveNote(noteId) {
  // 1. 从 sync 读取笔记
  const note = await getFromSync(noteId);
  // 2. 添加到 local
  await addToLocal({ ...note, archivedAt: Date.now() });
  // 3. 从 sync 删除
  await deleteFromSync(noteId);
}

// 恢复归档笔记
async function unarchiveNote(noteId) {
  // 1. 从 local 读取笔记
  const note = await getFromLocal(noteId);
  // 2. 添加到 sync
  await addToSync({ ...note, archivedAt: undefined });
  // 3. 从 local 删除
  await deleteFromLocal(noteId);
}

// 检查 sync 容量
async function checkSyncCapacity() {
  const bytes = await chrome.storage.sync.getBytesInUse();
  const maxBytes = 102400; // 100KB
  return { used: bytes, max: maxBytes, percent: (bytes / maxBytes) * 100 };
}
```

### 5.2 容量监控组件

```javascript
class CapacityIndicator extends Component {
  async _updateCapacity() {
    const { used, max, percent } = await checkSyncCapacity();

    // 更新进度条颜色
    const color = percent > 90 ? 'red' : percent > 70 ? 'orange' : 'green';

    // >90% 时显示警告
    if (percent > 90) {
      bus.emit('capacity:warning', {
        message: '存储空间不足，请归档旧笔记',
        action: 'archive'
      });
    }
  }
}
```

## 六、成功指标

| 指标 | 目标 |
|------|------|
| sync 容量警告出现率 | < 5% |
| 归档操作成功率 | > 99% |
| 用户归档功能使用率 | > 20% |

## 七、版本规划

- [ ] 容量监控和警告
- [ ] 手动归档单条笔记
- [ ] 归档管理页面
- [ ] 恢复归档笔记
- [ ] 批量归档
- [ ] 自动归档规则

## 八、附录

### 8.1 Chrome Storage 对比

| 特性 | storage.sync | storage.local |
|------|--------------|---------------|
| 容量 | ~100KB | ~5MB |
| 跨设备同步 | ✅ 是 | ❌ 否 |
| 读取速度 | 快 | 快 |
| 写入限制 | ~1次/秒 | 无限制 |
| 离线可用 | ✅ 是 | ✅ 是 |

### 8.2 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2025-01-11 | v0.0.2 | 初始版本 |
