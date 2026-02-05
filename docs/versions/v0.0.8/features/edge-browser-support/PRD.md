# Edge 浏览器适配 - 产品需求文档

> **版本**: v0.0.8
> **日期**: 2025-01-24
> **状态**: 规划中
> **优先级**: P0

---

## 一、需求背景

### 1.1 市场机会

Microsoft Edge 浏览器市场份额持续增长：
- **全球市场份额**：约 13%（第二位，仅次于 Chrome）
- **国内市场份额**：更高（企业环境、Windows 捆绑）
- **用户特征**：企业用户、开发者群体占比高

### 1.2 用户需求

已有用户反馈：
- "Edge 浏览器能用吗？"
- "希望能在 Edge 上使用"
- "什么时候上架 Edge 商店？"

### 1.3 技术基础

- Edge 基于 Chromium 内核（2020年起）
- Chrome 扩展理论上 100% 兼容
- Edge 支持 Chrome Extension Manifest V3
- Edge Add-ons 是独立的扩展商店

---

## 二、需求目标

### 2.1 主要目标

| 目标 | 描述 | 成功标准 |
|------|------|----------|
| 兼容性验证 | 验证所有功能在 Edge 上正常运行 | 100% 功能可用 |
| 商店发布 | 发布到 Edge Add-ons 商店 | 通过审核并上架 |
| 文档完善 | 添加 Edge 安装说明 | 用户能顺利安装 |

### 2.2 非目标

- ❌ 不做 Edge 专属功能
- ❌ 不修改现有 UI 设计
- ❌ 不引入 Edge 专属 API

---

## 三、功能需求

### 3.1 兼容性验证

#### 3.1.1 核心功能验证

| 功能 | 验证项 | 预期结果 |
|------|--------|----------|
| 侧边栏 | Side Panel 正常展开 | 与 Chrome 一致 |
| 笔记管理 | 新增/编辑/删除/搜索 | 功能正常 |
| 数据同步 | Chrome Storage Sync | 跨设备同步正常 |
| 置顶功能 | 置顶/取消置顶 | 功能正常 |
| 导入导出 | JSON 备份/恢复 | 功能正常 |
| Markdown | 预览/编辑切换 | 渲染正常 |
| 国际化 | 中英文切换 | 显示正常 |

#### 3.1.2 兼容性问题排查

需要排查的潜在问题：
- [ ] CSS 渲染差异（如 Flexbox、Grid）
- [ ] 字体显示（Edge 默认字体）
- [ ] SVG 图标渲染
- [ ] Storage API 行为
- [ ] Side Panel 宽度/高度限制

### 3.2 Edge Add-ons 商店准备

#### 3.2.1 商店素材

| 素材 | 规格 | 状态 |
|------|------|------|
| 扩展图标 | 128x128 PNG | ✅ 复用 Chrome |
| 宣传图 | 1280x800 或 640x400 | ⏳ 需准备 |
| 截图 | 1280x800 或 640x400 | ⏳ 需准备 |
| 描述文本 | 中英文 | ⏳ 需准备 |
| 隐私政策 | URL | ⏳ 需准备 |

#### 3.2.2 商店信息

**中文信息**：
- 名称：SlideNote - 侧边栏笔记
- 简短描述：浏览器侧边栏便利贴，碎片信息快速存取
- 详细描述：[从 README 提取]
- 分类：生产力工具

**英文信息**：
- Name: SlideNote - Sidebar Notes
- Short description: Sticky notes in your browser sidebar
- Detailed description: [From README]
- Category: Productivity

### 3.3 安装文档

创建 Edge 专属安装说明：
- Edge Add-ons 商店安装
- 开发者模式安装（加载已解压的扩展）

---

## 四、技术方案

### 4.1 兼容性测试流程

```
1. 在 Edge 中加载扩展（开发者模式）
   ↓
2. 逐项功能测试
   ↓
3. 发现并修复兼容性问题
   ↓
4. 回归测试
   ↓
5. 打包发布版本
   ↓
6. 提交 Edge Add-ons 商店
```

### 4.2 需要检查的文件

| 文件 | 检查项 |
|------|--------|
| `manifest.json` | Edge 特有字段、权限声明 |
| `sidepanel.html` | HTML5 兼容性 |
| `sidepanel.js` | ES6+ 语法支持 |
| `sidepanel.css` | CSS 属性兼容性 |
| `_locales/` | Edge 本地化支持 |

### 4.3 可能的兼容性问题

#### 问题 1：CSS 变量

Edge 对 CSS 变量的支持良好，但需验证：
- `var(--custom-property)` 语法
- 默认值语法 `var(--name, default)`

#### 问题 2：Chrome API 别名

Edge 可能使用 `browser.*` 而非 `chrome.*`：
```javascript
// 当前代码
chrome.storage.sync.get(...)

// 兼容写法（如需要）
const storage = chrome.storage || browser.storage;
```

#### 问题 3：Side Panel API

Edge 114+ 支持 Side Panel，需确认版本兼容性。

---

## 五、发布计划

### 5.1 开发阶段

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| 兼容性测试 | 在 Edge 中测试所有功能 | 2小时 |
| 问题修复 | 修复发现的兼容性问题 | 2小时 |
| 商店素材准备 | 准备截图、描述等 | 1小时 |
| 打包验证 | 构建发布版本并测试 | 1小时 |

### 5.2 发布阶段

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| 商店注册 | 注册 Microsoft Edge Add-ons 开发者账号 | 30分钟 |
| 提交审核 | 上传 ZIP 包，填写商店信息 | 30分钟 |
| 审核等待 | Edge 团队审核（通常 1-3 个工作日） | 1-3天 |
| 正式上架 | 审核通过后用户可安装 | - |

---

## 六、验收标准

### 6.1 功能验收

- [ ] 所有核心功能在 Edge 中正常运行
- [ ] UI 显示与 Chrome 一致
- [ ] 数据同步正常工作
- [ ] 国际化显示正确

### 6.2 商店验收

- [ ] Edge Add-ons 商店成功上架
- [ ] 商店页面信息完整（图标、截图、描述）
- [ ] 用户可以通过商店搜索并安装

### 6.3 文档验收

- [ ] README 添加 Edge 安装说明
- [ ] CHANGELOG 记录 Edge 支持
- [ ] 商店描述准确描述产品功能

---

## 七、风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| Edge 审核被拒 | 低 | 高 | 提前阅读审核规范，准备隐私政策 |
| 发现严重兼容性问题 | 中 | 中 | 预留开发时间修复 |
| 商店审核时间过长 | 低 | 低 | 提前提交，不阻塞开发 |

---

## 八、相关文档

- [Chrome Web Store 发布指南](https://developer.chrome.com/docs/webstore/publish)
- [Microsoft Edge Add-ons 发布指南](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension)
- [Manifest V3 兼容性](https://developer.chrome.com/docs/extensions/mv3/intro)

---

> **备注**：Edge 基于 Chromium，兼容性风险较低，但仍需完整测试验证。
