# v0.0.7 导入导出功能 - 产品需求文档

> **版本**: v0.0.7
> **需求类型**: 新增功能
> **优先级**: P1
> **状态**: 规划中
> **日期**: 2025-01-21

---

## 一、需求概述

让用户可以导出笔记备份到本地，并从备份文件恢复数据。

---

## 二、功能范围

| 功能 | 说明 |
|------|------|
| 导出全部为 JSON | 完整备份，包含所有元数据，适合恢复 |
| 导出全部为 Markdown | 可读性强，适合查看和迁移到其他应用 |
| 导出单条为 Markdown | 快速分享某条笔记 |
| 导入 JSON 恢复 | 从备份文件恢复笔记数据 |

---

## 三、交互设计

### 3.1 入口位置

**笔记列表底部 ⋮ 菜单**：

```
┌────────────────────────────┐
│  [+ 新建]    [⋮ 更多]       │  ← 点击 ⋮ 展开
└────────────────────────────┘

┌──────────────┐
│ 📤 导出笔记  │  ← 导出
│ 📥 导入备份  │  ← 导入（新增）
│ 💬 意见反馈  │
└──────────────┘
```

### 3.2 导出对话框

```
┌─────────────────────────────────────────────┐
│  导出笔记                              [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  选择导出格式                               │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📦 JSON                             │   │
│  │  完整备份，适合恢复数据              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📝 Markdown                         │   │
│  │  可读性强，适合查看和迁移            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐ │
│  │   取消           │  │   导出           │ │
│  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────┘
```

### 3.3 导入对话框

```
┌─────────────────────────────────────────────┐
│  导入备份                              [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  选择备份文件（.json）                      │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  📁 选择文件                         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  或拖拽文件到此处                           │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  ☑ 合并到现有笔记（不覆盖）                 │
│                                             │
│  💡 提示：导入前请先导出当前备份            │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐ │
│  │   取消           │  │   导入           │ │
│  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────┘
```

### 3.4 导入确认（如有冲突）

```
┌─────────────────────────────────────────────┐
│  确认导入                              [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  即将导入 12 条笔记                          │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  ☑ 合并到现有笔记                           │
│     • 保留现有笔记，添加新笔记               │
│     • ID 相同的笔记将被跳过                 │
│                                             │
│  ☐ 覆盖所有笔记（危险操作）                 │
│     • 删除所有现有笔记，使用备份数据         │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐ │
│  │   取消           │  │   确认导入       │ │
│  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 四、数据格式

### 4.1 JSON 格式（导出）

```json
{
  "_meta": {
    "version": "0.0.7",
    "exportedAt": "2025-01-21T10:30:00.000Z",
    "exportedBy": "SlideNote Chrome Extension"
  },
  "data": {
    "notes": [
      {
        "id": "note_1704965400000_abc123",
        "title": "常用账号",
        "content": "Gmail: xxx@gmail.com",
        "pinned": false,
        "folderId": null,
        "createdAt": 1704965400000,
        "updatedAt": 1705051800000,
        "order": 1
      }
    ],
    "folders": [
      {
        "id": "folder_xxx",
        "name": "工作",
        "createdAt": 1704965400000,
        "order": 1
      }
    ],
    "activeNoteId": "note_1704965400000_abc123"
  }
}
```

### 4.2 Markdown 格式（单条）

```markdown
# 常用账号

> 创建于 2025-01-10 | 最后编辑 2025-01-11

Gmail: xxx@gmail.com

---

*导出自 SlideNote*
```

### 4.3 文件命名

| 类型 | 文件名格式 |
|------|-----------|
| JSON 全部 | `SlideNote-Backup-YYYY-MM-DD.json` |
| MD 全部 | `SlideNote-Notes-YYYY-MM-DD.md` |
| MD 单条 | `{标题}.md` 或 `Untitled-{id}.md` |

---

## 五、技术实现要点

### 5.1 导出功能

```javascript
// ExportManager.js
class ExportManager {
  // 导出为 JSON
  async exportJSON(notes, folders) {
    const data = {
      _meta: {
        version: '0.0.7',
        exportedAt: new Date().toISOString()
      },
      data: { notes, folders }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    this._download(blob, `SlideNote-Backup-${this._dateString()}.json`);
  }

  // 导出为 Markdown
  async exportMarkdown(notes) {
    let content = `# SlideNote 笔记备份\n\n> 导出时间：${this._dateString()}\n\n`;
    notes.forEach(note => {
      content += `\n## ${note.title || '未命名'}\n\n`;
      content += `> 创建于 ${this._formatDate(note.createdAt)}\n\n`;
      content += `${note.content}\n\n`;
      content += `---\n`;
    });
    const blob = new Blob([content], { type: 'text/markdown' });
    this._download(blob, `SlideNote-Notes-${this._dateString()}.md`);
  }

  _download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### 5.2 导入功能

```javascript
// ImportManager.js
class ImportManager {
  async importJSON(file, mode = 'merge') {
    const text = await file.text();
    const data = JSON.parse(text);

    // 验证格式
    if (!data._meta || !data.data) {
      throw new Error('无效的备份文件格式');
    }

    if (mode === 'merge') {
      return this._mergeImport(data);
    } else {
      return this._overwriteImport(data);
    }
  }

  _mergeImport(data) {
    // 合并模式：保留现有笔记，ID 相同则跳过
    const existingIds = new Set(store.state.notes.map(n => n.id));
    const newNotes = data.data.notes.filter(n => !existingIds.has(n.id));
    // 添加新笔记...
  }

  _overwriteImport(data) {
    // 覆盖模式：清空现有，使用备份
    store.state.notes = data.data.notes;
    // ...
  }
}
```

---

## 六、国际化文案

| Key | 中文 | English |
|-----|------|---------|
| exportNotes | 导出笔记 | Export Notes |
| importBackup | 导入备份 | Import Backup |
| exportDialogTitle | 导出笔记 | Export Notes |
| importDialogTitle | 导入备份 | Import Backup |
| selectFormat | 选择导出格式 | Select export format |
| formatJSON | 📦 JSON 完整备份，适合恢复 | 📦 JSON Full backup, suitable for restore |
| formatMarkdown | 📝 Markdown 可读性强，适合迁移 | 📝 Markdown Highly readable, suitable for migration |
| selectFile | 选择文件 | Select File |
| dragFileHere | 或拖拽文件到此处 | Or drag file here |
| mergeNotes | 合并到现有笔记 | Merge with existing notes |
| overwriteNotes | 覆盖所有笔记（危险操作） | Overwrite all notes (Danger) |
| confirmImport | 确认导入 | Confirm Import |
| importBackupTip | 导入前请先导出当前备份 | Please export current backup before importing |
| exportSuccess | 导出成功，文件已保存到下载文件夹 | Export successful, file saved to Downloads |
| importSuccess | 导入成功，已恢复 $1$ 条笔记 | Import successful, restored $1$ notes |
| invalidFile | 无效的备份文件格式 | Invalid backup file format |
| noNotesToExport | 还没有笔记可导出 | No notes to export |

---

## 七、验收标准

### 导出功能
- [ ] 可导出全部笔记为 JSON
- [ ] 可导出全部笔记为 Markdown
- [ ] 可导出单条笔记为 Markdown
- [ ] 导出文件命名正确（含日期）
- [ ] 导出成功有提示

### 导入功能
- [ ] 可选择本地 JSON 文件导入
- [ ] 支持拖拽文件导入
- [ ] 合并模式：不覆盖现有笔记
- [ ] 覆盖模式：清空并使用备份数据
- [ ] 导入前有确认提示
- [ ] 导入成功有提示

### 边界情况
- [ ] 没有笔记时禁用导出
- [ ] 无效文件格式有提示
- [ ] 导入时数据版本不兼容有提示

---

## 八、实施计划

| 步骤 | 任务 | 预估工时 |
|------|------|----------|
| 1 | 创建 ExportManager 类 | 1h |
| 2 | 创建 ImportManager 类 | 1.5h |
| 3 | 底部 ⋮ 菜单 UI | 30min |
| 4 | 导出对话框 UI | 1h |
| 5 | 导入对话框 UI | 1h |
| 6 | 国际化文案 | 30min |
| 7 | 测试与调试 | 1h |

**总计**：约 6.5 小时

---

> **设计原则**：无设置页面，入口在笔记列表底部菜单，操作简单直观。
