# SlideNote 自动化发布系统 - 设计方案 v2.0

> **文档类型**: 技术方案设计
> **版本**: v2.0
> **日期**: 2025-01-23
> **状态**: 实施中
> **修订说明**: 根据 review 意见调整技术选型和实施细节

---

## 一、背景

### 1.1 现状分析

SlideNote 项目当前已有完善的工作流文档（WORKFLOW.md），但每次版本发布仍需大量手动操作：

| 操作项 | 当前方式 | 耗时 | 错误风险 |
|--------|----------|------|----------|
| 版本号升级 | 手动编辑 3 个文件 | ~2分钟 | 🔴 高（容易遗漏） |
| CHANGELOG 生成 | 手动编写 | ~10分钟 | 🟡 中 |
| 版本文档归档 | 手动创建目录 | ~5分钟 | 🟡 中 |
| 构建打包 | `npm run package:prod` | ~1分钟 | 🟢 低 |
| Git 提交/Tag | 手动执行命令 | ~3分钟 | 🟡 中 |
| GitHub Release | 使用 gh CLI 或网页 | ~5分钟 | 🟡 中 |
| 推广文案 | 手动编写 | ~30分钟 | 🔴 高 |

**总计**: 每次发布约 56 分钟，且存在多处容易出错的环节。

### 1.2 问题痛点

1. **版本号分散**: `package.json`、`manifest.json`、`manifest.dev.json` 三处需同步
2. **文档维护繁琐**: 版本文档、CHANGELOG、Release Notes 需重复编写
3. **人工审核依赖**: Chrome Web Store 审核必须人工，但其他环节可自动化
4. **推广内容生产慢**: 每个平台需要不同风格的文案
5. **发布流程不规范**: 容易遗漏检查项

### 1.3 目标

构建一套**分层自动化**的发布系统，实现：

- ✅ 版本号一处修改，处处同步
- ✅ CHANGELOG 自动生成
- ✅ 一键执行完整发布流程
- ✅ 推广文案智能生成
- ✅ 人工环节最小化（仅保留必须的审核步骤）

---

## 二、方案选型

### 2.1 技术选型对比

| 方案 | 工具/技术 | 优势 | 劣势 | 结论 |
|------|-----------|------|------|------|
| **方案 A: changeset** | `@changesets/cli` | 现代推荐、monorepo 友好 | 对单仓库过重 | 🟡 备选 |
| **方案 B: release-it** | `release-it` | 交互式、活跃维护、适合单仓库 | 需要配置 | ✅ **推荐** |
| **方案 C: semantic-release** | `semantic-release` | 完全无人值守 | 配置复杂、过度设计 | 🔴 不推荐 |
| **方案 D: 自建脚本** | 定制 Node.js 脚本 | 完全可控 | 需维护代码 | 🟡 补充 |

### 2.2 最终方案：**release-it + 自建脚本 + Skills + GitHub Actions**

```
┌─────────────────────────────────────────────────────────────┐
│                   分层自动化架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  L1: 基础自动化 (release-it + 自建脚本)                    │
│      ├── 版本号自动升级 (release-it)                         │
│      ├── manifest 同步 (自建脚本)                           │
│      ├── CHANGELOG 生成 (自建脚本)                          │
│      └── 发布包归档 (自建脚本)                              │
│                                                              │
│  L2: 智能 Skills (Claude Code)                              │
│      ├── /release → 一键发布                                │
│      ├── /bump-version → 智能升级                           │
│      └── /generate-post → 推广文案                          │
│                                                              │
│  L3: CI/CD (GitHub Actions)                                 │
│      └── tag push → 验证构建 (不自动创建 Release)            │
│                                                              │
│  L4: 人工审核 (保留)                                         │
│      ├── GitHub Release 手动触发                            │
│      ├── Chrome Web Store 审核                              │
│      └── 内容质量把控                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**选型理由**：
1. **release-it** - 活跃维护、交互式确认、适合单仓库
2. **自建脚本** - 补充 release-it 不支持的功能（manifest.json 同步）
3. **Skills** - 利用 AI 处理非结构化任务（文案生成、质量检查）
4. **GitHub Actions** - 仅用于验证，降低风险

---

## 三、详细设计

### 3.1 目录结构调整

```
SlideNote/
├── .github/
│   └── workflows/
│       └── release.yml              # 🆕 CI 验证工作流
├── scripts/
│   ├── prepare-dist.mjs             # ✅ 现有
│   ├── package.mjs                  # ✅ 现有
│   ├── bump-version.mjs             # 🆕 版本号升级脚本
│   ├── sync-manifest.mjs            # 🆕 同步 manifest 版本
│   ├── generate-changelog.mjs       # 🆕 生成 CHANGELOG
│   ├── pre-release-check.mjs        # 🆕 发布前检查
│   └── archive-package.mjs          # 🆕 归档发布包
├── .claude/
│   └── skills/
│       ├── release.md               # ✅ 现有（需增强）
│       ├── bump-version.md          # 🆕 版本号升级 skill
│       └── generate-post.md         # 🆕 推广文案生成 skill
├── docs/
│   ├── _templates/
│   │   └── PRD-Template.md          # ✅ 现有
│   └── versions/
│       └── vX.X.X/                  # 版本文档
├── releases/                        # 🆕 发布包归档目录
│   └── v0.0.7/
│       └── SlideNote-v0.0.7.zip
├── .releaserc.json                  # 🆕 release-it 配置
├── CHANGELOG.md
├── package.json
├── manifest.json
└── manifest.dev.json
```

**目录说明**：
- `docs/versions/` - 版本文档（PRD、技术方案等）
- `releases/` - 发布包归档（zip 文件）
- 两者区分明确，避免混淆

---

### 3.2 release-it 配置

**`.releaserc.json`**:

```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}",
    "push": false
  },
  "npm": {
    "publish": false
  },
  "hooks": {
    "before:init": ["npm run release:check"],
    "after:bump": ["npm run version:sync"],
    "after:release": ["npm run archive"]
  },
  "github": {
    "release": false,
    "releaseName": "v${version}",
    "tokenRef": "GITHUB_TOKEN"
  }
}
```

**配置说明**：
- `push: false` - 不自动推送 tag，本地验证通过后手动推送
- `release: false` - 不自动创建 GitHub Release，由 skill 或手动触发
- `before:init` - 发布前检查
- `after:bump` - 版本号同步到 manifest
- `after:release` - 归档发布包

---

### 3.3 核心脚本设计

#### 3.3.1 `scripts/sync-manifest.mjs`

**功能**: 将 package.json 的版本号同步到 manifest 文件

```javascript
#!/usr/bin/env node

/**
 * 将 package.json 的版本号同步到 manifest.json 和 manifest.dev.json
 */

import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');

// 读取 package.json 版本号
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

// 更新 manifest.json
const manifestPath = path.join(rootDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
manifest.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// 更新 manifest.dev.json
const manifestDevPath = path.join(rootDir, 'manifest.dev.json');
const manifestDev = JSON.parse(fs.readFileSync(manifestDevPath, 'utf-8'));
manifestDev.version = version;
fs.writeFileSync(manifestDevPath, JSON.stringify(manifestDev, null, 2) + '\n');

console.log(`✓ Synced version ${version} to manifest files`);
```

---

#### 3.3.2 `scripts/generate-changelog.mjs`

**功能**: 根据版本文档生成 CHANGELOG

**数据源优先级**：
1. `docs/versions/vX.X.X/README.md`（版本文档）
2. Git commits（备选）
3. 生成模板，人工填充（兜底）

```javascript
#!/usr/bin/env node

/**
 * 根据版本文档生成 CHANGELOG 条目
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');

// 获取当前版本号
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

// 读取版本文档
const versionDocPath = path.join(rootDir, 'docs/versions', `v${version}`, 'README.md');
let changelogContent = '';

if (fs.existsSync(versionDocPath)) {
  // 从版本文档生成
  const docContent = fs.readFileSync(versionDocPath, 'utf-8');
  changelogContent = extractFromDoc(docContent);
} else {
  // 从 git commits 生成
  changelogContent = extractFromCommits(version);
}

// 添加到 CHANGELOG.md
addEntryToChangelog(version, changelogContent);

function extractFromDoc(content) {
  // 提取版本概述和功能列表
  // 实现略...
}

function extractFromCommits(version) {
  // 解析 git commits
  // 实现略...
}

function addEntryToChangelog(version, content) {
  const date = new Date().toISOString().split('T')[0];
  const entry = `## [${version}] - ${date}\n\n${content}\n\n`;

  const currentChangelog = fs.readFileSync(changelogPath, 'utf-8');
  const [header, ...rest] = currentChangelog.split('## ');

  fs.writeFileSync(changelogPath, header + entry + rest.join('## '));
  console.log(`✓ Updated CHANGELOG.md for v${version}`);
}
```

---

#### 3.3.3 `scripts/pre-release-check.mjs`

**功能**: 发布前检查

```javascript
#!/usr/bin/env node

/**
 * 发布前检查
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');

const checks = [
  {
    name: 'Git 工作区干净',
    check: () => {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      return status.trim() === '';
    }
  },
  {
    name: '版本号格式正确',
    check: () => {
      const pkgPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return /^\d+\.\d+\.\d+$/.test(pkg.version);
    }
  },
  {
    name: 'manifest 版本号同步',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
      const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf-8'));
      return pkg.version === manifest.version;
    }
  },
  {
    name: '版本文档存在',
    check: () => {
      const version = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8')).version;
      return fs.existsSync(path.join(rootDir, 'docs/versions', `v${version}`));
    }
  }
];

console.log('🔍 Running pre-release checks...\n');

let allPassed = true;
for (const check of checks) {
  const passed = check.check();
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${check.name}`);
  if (!passed) allPassed = false;
}

console.log();
if (allPassed) {
  console.log('✅ All checks passed!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix them before releasing.');
  process.exit(1);
}
```

---

#### 3.3.4 `scripts/archive-package.mjs`

**功能**: 将发布包归档到 releases/ 目录

```javascript
#!/usr/bin/env node

/**
 * 归档发布包到 releases/ 目录
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');

// 获取版本号
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version;

// 检查 tag 是否存在（仅在正式发布时归档）
try {
  execSync(`git tag -l "v${version}"`, { encoding: 'utf-8', stdio: 'pipe' });
} catch {
  console.log(`⚠️  Tag v${version} not found. Skipping archive.`);
  process.exit(0);
}

// 创建 releases 目录
const releasesDir = path.join(rootDir, 'releases', `v${version}`);
fs.mkdirSync(releasesDir, { recursive: true });

// 复制发布包
const sourceZip = path.join(rootDir, 'SlideNote-v${version}.zip');
const targetZip = path.join(releasesDir, `SlideNote-v${version}.zip`);

if (fs.existsSync(sourceZip)) {
  fs.copyFileSync(sourceZip, targetZip);
  console.log(`✓ Archived to: ${targetZip}`);
} else {
  console.log(`⚠️  Package not found: ${sourceZip}`);
}
```

---

### 3.4 Skills 设计

#### 3.4.1 `skills/release.md` (增强版)

**触发**: 用户说 "发布" 或 "release"

**执行流程**：
```
1. 执行 pre-release-check
2. 执行 release-it (交互式)
3. 构建生产版本
4. 打包
5. 归档
6. Git 提交
7. 创建 tag (本地)
8. 提示用户推送到远程
9. 提示用户创建 GitHub Release
```

#### 3.4.2 `skills/bump-version.md`

**触发**: 用户说 "升级版本" 或 "bump version"

**交互流程**：
```
用户: 升级版本
AI: 当前版本是 0.0.7，请选择升级类型:
     1. major (0.0.7 → 1.0.0) - 重大变更
     2. minor (0.0.7 → 0.1.0) - 新功能
     3. patch (0.0.7 → 0.0.8) - Bug修复

用户: minor
AI: 执行 npx release-it minor --release-v
     ... 交互式确认 ...
     ✓ 版本号已升级到 0.1.0
     ✓ manifest 文件已同步
```

#### 3.4.3 `skills/generate-post.md`

**触发**: 用户说 "生成推广文案" 或 "generate post"

**输出内容**：
- 公众号文章 (~800字)
- 微博文案 (~140字)
- 小红书文案

---

### 3.5 GitHub Actions 工作流

**`.github/workflows/release.yml`**:

```yaml
name: Release Verification

on:
  push:
    tags:
      - 'v*'

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run pre-release checks
        run: npm run release:check

      - name: Build production
        run: npm run build:prod

      - name: Package
        run: npm run package:prod

      - name: Verify build
        run: |
          echo "✓ Build verification passed!"
          echo "Ready for GitHub Release creation"

# 注意：不自动创建 GitHub Release，由用户手动或通过 skill 创建
```

---

### 3.6 package.json scripts 更新

```json
{
  "scripts": {
    // 现有
    "dev": "vite",
    "build": "vite build && node scripts/prepare-dist.mjs dev",
    "build:prod": "vite build && node scripts/prepare-dist.mjs prod",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "package": "npm run build && node scripts/package.mjs",
    "package:prod": "npm run build:prod && node scripts/package.mjs",

    // 🆕 版本管理
    "release": "npx release-it",
    "release:check": "node scripts/pre-release-check.mjs",
    "release:patch": "npx release-it patch --release-v",
    "release:minor": "npx release-it minor --release-v",
    "release:major": "npx release-it major --release-v",
    "version:sync": "node scripts/sync-manifest.mjs",
    "changelog": "node scripts/generate-changelog.mjs",
    "archive": "node scripts/archive-package.mjs"
  }
}
```

---

## 四、实施计划

### 4.1 阶段划分

| 阶段 | 任务 | 预估时间 | 依赖 |
|------|------|----------|------|
| **阶段一: 环境准备** | 安装 release-it | 0.5h | 无 |
| | 创建 .releaserc.json | 0.5h | 无 |
| | 创建 releases/ 目录 | 0.1h | 无 |
| **阶段二: 脚本开发** | sync-manifest.mjs | 0.5h | 无 |
| | pre-release-check.mjs | 1h | 无 |
| | generate-changelog.mjs | 3h | 无 |
| | archive-package.mjs | 0.5h | 无 |
| **阶段三: Skills** | 增强 release.md | 1h | 阶段一、二完成 |
| | 新增 bump-version.md | 1h | release-it 配置完成 |
| | 新增 generate-post.md | 2.5h | 无 |
| **阶段四: CI/CD** | GitHub Actions 配置 | 1h | 无 |
| **阶段五: 测试验证** | 端到端测试 | 2h | 全部完成 |

**总计**: 约 13.5 小时

### 4.2 里程碑

- **M1**: 环境准备完成 - release-it 可用
- **M2**: 脚本开发完成 - 可手动执行完整发布流程
- **M3**: Skills 完成 - 可通过对话执行发布
- **M4**: CI/CD 完成 - tag 推送自动验证
- **M5**: 全流程测试 - 验证自动化发布

### 4.3 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| CHANGELOG 生成不准确 | 用户获取信息有误 | 人工审核后再发布 |
| 版本号同步失败 | 发布版本混乱 | pre-release-check 检查 |
| GitHub Actions 失败 | 无法验证构建 | 保留手动发布路径 |
| 推广文案质量不佳 | 影响推广效果 | 生成后人工润色 |

---

## 五、验收标准

### 5.1 功能验收

- [ ] `npm run release:minor` 可正确升级版本号
- [ ] 版本号在所有文件中同步更新
- [ ] `npm run changangelog` 可生成 CHANGELOG
- [ ] `npm run release` 可完成完整发布流程
- [ ] 推送 tag 后 GitHub Actions 自动验证
- [ ] `/release` skill 可执行完整发布流程
- [ ] `/generate-post` skill 可生成三平台推广文案

### 5.2 质量验收

- [ ] 单次发布耗时 < 10 分钟（人工操作时间）
- [ ] 版本发布零错误（版本号、文件齐全）
- [ ] CHANGELOG 格式规范、信息完整
- [ ] 生成的推广文案可直接使用（少量润色）

---

## 六、Skills 使用说明

### 6.1 安装 Skills

Claude Code 的 skills 存放在项目 `skills/` 目录，需要链接到 Claude Code 配置目录：

```bash
# 方式一：软链接（推荐）
ln -s $(pwd)/skills ~/.claude/project-skills/SlideNote

# 方式二：直接读取
# Claude Code 会自动读取项目根目录的 skills/ 文件夹
```

### 6.2 使用 Skills

```
# 在 Claude Code 中
用户: /release
用户: /bump-version
用户: /generate-post
```

---

## 七、版本回滚

如果版本号升级后发现错误，可以手动回滚：

```bash
# 方式一：回退 commit
git reset --hard HEAD~1
git tag -d v0.0.8
git push origin :refs/tags/v0.0.8

# 方式二：手动修改版本号
# 编辑 package.json、manifest.json、manifest.dev.json
```

---

## 八、参考文档

- [release-it](https://github.com/release-it/release-it)
- [release-it 配置文档](https://github.com/release-it/release-it/blob/main/docs/recipes.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

> **设计原则**: 简单、可靠、可维护
> **核心价值**: 让开发者专注于产品本身，而不是发布流程

---

## 修订历史

| 版本 | 日期 | 修订内容 |
|------|------|----------|
| v1.0 | 2025-01-23 | 初版 |
| v2.0 | 2025-01-23 | 根据 review 意见调整：release-it 替代 standard-version、CI 仅验证、releases/ 目录等 |
