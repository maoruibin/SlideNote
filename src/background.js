/**
 * Background Service Worker
 * 处理插件图标点击、右键菜单保存
 */

// Storage key
const STORAGE_KEY = 'slidenote_notes';
const MAX_SELECTION_LENGTH = 3000; // 最大选中文字长度

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
// 插件安装/更新 - 初始化
// ============================================

chrome.runtime.onInstalled.addListener(async () => {
  // 设置侧边栏为默认打开
  await chrome.sidePanel.setOptions({
    enabled: true
  });

  // 清空所有菜单后创建新菜单（避免重复）
  chrome.contextMenus.removeAll(() => {
    const menuTitle = chrome.i18n.getMessage('saveToSlideNote') || 'Save to SlideNote';
    chrome.contextMenus.create({
      id: 'saveToSlideNote',
      title: menuTitle,
      contexts: ['selection']
    });
  });
});

// ============================================
// 右键菜单点击 - 保存选中内容
// ============================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveToSlideNote') {
    await handleSaveSelection(info, tab);
  }
});

/**
 * 处理保存选中内容
 * @param {Object} info - 菜单信息
 * @param {Object} tab - 标签页信息
 */
async function handleSaveSelection(info, tab) {
  // 获取选中的文字
  let selectedText = info.selectionText || '';

  // 如果是链接，使用链接文字
  if (info.linkUrl) {
    selectedText = info.linkUrl;
  }

  // 清理文字
  selectedText = selectedText.trim();

  // 验证文字长度
  if (selectedText.length > MAX_SELECTION_LENGTH) {
    showNotification(
      chrome.i18n.getMessage('selectionTooLong'),
      `${selectedText.slice(0, 100)}...`
    );
    return;
  }

  if (!selectedText) {
    return;
  }

  // 获取页面信息
  const pageTitle = tab.title || 'Unknown Page';
  const pageUrl = tab.url || '';

  try {
    // 保存到存储
    await saveSelectionToDateNote(selectedText, pageTitle, pageUrl);

    // 显示成功通知
    showNotification(
      chrome.i18n.getMessage('savedToSlideNote'),
      selectedText.slice(0, 50) + (selectedText.length > 50 ? '...' : '')
    );
  } catch (error) {
    console.error('Save failed:', error);
    if (error.message.includes('QUOTA_BYTES')) {
      showNotification(
        chrome.i18n.getMessage('storageFull'),
        ''
      );
    }
  }
}

/**
 * 保存选中内容到当天的"网页摘录"笔记
 * @param {string} content - 选中的内容
 * @param {string} sourceTitle - 来源页面标题
 * @param {string} sourceUrl - 来源页面 URL
 */
async function saveSelectionToDateNote(content, sourceTitle, sourceUrl) {
  // 获取现有笔记
  const result = await chrome.storage.sync.get({ [STORAGE_KEY]: [] });
  const notes = result[STORAGE_KEY] || [];

  // 获取今天的日期字符串（作为笔记标识）
  const today = getTodayDateString();
  const webSelectionsTitle = chrome.i18n.getMessage('webSelectionsTitle');
  const dateNoteTitle = `${today} ${webSelectionsTitle}`;

  // 查找今天的"网页摘录"笔记
  let targetNote = notes.find(n => n.title === dateNoteTitle);

  // 获取当前时间
  const now = new Date();
  const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  if (targetNote) {
    // 追加到现有笔记，用分隔符分开
    const newEntry = formatSelectionEntry(content, sourceTitle, sourceUrl, timeString);
    targetNote.content += getEntrySeparator() + newEntry;
    targetNote.updatedAt = Date.now();
  } else {
    // 创建新笔记
    const newEntry = formatSelectionEntry(content, sourceTitle, sourceUrl, timeString);
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: dateNoteTitle,
      content: newEntry,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false
    };
    notes.unshift(newNote); // 添加到列表顶部
  }

  // 保存到存储
  await chrome.storage.sync.set({ [STORAGE_KEY]: notes });
}

/**
 * 格式化单条摘录
 * @param {string} content - 内容
 * @param {string} sourceTitle - 来源标题
 * @param {string} sourceUrl - 来源链接
 * @param {string} timeString - 时间字符串
 * @returns {string} 格式化后的摘录
 */
function formatSelectionEntry(content, sourceTitle, sourceUrl, timeString) {
  let entry = `${timeString}\n\n${content}`;

  // 如果有来源链接，添加到末尾
  if (sourceUrl && !sourceUrl.startsWith('chrome://')) {
    entry += `\n\n来自：[${sourceTitle}](${sourceUrl})`;
  }

  return entry;
}

/**
 * 格式化多条摘录之间的分隔符
 * @returns {string} 分隔符
 */
function getEntrySeparator() {
  return '\n\n---\n';
}

/**
 * 获取今天的日期字符串
 * @returns {string} 格式：YYYY-MM-DD
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 显示通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: title,
    message: message
  }, (notificationId) => {
    // 1.5 秒后自动关闭
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 1500);
  });
}
