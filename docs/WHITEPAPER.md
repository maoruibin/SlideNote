# SlideNote 项目白皮书

> **版本**: v1.0
> **更新日期**: 2025-01-23
> **项目状态**: v0.0.7 开发中

本文档是 SlideNote 项目的**完整规范说明**，涵盖产品定位、技术架构、开发规范、发布流程等所有方面。请将此文档作为项目运作的权威参考。

---

## 目录

1. [产品概述](#一产品概述)
2. [技术架构](#二技术架构)
3. [目录结构规范](#三目录结构规范)
4. [开发工作流](#四开发工作流)
5. [发布流程](#五发布流程)
6. [自动化系统](#六自动化系统)
7. [设计规范](#七设计规范)
8. [文档规范](#八文档规范)
9. [代码规范](#九代码规范)
10. [协作规范](#十协作规范)

---

## 一、产品概述

### 1.1 产品定位

SlideNote 是**Chrome 侧边栏碎片信息管理工具**，而非笔记应用。

**核心价值主张**：
- **侧边栏，不遮挡内容** — 这是独特的卖点
- **快速存取** — <100ms 打开，无需应用切换
- **跨设备同步** — 通过 Chrome Storage API 自动同步
- **实时搜索** — 毫秒级查找

**使用场景**：
- 存储碎片信息（API 密钥、服务器地址、命令、提示词等）
- 临时剪贴板/云剪贴板
- 快速参考信息（不离开当前页面）

**产品术语规范**：

| 使用 | 避免 |
|------|------|
| "便利贴" (sticky note) | "笔记本" (notebook) |
| "碎片信息" (fragments) | "笔记" (notes) |
| "快速存取" (quick access) | "写作" (writing) |
| "不遮挡内容" (never blocks content) | "悬浮窗口" (floating window) |
| "云剪贴板" (cloud clipboard) | "知识库" (knowledge base) |

### 1.2 技术选型原则

1. **No Framework** — 使用原生 ES6+ JavaScript
2. **Minimal Dependencies** — 仅保留必要依赖（Vite、TypeScript、marked.js）
3. **Performance First** — 优先考虑加载速度和运行效率
4. **Long-term Viability** — 无框架升级风险，代码长期有效

### 1.3 当前状态

- **最新版本**: v0.0.7（开发中）
- **核心功能**: 碎片信息管理、实时搜索、Markdown 支持、置顶功能、导出/导入
- **技术栈**: Vanilla JS + Vite + Chrome Storage Sync API

---

## 二、技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Browser                       │
├─────────────────────────────────────────────────────────┤
│  Side Panel API (Chrome 114+)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              SlideNote Extension                  │  │
│  │  ┌─────────────┐  ┌───────────────────────────┐  │  │
│  │  │ NoteList    │  │    NoteEditor             │  │  │
│  │  │ (左侧列表)   │  │    (右侧编辑区)            │  │  │
│  │  └──────┬──────┘  └─────────────┬─────────────┘  │  │
│  │         │                      │                 │  │
│  │         └──────────┬───────────┘                 │  │
│  │                    ▼                            │  │
│  │         ┌────────────────────┐                   │  │
│  │         │   EventBus         │  组件通信          │  │
│  │         └────────┬───────────┘                   │  │
│  │                  ▼                               │  │
│  │         ┌────────────────────┐                   │  │
│  │         │     Store          │  状态管理           │  │
│  │         │  (Chrome Storage)  │                   │  │
│  │         └────────────────────┘                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Chrome Storage Sync  │  云同步
              └───────────────────────┘
```

### 2.2 核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| Store | `src/sidepanel/core/Store.js` | 数据层，Chrome Storage 封装 |
| EventBus | `src/sidepanel/core/EventBus.js` | 组件间通信 |
| AutoSaver | `src/sidepanel/core/AutoSaver.js` | 防抖自动保存 |
| NoteList | `src/sidepanel/components/NoteList.js` | 左侧笔记列表 |
| NoteEditor | `src/sidepanel/components/NoteEditor.js` | 右侧编辑区 |
| SearchBar | `src/sidepanel/components/SearchBar.js` | 搜索栏 |

### 2.3 数据模型

```javascript
// 笔记对象
{
  id: "note_${timestamp}_${random}",
  title: "string",
  content: "string",
  pinned: boolean,      // 是否置顶 (v0.0.7)
  createdAt: number,    // 创建时间戳
  updatedAt: number     // 更新时间戳
}
```

### 2.4 存储设计

**Chrome Storage Sync API 限制**：
- 单个项目: ~8KB
- 总容量: ~100KB
- 写入频率: ~1次/秒（限流）

**存储键**：
- `slidenote_notes`: 笔记数组
- `slidenote_active_id`: 当前选中笔记 ID

---

## 三、目录结构规范

### 3.1 项目根目录

```
SlideNote/
├── src/                     # 源代码
│   └── sidepanel/           # 侧边栏应用
├── _locales/               # 国际化资源
├── public/                 # 静态资源
├── dist/                   # 构建输出（.gitignore）
├── releases/               # 发布版本包归档
│   └── v{version}/         # 按版本组织
├── .github/                # GitHub 配置
│   └── workflows/          # CI/CD 工作流
├── docs/                   # 文档中心
│   ├── planning/           # 需求讨论（临时）
│   ├── versions/           # 版本文档（按版本组织）
│   ├── design/             # 设计资源
│   └── _templates/         # 文档模板
├── scripts/                # 自动化脚本
├── .claude/                # Claude Code 配置
│   └── skills/             # 项目技能
├── manifest.json           # 生产版本配置
├── manifest.dev.json       # 开发版本配置
├── .releaserc.json         # release-it 配置
├── package.json            # 项目配置
├── CHANGELOG.md            # 对外更新日志
├── WORKFLOW.md             # 工作流程文档
├── CLAUDE.md               # Claude Code 指引
└── WHITEPAPER.md           # 本文件
```

### 3.2 版本目录结构

```
docs/versions/vX.X.X/
├── README.md                # 版本概述
├── features/                # 新功能
│   └── {feature-name}/
│       ├── PRD.md           # 产品需求
│       ├── UI-Spec.md       # UI 设计
│       └── Tech-Spec.md     # 技术方案
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

## 四、开发工作流

### 4.1 工作流阶段

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

### 4.2 阶段 1：需求讨论

**位置**: `docs/planning/`

**目的**: 收集需求，讨论可行性，不做版本承诺

**工作内容**:
- 记录用户反馈和产品想法
- 制作原型 HTML（如需）
- 可行性分析

### 4.3 阶段 2：版本规划

**触发条件**:
- 积累一定数量的需求
- 或有重要功能需要优先发布

**操作**:
1. 确定版本号（如 v0.0.8）
2. 创建版本目录
3. 将相关文档从 `docs/planning/` 移动到对应分类目录

### 4.4 阶段 3：开发实现

**工作内容**:
1. **编码**: 在 `src/` 目录实现功能
2. **文档同步**: 更新对应的技术文档
3. **自测**: 本地测试功能

**开发命令**:
```bash
npm run dev           # 开发服务器
npm run build:dev     # 构建开发版本
npm run build:prod    # 构建生产版本
npm run type-check    # 类型检查
```

### 4.5 阶段 4：版本发布

详见 [五、发布流程](#五发布流程)

---

## 五、发布流程

### 5.1 发布前检查清单

- [ ] 所有 PRD 中的功能已实现
- [ ] 通过本地测试
- [ ] 版本文档已准备（`docs/versions/v{version}/README.md`）
- [ ] Git 工作区干净

### 5.2 发布步骤

#### 1. 预发布检查

```bash
npm run release:check
```

检查项：
- Git 工作区是否干净
- 版本号格式是否正确 (X.Y.Z)
- package.json 与 manifest.json 版本是否同步

#### 2. 执行发布（交互式）

```bash
npx release-it
```

release-it 自动完成：
- 询问版本升级类型（major/minor/patch）
- 更新 package.json 版本号
- 同步版本号到 manifest.json / manifest.dev.json
- 构建生产版本
- 打包发布包
- 生成 CHANGELOG 条目
- 创建 git commit 和 tag

#### 3. 推送代码

```bash
git push origin main
git push origin v{version}  # 触发 CI 验证
```

#### 4. 创建 GitHub Release

```bash
gh release create v{version} \
  --title "v{version}" \
  --notes-file - < CHANGELOG.md
```

#### 5. 归档发布包

```bash
npm run archive  # 归档到 releases/v{version}/
```

#### 6. 提交到 Chrome Web Store

#### 7. 生成推广文案（可选）

使用 Claude Code 技能：`/generate-post`

### 5.3 版本号规则

遵循语义化版本 (Semantic Versioning)：

```
MAJOR.MINOR.PATCH

例：0.0.7
 ├─ MAJOR (0): 不兼容的 API 变更
 ├─ MINOR (0): 向后兼容的功能新增
 └─ PATCH (7): 向后兼容的问题修复
```

| 变更类型 | 版本升级 | 示例 |
|---------|---------|------|
| Breaking Changes | major | 0.0.7 → 1.0.0 |
| 新功能 | minor | 0.0.7 → 0.1.0 |
| Bug 修复 | patch | 0.0.7 → 0.0.8 |

---

## 六、自动化系统

### 6.1 release-it

项目使用 **release-it** 进行自动化版本管理。

**配置文件**: `.releaserc.json`

**Hooks**:
- `before:init`: 运行预发布检查
- `after:bump`: 同步版本号到 manifest
- `after:release`: 归档发布包

### 6.2 自动化脚本

| 脚本 | 功能 |
|------|------|
| `scripts/sync-manifest.mjs` | 同步版本号到 manifest |
| `scripts/pre-release-check.mjs` | 发布前检查 |
| `scripts/generate-changelog.mjs` | 生成 CHANGELOG |
| `scripts/archive-package.mjs` | 归档发布包 |

### 6.3 GitHub Actions

**工作流**: `.github/workflows/release.yml`

**功能**:
- 验证构建成功
- 检查版本号匹配
- 创建发布包

**注意**: CI 仅验证，不自动创建 Release

### 6.4 Claude Code 技能

位于 `.claude/skills/` 目录，符合 Claude Code 官方规范，用于 AI 辅助自动化。

| 技能 | 触发词 | 功能 |
|------|--------|------|
| release | "发布"、"release" | 完整发布流程 |
| bump-version | "升级版本号"、"bump version" | 分析变更并推荐版本 |
| generate-post | "生成推广文案"、"generate post" | 生成多平台推广文案 |

**使用示例**:
```
用户: 帮我发布新版本
Claude: [执行 /release 技能，自动运行发布流程]
```

---

## 七、设计规范

### 7.1 设计系统

完整设计规范：`docs/versions/v0.0.7/design/UI-Design-System.md`

### 7.2 核心设计原则

1. **简洁优先** — 减少视觉干扰
2. **即时反馈** — 所有操作都有明确的视觉反馈
3. **轻量化** — 保持轻量，不使用厚重的设计元素
4. **一致性** — 相同功能使用相同的交互模式

### 7.3 设计要素速查

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

### 7.4 设计流程

1. **查阅现有规范** — 先检查设计规范文档
2. **使用现有组件** — 优先复用已定义的组件样式
3. **原型验证** — 使用 HTML 原型验证设计效果
4. **文档更新** — 新组件需补充到设计规范中

---

## 八、文档规范

### 8.1 文档类型

| 类型 | 模板 | 用途 |
|------|------|------|
| PRD | `docs/_templates/PRD-Template.md` | 产品需求文档 |
| Tech-Spec | `docs/_templates/Tech-Spec-Template.md` | 技术实现方案 |
| UI-Spec | 参考设计规范 | UI 设计规范 |

### 8.2 版本文档要求

每个版本必须包含：
- `README.md` — 版本概述
- 每个功能/bug/优化的独立目录
- 相应的 PRD 和 Tech-Spec

### 8.3 文档命名规范

```
docs/versions/vX.X.X/
├── features/
│   └── {kebab-case-feature-name}/
│       ├── PRD.md
│       ├── UI-Spec.md（如需要）
│       └── Tech-Spec.md
├── bugs/
│   └── {kebab-case-bug-name}/
│       ├── PRD.md
│       └── Tech-Spec.md
└── optimizations/
    └── {kebab-case-opt-name}/
        ├── PRD.md
        └── Tech-Spec.md
```

---

## 九、代码规范

### 9.1 JavaScript 规范

1. **使用 ES6+ 语法**
2. **组件继承 Component 基类**
3. **通过 EventBus 通信**，不直接引用其他组件
4. **使用 CSS 变量**，避免硬编码样式值

### 9.2 组件通信模式

```javascript
// 发送事件
bus.emit('note:select', noteId);
bus.emit('note:create');
bus.emit('note:delete-request', note);

// 监听事件
const unsubscribe = bus.on('note:select', (id) => {
  // 处理逻辑
});

// 取消监听
unsubscribe();
```

### 9.3 存储规范

- 所有数据操作通过 Store
- 注意 Chrome Storage 限制
- 实现容量预警（90% 时警告）

### 9.4 CSS 规范

- 使用 CSS 变量定义设计令牌
- BEM 命名规范（如适用）
- 避免内联样式

---

## 十、协作规范

### 10.1 Git Commit 规范

遵循 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `perf`: 性能
- `test`: 测试
- `chore`: 构建/工具
- `BREAKING CHANGE`: 破坏性变更

### 10.2 分支策略

- `main` — 主分支，稳定代码
- 功能分支 — 从 main 创建，完成后合并回 main

### 10.3 代码审查

虽然没有正式的代码审查流程，但在合并前应确保：
- 代码符合规范
- 功能已测试
- 文档已更新

---

## 附录

### A. 快速参考

#### 新建功能流程

```bash
# 1. 在 planning 目录讨论
docs/planning/new-feature/

# 2. 规划版本，创建目录
docs/versions/v0.0.8/
docs/versions/v0.0.8/features/new-feature/

# 3. 从模板创建文档
cp _templates/PRD-Template.md docs/versions/v0.0.8/features/new-feature/PRD.md

# 4. 开发实现
# ... 在 src/ 中编码 ...

# 5. 发布
npx release-it
```

#### 常用命令

```bash
# 开发
npm run dev
npm run build:dev
npm run build:prod

# 发布
npm run release:check
npx release-it
npm run version:sync
npm run changelog
npm run archive

# 类型检查
npm run type-check
```

### B. 重要文件索引

| 文件 | 用途 |
|------|------|
| `WHITEPAPER.md` | 本文件，项目白皮书 |
| `WORKFLOW.md` | 详细工作流程 |
| `CLAUDE.md` | Claude Code 指引 |
| `CHANGELOG.md` | 对外版本日志 |
| `docs/README.md` | 文档索引 |
| `skills/README.md` | 技能索引 |

### C. 联系与反馈

- GitHub Issues: [项目仓库]
- 公众号: [待定]

---

**文档版本**: v1.0
**最后更新**: 2025-01-23
**维护者**: SlideNote 开发团队
