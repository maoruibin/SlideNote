# SlideNote 项目文档

> **Slide notes, always by your side**
> **侧边笔记，常伴左右**

## 文档结构

```
docs/
├── README.md                 # 本文件
├── CHANGELOG.md             # 版本更新日志
├── _templates/              # 文档模板
│   ├── PRD-Template.md      # PRD 模板
│   └── Tech-Spec-Template.md # 技术方案模板
└── versions/
    ├── v0.0.1/              # MVP 版本
    │   ├── requirements/    # 需求文档
    │   ├── ui-design/       # UI 设计
    │   ├── tech-design/     # 技术方案
    │   └── i18n/            # 国际化方案
    └── v0.0.2/              # 归档和导出版本
        ├── bugs/            # Bug 修复
        ├── features/        # 新功能
        └── optimizations/   # 体验优化
```

## 版本管理规范

### v0.0.1 及之前

每个版本文件夹包含：
- **requirements/**: 产品需求文档 (PRD)
- **ui-design/**: UI 设计稿、交互说明
- **tech-design/**: 技术方案、API 设计、数据结构

### v0.0.2 及之后

每个需求按类型分类，独立建文件夹：

```
vX.X.X/
├── README.md                # 版本概述
├── bugs/                    # Bug 修复
│   └── {bug-name}/
│       ├── PRD.md
│       ├── Tech-Spec.md
│       └── UI-Spec.md (可选)
├── features/                # 新功能
│   └── {feature-name}/
│       ├── PRD.md
│       ├── Tech-Spec.md
│       └── UI-Spec.md (可选)
└── optimizations/           # 体验优化
    └── {opt-name}/
        ├── PRD.md
        ├── Tech-Spec.md
        └── UI-Spec.md (可选)
```

### 新建需求文档流程

1. 确定需求类型（bug / feature / optimization）
2. 在对应目录创建文件夹
3. 复制模板并填写内容
4. 更新版本 README.md

## 版本历史

| 版本 | 日期 | 状态 | 说明 |
|------|------|------|------|
| v0.0.1 | 2025-01-11 | 已完成 | MVP 版本：基础笔记功能 |
| v0.0.2 | 2025-01-12 | 开发中 | 存储归档 + 数据导出 |

## 快速导航

### 当前版本

- [v0.0.2 归档和导出](./versions/v0.0.2/) - 正在开发的版本

### 历史版本

- [v0.0.1 MVP](./versions/v0.0.1/) - 基础笔记功能

### 模板

- [PRD 模板](./_templates/PRD-Template.md)
- [Tech-Spec 模板](./_templates/Tech-Spec-Template.md)
