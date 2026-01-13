# SlideNote v0.0.2 版本文档

> **侧边笔记，常伴左右**
> **状态**: 开发中

---

## 版本概述

v0.0.2 版本在 v0.0.1 MVP 基础上，增加数据归档和导出功能，解决 Chrome Storage 容量限制问题。

### 主要目标

- 解决 Chrome Storage Sync 100KB 容量限制
- 提供数据备份和导出能力
- 优化现有功能体验

---

## 目录结构

```
v0.0.2/
├── README.md              # 本文件
├── bugs/                  # Bug 修复
├── features/              # 新功能
│   ├── archive-storage/   # 存储归档功能
│   └── export-data/       # 数据导出功能
└── optimizations/         # 体验优化
```

---

## 功能清单

| 类型 | 名称 | 优先级 | 状态 | 文档 |
|------|------|--------|------|------|
| 新功能 | 数据导出 | P0 | 设计中 | [PRD](./features/export-data/PRD.md) \| [Tech](./features/export-data/Tech-Spec.md) \| [UI](./features/export-data/UI-Spec.md) |
| 优化 | (待添加) | - | - | - |
| Bug | (待添加) | - | - | - |

---

## 新增功能详情

### 存储归档 (archive-storage)

将不常用的旧笔记归档到 `storage.local`，释放 sync 存储空间。

- **问题**: Chrome Storage Sync 只有 100KB 容量
- **方案**: 手动/自动归档旧笔记到 local 存储
- **文档**: [PRD](./features/archive-storage/PRD.md)

### 数据导出 (export-data)

支持将笔记导出为 JSON 或 Markdown 格式，方便备份和迁移。

- **格式**: JSON（完整备份）、Markdown（方便查看）
- **范围**: 全部笔记、当前笔记、归档笔记
- **文档**: [PRD](./features/export-data/PRD.md) | [Tech-Spec](./features/export-data/Tech-Spec.md)

---

## 文档规范

### 新建需求文档流程

1. 确定需求类型（bug / feature / optimization）
2. 在对应目录创建文件夹
3. 复制模板并填写内容：
   - `PRD.md` - 产品需求文档
   - `Tech-Spec.md` - 技术方案文档（可选）
   - `UI-Spec.md` - UI 设计文档（如需要）
4. 更新本 README 的功能清单

### 文档模板

- [PRD 模板](../../_templates/PRD-Template.md)
- [Tech-Spec 模板](../../_templates/Tech-Spec-Template.md)

---

## 变更记录

| 日期 | 变更内容 |
|------|----------|
| 2025-01-12 | 初始版本，建立目录结构和文档规范；完善导出功能 PRD |
