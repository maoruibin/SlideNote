/**
 * Toolbar - 顶部工具栏组件
 * 包含搜索图标/搜索框 + 新建按钮 + 收起按钮
 */

import { t } from '../utils/i18n.js';

export class Toolbar {
  constructor(props = {}) {
    this.props = props;
    this.state = {
      isSearchExpanded: false,
      searchValue: '',
    };
    this.el = null;
    this._searchContainer = null;  // 搜索区域容器
    this._searchInput = null;
    this._searchBtn = null;        // 搜索图标按钮引用
  }

  render() {
    const container = document.createElement('div');
    container.className = 'toolbar';

    // 左侧区域：搜索 + 新建
    const leftArea = document.createElement('div');
    leftArea.className = 'toolbar-left';

    // 搜索区域容器
    this._searchContainer = document.createElement('div');
    this._searchContainer.className = 'search-container';
    this._renderSearchArea(this._searchContainer);
    leftArea.appendChild(this._searchContainer);

    // 新建笔记按钮
    const newNoteBtn = this._renderNewNoteButton();
    leftArea.appendChild(newNoteBtn);

    container.appendChild(leftArea);

    this.el = container;
    return container;
  }

  /**
   * 渲染新建按钮
   * @private
   */
  _renderNewNoteButton() {
    const newNoteBtn = document.createElement('button');
    newNoteBtn.className = 'btn-new-note';
    newNoteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    `;
    newNoteBtn.onclick = () => {
      this.props.bus?.emit('note:create');
    };
    return newNoteBtn;
  }

  /**
   * 渲染搜索区域
   * @private
   */
  _renderSearchArea(container) {
    container.innerHTML = '';

    if (this.state.isSearchExpanded) {
      // 展开的搜索框
      const searchExpanded = document.createElement('div');
      searchExpanded.className = 'search-bar-expanded';

      // 搜索图标
      const icon = document.createElement('span');
      icon.className = 'search-icon';
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      `;

      // 输入框
      const input = document.createElement('input');
      input.className = 'search-input';
      input.value = this.state.searchValue;
      input.placeholder = t('searchPlaceholder');
      input.oninput = (e) => {
        this.state.searchValue = e.target.value;
        this.props.bus?.emit('search:change', e.target.value);
      };
      input.onkeydown = (e) => {
        if (e.key === 'Escape') {
          this.collapseSearch();
        }
      };

      // 关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.className = 'search-close';
      closeBtn.innerHTML = '×';
      closeBtn.title = t('closeSearch');
      closeBtn.onclick = () => this.collapseSearch();

      searchExpanded.append(icon, input, closeBtn);
      container.appendChild(searchExpanded);

      this._searchInput = input;
      // 自动聚焦
      setTimeout(() => input.focus(), 50);
    } else {
      // 搜索图标按钮
      const searchBtn = document.createElement('button');
      searchBtn.className = 'search-icon-btn';
      searchBtn.title = t('searchTitle');
      searchBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      `;
      searchBtn.onclick = () => this.expandSearch();
      container.appendChild(searchBtn);
      this._searchBtn = searchBtn;
    }
  }

  /**
   * 展开搜索框
   */
  expandSearch() {
    this.state.isSearchExpanded = true;
    this._renderSearchArea(this._searchContainer);
    this.props.bus?.emit('search:expand');
  }

  /**
   * 收起搜索框
   */
  collapseSearch() {
    this.state.isSearchExpanded = false;
    this.state.searchValue = '';
    this._renderSearchArea(this._searchContainer);
    this.props.bus?.emit('search:collapse');
    this.props.bus?.emit('search:change', '');
  }

  /**
   * 聚焦搜索输入框
   */
  focusSearch() {
    this._searchInput?.focus();
  }
}
