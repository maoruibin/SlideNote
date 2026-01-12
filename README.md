<p align="center">
  <img src="https://gudong.s3.bitiful.net/weimd/1768183653015_image.png" width="600" alt="SlideNote">
</p>

<h1 align="center">SlideNote 侧边笔记</h1>

<p align="center">
  <strong>Slide notes, always by your side</strong><br>
  侧边笔记，常伴左右
</p>

<p align="center">
  Chrome 浏览器侧边栏笔记插件 | 跨设备自动同步 | 极简设计
</p>

<p align="center">
  <a href="https://github.com/maoruibin/SlideNote"><img alt="GitHub version" src="https://img.shields.io/badge/version-0.0.1-blue"></a>
  <a href="https://github.com/maoruibin/SlideNote/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green"></a>
</p>

---

## ✨ 特性

- **📌 侧边栏展示** — 固定在浏览器侧边，随时可用
- **💾 自动保存** — 停止输入 1 秒后自动保存
- **🔄 跨设备同步** — 基于 Chrome Storage API，自动云端同步
- **🔍 搜索过滤** — 实时搜索标题和内容
- **📋 笔记排序** — 右键菜单，自由调整笔记顺序
- **⚡️ 极致轻量** — 无框架依赖，打包仅 20KB

---

## 🎯 适用场景

| 场景 | 说明 |
|------|------|
| 多设备工作者 | 公司电脑记录，回家电脑继续用 |
| 技术人员 | 存储 API Key、服务器地址、配置信息 |
| 运营/自媒体 | 管理多账号密码、文案模板、素材链接 |
| 临时记录 | 快速记下灵感、待办事项、剪贴板内容 |

---

## 📦 安装

### 方式一：从源码安装

```bash
# 克隆仓库
git clone https://github.com/maoruibin/SlideNote.git
cd SlideNote

# 安装依赖
npm install

# 构建
npm run build
```

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目根目录的 `dist` 文件夹

### 方式二：Chrome 应用商店（即将上架）

搜索「SlideNote」一键安装

---

## 🚀 使用方法

1. 点击 Chrome 工具栏的 SlideNote 图标
2. 侧边栏展开，即可开始使用
3. 点击「新建笔记」创建第一条笔记
4. 点击笔记项切换，开始编辑
5. 右键点击笔记可排序或删除
6. 停止输入 1 秒后自动保存

---

## 🛠️ 技术栈

```
Vanilla JS (ES6+)  →  无框架，极致轻量
Vite               →  快速构建
Chrome Storage     →  免费云同步
CSS Variables      →  设计系统
```

**为什么不用框架？**

| 理由 | 说明 |
|------|------|
| 性能 | 加载时间 < 100ms，无 100KB+ 框架开销 |
| 简单 | CRUD 功能不需要复杂状态管理 |
| 稳定 | 无框架升级风险，代码长期可用 |

---

## 📁 项目结构

```
slidenote/
├── src/sidepanel/
│   ├── core/           # 数据层（Store, EventBus, SyncManager）
│   ├── components/     # UI 组件
│   └── utils/          # 工具函数
├── docs/               # 设计文档
└── public/icons/       # 图标资源
```

---

## 🎨 设计理念

```
克制的配色    → 单色主调，不抢注意力
清晰的层级    → 列表 vs 内容，一目了然
舒适的间距    → 呼吸感，不拥挤
统一的圆角    → 温和不尖锐
```

---

## 🗺️ 路线图

### v0.0.1（当前版本）
- [x] 基础 CRUD
- [x] 自动保存
- [x] 跨设备同步
- [x] 搜索过滤
- [x] 笔记排序（右键菜单）
- [x] UI 优化（自适应宽度、移除聚焦边框）

### v0.0.2（计划中）
- [ ] 笔记分组/标签
- [ ] 数据导出（JSON/Markdown）
- [ ] 快捷键支持

---

## 📮 关注作者

<p align="center">
  扫码关注公众号，获取开发日常和产品最新动态
</p>

<p align="center">
  <img src="https://blog.gudong.site/assets/profile/gongzhonghao.jpg" width="180" alt="公众号二维码">
</p>

---

## 💖 感谢支持

如果这个项目对你有帮助，欢迎请我喝杯咖啡 ☕️

<table align="center">
  <tr>
    <td align="center">
      <img src="https://doc.gudong.site/assets/img/wechat-donate.5e615ccb.jpg" width="180" alt="微信打赏"/>
    </td>
    <td align="center">
      <img src="https://doc.gudong.site/assets/img/alipay-donate.7ec06101.jpg" width="180" alt="支付宝打赏"/>
    </td>
  </tr>
</table>

---

## 🌟 更多作品

查看我的更多项目和文章：**[doc.gudong.site](https://doc.gudong.site/)**

---

## 📄 开源协议

[MIT License](LICENSE)

---

## 👨‍💻 作者

**咕咚同学** | 博客: https://blog.gudong.site/

> **Slide notes, always by your side**
>
> 侧边笔记，常伴左右

---

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！
