/**
 * Background Service Worker
 * 处理插件图标点击
 */

// ============================================
// 插件图标点击 - 打开侧边栏
// ============================================

chrome.action.onClicked.addListener(async (tab) => {
  // 忽略 chrome:// 等特殊页面
  if (tab.url && tab.url.startsWith('chrome://')) {
    return;
  }
  // 打开当前标签页的侧边栏
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (e) {
    // 忽略无法打开侧边栏的错误
  }
});

// ============================================
// 插件安装/更新
// ============================================

chrome.runtime.onInstalled.addListener(async () => {
  // 设置侧边栏为默认打开
  await chrome.sidePanel.setOptions({
    enabled: true
  });
});
