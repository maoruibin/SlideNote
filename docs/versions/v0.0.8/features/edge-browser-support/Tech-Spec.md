# Edge 浏览器适配 - 技术设计文档

> **版本**: v0.0.8
> **日期**: 2025-01-24
> **状态**: 设计中
> **作者**: SlideNote Team

---

## 一、概述

### 1.1 目标

将 SlideNote 扩展适配到 Microsoft Edge 浏览器，并发布到 Edge Add-ons 商店。

### 1.2 技术背景

- Edge 基于 Chromium 内核（2020 年起）
- 支持 Chrome Extension Manifest V3
- 与 Chrome API 高度兼容（>95%）
- Side Panel API 从 Edge 114 开始支持

### 1.3 设计原则

- **最小改动**：不修改现有代码逻辑，仅做兼容性适配
- **渐进增强**：先验证，后适配
- **统一体验**：Edge 版本与 Chrome 版本功能一致

---

## 二、技术架构

### 2.1 现有架构分析

```
┌─────────────────────────────────────────────────────────┐
│                   Chrome Extension                       │
├─────────────────────────────────────────────────────────┤
│  Manifest V3                                            │
│  ├── side_panel (Chrome 114+)                           │
│  ├── permissions: ["storage"]                           │
│  └── action: chrome.action.onClicked                    │
├─────────────────────────────────────────────────────────┤
│  Background Service Worker                               │
│  └── background.js                                       │
├─────────────────────────────────────────────────────────┤
│  Side Panel                                              │
│  ├── sidepanel.html                                     │
│  ├── sidepanel.js (Vanilla JS + EventBus)               │
│  └── sidepanel.css                                       │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                              │
│  └── chrome.storage.sync                                │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Edge 兼容性映射

| Chrome API | Edge API | 兼容性 | 适配需求 |
|------------|----------|--------|----------|
| `chrome.sidePanel` | `chrome.sidePanel` | ✅ 完全兼容 | 无需适配 |
| `chrome.storage.sync` | `chrome.storage.sync` | ✅ 完全兼容 | 无需适配 |
| `chrome.action` | `chrome.action` | ✅ 完全兼容 | 无需适配 |
| `chrome.runtime` | `chrome.runtime` | ✅ 完全兼容 | 无需适配 |
| `chrome.i18n` | `chrome.i18n` | ✅ 完全兼容 | 无需适配 |

**结论**：无需代码级适配，主要是验证工作。

---

## 三、兼容性测试设计

### 3.1 测试环境

| 项目 | 要求 |
|------|------|
| Edge 版本 | 最新稳定版（建议 Edge 120+） |
| 操作系统 | Windows 10/11, macOS |
| 测试方式 | 开发者模式加载扩展 |

### 3.2 测试用例

#### 3.2.1 基础功能测试

| ID | 测试项 | 操作步骤 | 预期结果 |
|----|--------|----------|----------|
| E001 | 扩展安装 | 加载解压的扩展包 | 扩展成功安装，图标显示在工具栏 |
| E002 | 侧边栏打开 | 点击扩展图标 | Side Panel 从右侧展开 |
| E003 | 侧边栏关闭 | 点击侧边栏外部或关闭按钮 | Side Panel 收起 |
| E004 | 图标显示 | 查看扩展图标 | 显示正常的 SlideNote 图标 |

#### 3.2.2 笔记管理测试

| ID | 测试项 | 操作步骤 | 预期结果 |
|----|--------|----------|----------|
| E101 | 创建笔记 | 点击 + 按钮，输入标题和内容 | 笔记成功创建，显示在列表中 |
| E102 | 编辑笔记 | 点击笔记，修改内容 | 内容实时保存 |
| E103 | 删除笔记 | 右键 → 删除 | 笔记被删除，编辑器正确切换 |
| E104 | 搜索笔记 | 在搜索框输入关键词 | 列表实时过滤 |
| E105 | 置顶笔记 | 右键 → 置顶 | 笔记置顶，显示橙色标识 |

#### 3.2.3 数据同步测试

| ID | 测试项 | 操作步骤 | 预期结果 |
|----|--------|----------|----------|
| E201 | 本地存储 | 创建笔记，刷新页面 | 笔记数据保留 |
| E202 | 跨设备同步 | 在另一设备登录 Edge | 笔记数据同步（约 10 秒） |
| E203 | 导入导出 | 导出 JSON，重新导入 | 数据完整恢复 |

#### 3.2.4 UI 渲染测试

| ID | 测试项 | 检查项 | 预期结果 |
|----|--------|--------|----------|
| E301 | 布局渲染 | 侧边栏宽度、分区比例 | 与 Chrome 一致 |
| E302 | 字体渲染 | 中文字体、字号 | 显示正常，无乱码 |
| E303 | SVG 图标 | 所有 SVG 图标 | 显示清晰，无变形 |
| E304 | CSS 变量 | 颜色、间距、圆角 | 与 Chrome 一致 |
| E305 | 暗色模式 | 系统暗色模式下 | 适配暗色主题 |

#### 3.2.5 国际化测试

| ID | 测试项 | 操作步骤 | 预期结果 |
|----|--------|----------|----------|
| E401 | 中文界面 | Edge 语言设置为中文 | 显示中文界面 |
| E402 | 英文界面 | Edge 语言设置为英文 | 显示英文界面 |
| E403 | 切换语言 | 修改浏览器语言 | 界面语言正确切换 |

### 3.3 测试矩阵

```
┌──────────────┬───────────┬───────────┬───────────┐
│   功能模块   │  Chrome   │   Edge    │  结果     │
├──────────────┼───────────┼───────────┼───────────┤
│ 侧边栏展开   │     ✅    │    ⏳     │   待测    │
│ 笔记 CRUD    │     ✅    │    ⏳     │   待测    │
│ 搜索功能     │     ✅    │    ⏳     │   待测    │
│ 置顶功能     │     ✅    │    ⏳     │   待测    │
│ 导入导出     │     ✅    │    ⏳     │   待测    │
│ Markdown    │     ✅    │    ⏳     │   待测    │
│ 数据同步     │     ✅    │    ⏳     │   待测    │
│ 国际化       │     ✅    │    ⏳     │   待测    │
│ 暗色模式     │     ✅    │    ⏳     │   待测    │
└──────────────┴───────────┴───────────┴───────────┘
```

---

## 四、潜在问题与适配方案

### 4.1 可能的兼容性问题

#### 问题 1：Polyfill 需求

**场景**：Edge 可能不支持某些新的 Web API

**检测方法**：
```javascript
// 在 sidepanel.js 初始化时检测
const checkApiSupport = () => {
  const checks = {
    'Side Panel API': typeof chrome.sidePanel !== 'undefined',
    'Storage API': typeof chrome.storage !== 'undefined',
    'Intl.Segmenter': typeof Intl.Segmenter !== 'undefined',
  };

  const unsupported = Object.entries(checks)
    .filter(([_, supported]) => !supported)
    .map(([name]) => name);

  if (unsupported.length > 0) {
    console.warn('Unsupported APIs:', unsupported);
  }

  return Object.values(checks).every(v => v);
};
```

**适配方案**：不需要，Edge 114+ 完全支持。

---

#### 问题 2：CSS 渲染差异

**场景**：Edge 的 CSS 渲染引擎可能与 Chrome 有细微差异

**关注点**：
- Flexbox / Grid 布局
- CSS 变量（`var(--name)`）
- `backdrop-filter` 毛玻璃效果
- 字体渲染

**检测方法**：视觉对比测试

**适配方案**：
```css
/* 如需 Edge 专属样式 */
@supports (-ms-ime-align: auto) {
  /* Edge 专属样式（通常不需要） */
}
```

---

#### 问题 3：存储 API 行为差异

**场景**：Edge Storage Sync 的容量或限流可能与 Chrome 不同

**检测方法**：
```javascript
// 测试存储容量
const testStorageCapacity = async () => {
  const testKey = 'slidenote_capacity_test';
  const testData = 'x'.repeat(8000); // 8KB

  try {
    await chrome.storage.sync.set({ [testKey]: testData });
    await chrome.storage.sync.remove(testKey);
    console.log('Storage capacity OK');
  } catch (error) {
    console.error('Storage capacity issue:', error);
  }
};
```

**适配方案**：如有限流差异，在 Store.js 中添加限流保护。

---

### 4.2 适配决策树

```
开始 Edge 兼容性测试
        │
        ▼
   ┌─────────┐
   │ 功能正常？ │
   └─────────┘
      │
      ├── 是 ──→ 记录测试结果 ✅
      │
      └── 否 ──→ 分析问题
                     │
                     ▼
              ┌──────────────┐
              │ 是 API 不支持？ │
              └──────────────┘
                    │
                    ├── 是 ──→ 添加 Polyfill 或降级处理
                    │
                    └── 否 ──→ CSS/样式问题 → 修改样式
```

---

## 五、Edge Add-ons 商店发布

### 5.1 商店准备清单

#### 5.1.1 必需素材

| 素材 | 规格 | 来源 | 状态 |
|------|------|------|------|
| 扩展图标 | 128x128 PNG | 复用 Chrome 版本 | ✅ 已有 |
| 宣传图 | 1280x800 或 640x400 | 需要准备 | ⏳ 待制作 |
| 功能截图 | 1280x800 或 640x400 | 需要准备 | ⏳ 待制作 |
| 隐私政策 | URL | 需要准备 | ⏳ 待创建 |

#### 5.1.2 商店信息

**中文**：
```json
{
  "name": "SlideNote - 侧边栏笔记",
  "short_description": "浏览器侧边栏便利贴，碎片信息快速存取",
  "description": "完整描述...",
  "category": "生产力工具",
  "language": "zh-CN"
}
```

**英文**：
```json
{
  "name": "SlideNote - Sidebar Notes",
  "short_description": "Sticky notes in your browser sidebar",
  "description": "Full description...",
  "category": "Productivity",
  "language": "en"
}
```

### 5.2 发布流程

```
┌─────────────────────────────────────────────────────────┐
│              Edge Add-ons 发布流程                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 注册开发者账号                                        │
│     ├── Microsoft 账号                                  │
│     └── 验证身份（可能需要付费）                          │
│                                                          │
│  2. 准备发布包                                           │
│     └── SlideNote-v0.0.8.zip                            │
│                                                          │
│  3. 提交扩展                                             │
│     ├── 上传 ZIP 包                                      │
│     ├── 填写商店信息（图标、截图、描述）                   │
│     └── 提交审核                                         │
│                                                          │
│  4. 等待审核                                             │
│     └── 通常 1-3 个工作日                                 │
│                                                          │
│  5. 审核通过                                             │
│     └── 用户可在商店搜索并安装                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.3 开发者账号注册

**注册地址**：https://partner.microsoft.com/en-us/dashboard

**要求**：
- Microsoft 账号
- 验证身份（可能需要信用卡，一次性费用约 $19）

---

## 六、实施计划

### 6.1 开发阶段

| 阶段 | 任务 | 负责人 | 预估时间 | 输出 |
|------|------|--------|----------|------|
| 1 | 下载安装 Edge | - | 10分钟 | Edge 浏览器 |
| 2 | 加载扩展测试 | 开发者 | 30分钟 | 确认可加载 |
| 3 | 功能测试 | 开发者 | 2小时 | 测试报告 |
| 4 | 问题修复 | 开发者 | 按需 | 修复记录 |
| 5 | 回归测试 | 开发者 | 1小时 | 测试通过 |

### 6.2 发布阶段

| 阶段 | 任务 | 负责人 | 预估时间 | 输出 |
|------|------|--------|----------|------|
| 1 | 准备商店素材 | 设计 | 1小时 | 素材文件 |
| 2 | 创建隐私政策 | 开发者 | 30分钟 | 政策页面 |
| 3 | 注册开发者账号 | 发布者 | 30分钟 | 开发者账号 |
| 4 | 提交扩展 | 发布者 | 30分钟 | 提交完成 |
| 5 | 等待审核 | - | 1-3天 | 审核通过 |

---

## 七、验收标准

### 7.1 功能验收

- [ ] 所有核心功能在 Edge 中正常运行
- [ ] UI 显示与 Chrome 一致
- [ ] 数据同步正常工作
- [ ] 国际化显示正确
- [ ] 无控制台错误或警告

### 7.2 商店验收

- [ ] Edge Add-ons 商店成功上架
- [ ] 商店页面信息完整（图标、截图、描述）
- [ ] 用户可以通过商店搜索并安装
- [ ] 安装后功能正常

### 7.3 文档验收

- [ ] README 添加 Edge 安装说明
- [ ] CHANGELOG 记录 Edge 支持
- [ ] 商店描述准确描述产品功能

---

## 八、风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| Edge 审核被拒 | 低 | 高 | 提前阅读审核规范，准备隐私政策 |
| 发现严重兼容性问题 | 中 | 中 | 预留开发时间修复 |
| 商店审核时间过长 | 低 | 低 | 提前提交，不阻塞开发 |
| 素材不符合要求 | 中 | 低 | 参考官方规范制作 |

---

## 九、参考资料

- [Microsoft Edge Extensions - Chrome Compatibility](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/porting-chrome-extensions)
- [Publish to Microsoft Edge Add-ons](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension)
- [Edge Add-ons Policies](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/developer-policies)
- [Chrome Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)

---

## 十、附录

### 10.1 测试检查清单

```
Edge 兼容性测试清单

基础功能
□ 扩展可安装
□ 侧边栏可打开/关闭
□ 图标正常显示

笔记管理
□ 创建笔记
□ 编辑笔记
□ 删除笔记
□ 搜索笔记
□ 置顶笔记

数据功能
□ 本地存储
□ 导入导出
□ Markdown 渲染

UI/UX
□ 布局正确
□ 字体显示正常
□ 图标显示正常
□ 暗色模式适配

国际化
□ 中文界面
□ 英文界面
□ 语言切换

其他
□ 无控制台错误
□ 性能流畅
□ 内存无泄漏
```

### 10.2 商店素材模板

**宣传图尺寸**：
- 推荐尺寸：1280 x 800 px
- 最小尺寸：640 x 400 px
- 格式：PNG 或 JPG
- 文件大小：< 1MB

**截图要求**：
- 展示扩展的核心功能
- 包含侧边栏界面
- 突出产品特色

---

> **下一步**：执行兼容性测试，记录测试结果。
