# SlideNote 工作流程

> **版本**: v2.0
> **更新日期**: 2025-01-23

本文档定义 SlideNote 项目的开发工作流程，确保需求、设计、开发、发布的规范化管理。

---

## 一、工作流程概览

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  需求讨论    │ -> │  版本规划    │ -> │  开发实现    │ -> │  版本发布    │
│  Planning   │    │  Versioning  │    │  Development │    │  Release     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │                   │
      v                   v                   v                   v
 docs/planning/    docs/vX.X.X/       src/            releases/
                                         _locales/       CHANGELOG.md
```

---

## 二、详细工作流程

### 阶段 1：需求收集与讨论

**目标**: 收集需求，讨论可行性，不做版本承诺

**位置**: `docs/planning/`

```bash
docs/planning/
├── favorite-function/       # 收藏功能讨论
├── dark-mode/               # 暗黑模式讨论
└── sync-improvement/        # 同步优化讨论
```

**工作内容**:
- 记录用户反馈和产品想法
- 制作原型 HTML（如需）
- 可行性分析
- **不承诺版本号**

**进入下一阶段的条件**:
- 需求明确，优先级确定
- 基本设计方案达成一致

---

### 阶段 2：版本规划

**目标**: 确定版本内容，创建版本目录

**触发条件**:
- 积累一定数量的需求
- 或有重要功能需要优先发布

**操作**:
1. 确定版本号（如 v0.0.6）
2. 创建版本目录：
   ```bash
   docs/versions/v0.0.6/
   ├── README.md              # 版本概述
   ├── features/              # 新功能
   ├── bugs/                  # Bug 修复
   └── optimizations/         # 体验优化
   ```

3. 将 `docs/planning/` 中相关文档移动到对应分类目录

---

### 阶段 3：开发实现

**目标**: 完成功能开发和测试

**工作内容**:
1. **编码**: 在 `src/` 目录实现功能
2. **文档同步**: 更新对应的技术文档
3. **自测**: 本地测试功能

**文档规范**:
每个需求包含以下文档（按需）：
```
feature-name/
├── PRD.md           # 产品需求文档
├── UI-Spec.md       # UI 设计规范（如有交互变化）
├── Tech-Spec.md     # 技术实现方案
└── prototype.html   # 原型文件（如需）
```

---

### 阶段 4：版本发布

**目标**: 打包发布，更新版本信息

**发布前检查清单**:
- [ ] 所有 PRD 中的功能已实现
- [ ] 通过本地测试
- [ ] 版本文档已准备（`docs/versions/v{version}/README.md`）
- [ ] Git 工作区干净

**发布流程（自动化）**:

1. **运行预发布检查**
   ```bash
   npm run release:check
   ```

2. **执行发布（交互式）**
   ```bash
   npx release-it
   ```

   release-it 会自动完成：
   - 询问版本升级类型（major/minor/patch）
   - 更新 package.json 版本号
   - 同步版本号到 manifest.json / manifest.dev.json
   - 构建生产版本
   - 打包发布包
   - 生成 CHANGELOG 条目
   - 创建 git commit 和 tag

3. **推送代码**
   ```bash
   git push origin main
   git push origin v{version}  # 触发 CI 验证
   ```

4. **创建 GitHub Release**
   ```bash
   gh release create v{version} \
     --title "v{version}" \
     --notes-file - < CHANGELOG.md
   ```

5. **归档发布包**
   ```bash
   npm run archive  # 归档到 releases/v{version}/
   ```

6. **提交到 Chrome Web Store**

7. **生成推广文案（可选）**
   ```bash
   # 使用 Claude Code 技能
   /generate-post
   ```

**可用的 npm scripts**:

| 命令 | 功能 |
|------|------|
| `npm run release:check` | 发布前检查 |
| `npm run version:sync` | 同步版本号到 manifest |
| `npm run changelog` | 生成 CHANGELOG |
| `npm run archive` | 归档发布包 |
| `npx release-it` | 完整发布流程 |

---

## 三、目录结构规范

### 项目根目录

```
SlideNote/
├── src/                     # 源代码
├── _locales/               # 国际化资源
├── public/                 # 静态资源
├── dist/                   # 构建输出（.gitignore）
├── releases/               # 发布版本包归档
│   └── v{version}/         # 按版本组织
├── .github/                # GitHub 配置
│   └── workflows/          # CI/CD 工作流
│       └── release.yml     # 发布构建验证
├── docs/                   # 文档中心
│   ├── planning/           # 需求讨论（临时）
│   ├── versions/           # 版本文档（按版本组织）
│   ├── design/             # 设计资源
│   ├── marketing/          # 营销素材
│   ├── _templates/         # 文档模板
│   ├── CHANGELOG.md        # 版本更新日志
│   └── README.md           # 文档索引
├── scripts/                # 自动化脚本
│   ├── package.mjs         # 打包脚本
│   ├── prepare-dist.mjs    # 构建准备
│   ├── sync-manifest.mjs   # 版本号同步
│   ├── pre-release-check.mjs # 发布前检查
│   ├── generate-changelog.mjs # CHANGELOG 生成
│   └── archive-package.mjs # 归档脚本
├── .claude/                # Claude Code 配置
│   └── skills/             # 项目技能
│       ├── README.md       # 技能索引
│       ├── release.md      # 发布技能
│       ├── bump-version.md # 版本升级技能
│       └── generate-post.md # 推广文案生成
├── .releaserc.json         # release-it 配置
├── package.json            # 项目配置
├── CHANGELOG.md            # 根目录更新日志（对外）
├── WORKFLOW.md             # 本文件
└── CLAUDE.md               # Claude Code 指引
```

### 版本目录结构

```
docs/versions/vX.X.X/
├── README.md                # 版本概述
├── features/                # 新功能
│   └── {feature-name}/
│       ├── PRD.md
│       ├── UI-Spec.md
│       ├── Tech-Spec.md
│       └── prototype.html
├── bugs/                    # Bug 修复
│   └── {bug-name}/
│       ├── PRD.md
│       └── Tech-Spec.md
└── optimizations/           # 体验优化
    └── {opt-name}/
        ├── PRD.md
        └── Tech-Spec.md
```

---

## 四、版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号**: 重大架构变更（不适用当前阶段）
- **次版本号**: 新功能发布（0.1.0 → 0.2.0）
- **修订号**: Bug 修复、小优化（0.0.1 → 0.0.2）

当前阶段（开发初期）建议：
- 每个包含新功能的版本 → 次版本号 +1
- 纯 Bug 修复 → 修订号 +1

---

## 五、文档模板

### PRD 模板位置
`docs/_templates/PRD-Template.md`

### Tech-Spec 模板位置
`docs/_templates/Tech-Spec-Template.md`

---

## 六、快速参考

### 新建功能流程

```bash
# 1. 在 planning 目录讨论
docs/planning/new-feature/

# 2. 规划版本，创建目录
docs/versions/v0.0.7/
docs/versions/v0.0.7/features/new-feature/

# 3. 从模板创建文档
cp _templates/PRD-Template.md docs/versions/v0.0.7/features/new-feature/PRD.md

# 4. 开发实现
# ... 在 src/ 中编码 ...

# 5. 发布
npm run build:prod && npm run package:prod
```

### 版本发布检查清单

| 项目 | 状态 |
|------|------|
| 版本号更新 | ☐ |
| CHANGELOG 更新 | ☐ |
| 功能测试通过 | ☐ |
| 构建成功 | ☐ |
| 发布包生成 | ☐ |
| 版本文档归档 | ☐ |

---

## 七、UI 设计规范

**所有 UI 设计必须遵循统一的设计规范**，确保产品一致性。

### 设计规范文档

📄 **完整设计规范**: [docs/versions/v0.0.7/design/UI-Design-System.md](docs/versions/v0.0.7/design/UI-Design-System.md)

🎨 **组件可视化展示**: [docs/versions/v0.0.7/design/UI-Components-Showcase.html](docs/versions/v0.0.7/design/UI-Components-Showcase.html)

### 核心设计原则

| 原则 | 说明 |
|------|------|
| **简洁优先** | 减少视觉干扰，让用户专注于内容 |
| **即时反馈** | 所有操作都有明确的视觉反馈 |
| **轻量化** | 保持轻量，不使用厚重的设计元素 |
| **一致性** | 相同功能使用相同的交互模式 |

### 设计要素速查

```css
/* 主色 */
--color-primary: #3b82f6;

/* 字体大小 */
11px - 版本号、辅助信息
12px - 预览、时间戳
13px - 菜单、按钮（默认）
14px - 标题、正文
16px - 弹窗标题

/* 间距 */
4px  - 图标与文字
8px  - 相关元素
12px - 组件内边距
16px - 区块间距

/* 圆角 */
4px  - 标签
6px  - 按钮、输入框
8px  - 卡片、菜单
12px - 弹窗、容器
```

### 设计流程

1. **查阅现有规范** — 先检查设计规范文档
2. **使用现有组件** — 优先复用已定义的组件样式
3. **原型验证** — 使用 HTML 原型验证设计效果
4. **文档更新** — 新组件需补充到设计规范中

### 组件模板

新增 UI 组件时，参考以下模板结构：

```
feature-name/
├── PRD.md              # 产品需求
├── UI-Spec.md          # UI 设计（引用设计规范）
└── prototype.html      # 交互原型
```

---

## 八、工作文件

| 文件 | 用途 | 维护者 |
|------|------|--------|
| CLAUDE.md | Claude Code 项目指引 | 开发者 |
| CHANGELOG.md | 对外版本日志 | 发布时 |
| docs/README.md | 文档索引 | 每次 |
| docs/versions/v0.0.7/design/UI-Design-System.md | **UI 设计规范（必遵循）** | 设计更新时 |
| docs/versions/vX.X.X/README.md | 版本概述 | 版本启动时 |
