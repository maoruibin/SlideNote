---
name: release
description: SlideNote Chrome extension release automation. Handles version confirmation, production build, packaging, git commit/tag, and GitHub release creation. Usage: say "release" or "发布" when ready to ship a new version.
---

# SlideNote 发布技能

自动化发布 SlideNote Chrome 扩展的完整流程。

## 使用方法

用户说「发布」或「release」时触发此技能。

## 发布流程

### 1. 读取版本号

从 `manifest.json` 读取当前版本号：

```bash
grep '"version"' manifest.json | head -1
```

### 2. 确认版本

向用户确认：
```
准备发布版本: vX.Y.Z
请确认:
1. 版本号是否正确？
2. manifest.json 和 manifest.dev.json 的版本号是否已同步更新？
3. CHANGELOG.md 是否已更新？
```

### 3. 构建生产版本

```bash
npm run build:prod
```

### 4. 打包

```bash
npm run package
```

输出文件：`versions/SlideNote-v{version}.zip`

### 5. Git 提交

检查 git 状态，如果有未提交的更改，提示用户先提交。

创建提交：
```bash
git add -A
git commit -m "chore: release v{version}"
```

### 6. 创建 Tag

```bash
git tag -a v{version} -m "Release v{version}"
```

### 7. 推送到远程

```bash
git push origin main
git push origin v{version}
```

### 8. 创建 GitHub Release

使用 `gh` CLI 创建 release：

```bash
# 从 CHANGELOG.md 提取当前版本的更新内容
gh release create v{version} \
  --title "v{version}" \
  --notes-file CHANGELOG.md \
  --assets versions/SlideNote-v{version}.zip
```

## 文件路径

- `manifest.json` - 生产版本配置
- `manifest.dev.json` - 开发版本配置
- `CHANGELOG.md` - 更新日志
- `scripts/package.mjs` - 打包脚本
- `versions/` - 版本归档目录

## 发布检查清单

执行发布前确认：
- [ ] 版本号已更新（manifest.json, manifest.dev.json）
- [ ] CHANGELOG.md 已更新
- [ ] 所有更改已提交或准备提交
- [ ] 生产版本构建成功
- [ ] zip 包已创建到 versions/ 目录
