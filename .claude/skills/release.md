---
name: release
description: SlideNote Chrome extension release automation using release-it. Manages version bump, build, package, git tag, changelog, and GitHub release. Usage: say "发布" or "release" to start the release workflow.
---

# Release Skill - 执行指令

## 触发条件
用户说以下内容时触发此技能：
- "发布"
- "release"
- "帮我发布新版本"
- "执行发布流程"
- "开始发布"

## 执行步骤

### Step 1: Pre-release Check
运行发布前检查：
```bash
npm run release:check
```

检查项：
- Git 工作区是否干净（无未提交的更改）
- 版本号格式是否正确 (X.Y.Z)
- package.json 与 manifest.json 版本是否同步

**如果检查失败**：报告具体问题，停止执行。等待用户修复后重试。

### Step 2: Analyze Changes
分析自上次发布以来的变更：

```bash
# 获取上一个 tag
git describe --tags --abbrev=0 HEAD^..HEAD

# 获取 commits
git log $(git describe --tags --abbrev=0 HEAD^..HEAD)..HEAD --oneline
```

同时读取版本文档（如果存在）：
- `docs/versions/v{next_version}/README.md`
- 扫描 `docs/versions/v{next_version}/features/`、`bugs/`、`optimizations/` 目录

### Step 3: Version Recommendation
基于分析结果推荐版本升级：

| 变更类型 | 版本升级 | 示例 |
|---------|---------|------|
| Breaking Changes | major | 0.0.7 → 1.0.0 |
| 新功能 | minor | 0.0.7 → 0.1.0 |
| Bug 修复 | patch | 0.0.7 → 0.0.8 |

展示分析结果：
```
分析结果：
- 新功能: X 项
- Bug 修复: X 项
- 优化: X 项
- 文档更新: X 项

当前版本: {current_version}
推荐升级: {recommended_version} ({reason})
```

**询问用户确认**：
- 是否接受推荐版本？
- 或输入自定义版本号？

### Step 4: Execute Release
用户确认版本后，执行 release-it：
```bash
npx release-it --release-version {confirmed_version}
```

release-it 会自动完成：
- 更新 package.json 版本号
- 同步版本号到 manifest.json / manifest.dev.json（通过 hook）
- 构建生产版本
- 打包发布包
- 创建 git commit 和 tag

**注意**：如果 release-it 遇到错误，报告并等待用户处理。

### Step 5: Push to Remote
```bash
git push origin main
git push origin v{version}
```

### Step 6: Create GitHub Release
```bash
gh release create v{version} --title "v{version}" --notes-file - < CHANGELOG.md
```

如果 gh 命令不可用，提供手动创建链接。

### Step 7: Archive Package
```bash
npm run archive
```

归档发布包到 `releases/v{version}/` 目录。

## 完成后提醒

发布成功后，提醒用户完成以下步骤：

- [ ] 提交到 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [ ] 使用 `/generate-post` 技能生成推广文案（可选）
- [ ] 发布到社交媒体（可选）

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| pre-release check 失败 | 报告问题，停止执行 |
| release-it 执行失败 | 报告错误，等待用户手动修复 |
| git push 失败 | 检查网络或权限，提示重试 |
| gh release 创建失败 | 提供手动创建链接 |

## 相关文件

| 文件 | 用途 |
|------|------|
| `.releaserc.json` | release-it 配置 |
| `scripts/sync-manifest.mjs` | 版本号同步脚本 |
| `scripts/pre-release-check.mjs` | 发布前检查 |
| `scripts/generate-changelog.mjs` | CHANGELOG 生成 |
| `scripts/archive-package.mjs` | 归档脚本 |

## 可用的 npm scripts

```bash
npm run release:check    # 发布前检查
npm run version:sync     # 同步版本号到 manifest
npm run changelog        # 生成 CHANGELOG
npm run archive          # 归档发布包
npx release-it           # 交互式发布
```
