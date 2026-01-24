---
name: bump-version
description: Intelligent version bumping for SlideNote. Analyzes changes since last release and recommends appropriate version increment (major/minor/patch). Usage: say "bump version" or "升级版本号" to analyze and update.
---

# Bump Version Skill - 执行指令

## 触发条件
用户说以下内容时触发此技能：
- "升级版本号"
- "bump version"
- "应该升到什么版本"
- "版本号分析"
- "下一个版本是什么"

## 执行步骤

### Step 1: Get Current Version
读取当前版本号：
```bash
grep '"version"' package.json
```

### Step 2: Analyze Changes

#### 2.1 Get Last Tag
```bash
git describe --tags --abbrev=0 HEAD^..HEAD
```

#### 2.2 Get Commits Since Last Tag
```bash
git log $(git describe --tags --abbrev=0 HEAD^..HEAD)..HEAD --oneline
```

#### 2.3 Read Version Documentation (if exists)
检查是否存在下一版本的文档目录：
- `docs/versions/v{current_major}.{current_minor}.{current_patch + 1}/`
- 扫描 `features/`、`bugs/`、`optimizations/` 子目录

### Step 3: Classify Changes

根据 commit message 和文件变更分类：

| 类型 | 说明 | 版本升级 |
|------|------|----------|
| Breaking | 破坏性变更、API 移除 | major |
| Feat | 新功能、新特性 | minor |
| Fix | Bug 修复 | patch |
| Perf | 性能优化 | patch |
| Refactor | 重构（无功能变更） | patch |
| Docs | 文档更新 | - (可跳过) |
| Style | 代码格式 | - (可跳过) |
| Chore | 构建、配置 | - (可跳过) |

### Step 4: Determine Version Increment

基于分类结果：

```
IF 有 breaking changes THEN
    推荐升级 major
ELSE IF 有新功能 (feat) THEN
    推荐升级 minor
ELSE IF 有 bug 修复 (fix) 或优化 (perf/refactor) THEN
    推荐升级 patch
ELSE
    提示：无实质性变更，是否需要发布？
END IF
```

### Step 5: Present Analysis

展示分析结果：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           版本号分析报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

当前版本: {current_version}
上次发布: {last_tag}

变更统计:
  📦 新功能 (feat):     {feat_count} 项
  🐛 Bug 修复 (fix):     {fix_count} 项
  ⚡ 性能优化 (perf):    {perf_count} 项
  🔧 重构 (refactor):   {refactor_count} 项
  📝 文档更新 (docs):    {docs_count} 项
  💥 破坏性变更:        {breaking_count} 项

推荐版本: {recommended_version}
推荐理由: {reason}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6: Confirm and Execute

询问用户：
1. 是否接受推荐版本？
2. 或输入自定义版本号？

用户确认后执行：
```bash
npm version {version_type} --no-git-tag-version
npm run version:sync
```

显示执行结果：
```
✓ package.json 已更新: {old_version} → {new_version}
✓ manifest.json 已同步
✓ manifest.dev.json 已同步
```

### Step 7: Next Steps

提醒用户：
- 版本号已更新，但尚未创建 commit 和 tag
- 可以继续开发，或执行 `/release` 完成发布

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 无 git tags | 假设为首次发布，分析所有 commits |
| 无实质性变更 | 询问是否仍需发布 |
| 版本格式错误 | 报告并等待手动修复 |

## Conventional Commits 规范

建议的 commit message 格式（用于分析）：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型 (type)：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `perf`: 性能
- `test`: 测试
- `chore`: 构建/工具
- `BREAKING CHANGE`: 破坏性变更

## 相关文件

| 文件 | 用途 |
|------|------|
| `package.json` | 主版本号 |
| `manifest.json` | 生产 manifest 版本 |
| `manifest.dev.json` | 开发 manifest 版本 |
| `scripts/sync-manifest.mjs` | 版本号同步脚本 |

## 可用的 npm scripts

```bash
# 手动版本升级
npm version major   # 1.0.0
npm version minor   # 0.1.0
npm version patch   # 0.0.8

# 自定义版本号
npm version 0.2.0 --no-git-tag-version

# 同步到 manifest
npm run version:sync
```
