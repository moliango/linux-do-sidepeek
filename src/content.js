(function () {
  const ROOT_ID = "ld-drawer-root";
  const PAGE_OPEN_CLASS = "ld-drawer-page-open";
  const PAGE_IFRAME_OPEN_CLASS = "ld-drawer-page-iframe-open";
  const ACTIVE_LINK_CLASS = "ld-drawer-topic-link-active";
  const IFRAME_MODE_CLASS = "ld-drawer-iframe-mode";
  const SETTINGS_KEY = "ld-drawer-settings-v1";
  const DEFAULT_SETTINGS = {
    previewMode: "smart",
    postMode: "all",
    replyOrder: "default",
    drawerWidth: "medium",
    drawerWidthCustom: 720
  };
  const DRAWER_WIDTHS = {
    narrow: "clamp(320px, 34vw, 680px)",
    medium: "clamp(360px, 42vw, 920px)",
    wide: "clamp(420px, 52vw, 1200px)"
  };
  const LIST_ROW_SELECTOR = [
    "tr.topic-list-item",
    ".topic-list-item",
    ".latest-topic-list-item",
    "tbody.topic-list-body tr"
  ].join(", ");
  const LINK_SELECTOR = [
    "a.title",
    ".main-link a.raw-topic-link",
    ".main-link a.title"
  ].join(", ");

  const state = {
    root: null,
    header: null,
    title: null,
    meta: null,
    content: null,
    openInTab: null,
    settingsPanel: null,
    settingsCard: null,
    settingsCloseButton: null,
    settingsToggle: null,
    prevButton: null,
    nextButton: null,
    resizeHandle: null,
    activeLink: null,
    currentUrl: "",
    currentFallbackTitle: "",
    currentTopic: null,
    abortController: null,
    lastLocation: location.href,
    settings: loadSettings(),
    isResizing: false,
    hasShownPreviewNotice: false
  };

  function init() {
    ensureDrawer();
    bindEvents();
    watchLocationChanges();
  }

  function ensureDrawer() {
    if (state.root) {
      return;
    }

    const root = document.createElement("aside");
    root.id = ROOT_ID;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="ld-drawer-resize-handle" role="separator" aria-label="调整抽屉宽度" aria-orientation="vertical" title="拖动调整宽度"></div>
      <div class="ld-drawer-shell">
        <div class="ld-drawer-header">
          <div class="ld-drawer-title-group">
            <div class="ld-drawer-eyebrow">LINUX DO 预览</div>
            <h2 class="ld-drawer-title">点击帖子标题开始预览</h2>
            <div class="ld-drawer-meta"></div>
          </div>
          <div class="ld-drawer-actions">
            <button class="ld-drawer-nav" type="button" data-nav="prev">上一帖</button>
            <button class="ld-drawer-nav" type="button" data-nav="next">下一帖</button>
            <button class="ld-drawer-settings-toggle" type="button" aria-expanded="false" aria-controls="ld-drawer-settings">选项</button>
            <a class="ld-drawer-link" href="https://linux.do/latest" target="_blank" rel="noopener noreferrer">新标签打开</a>
            <button class="ld-drawer-close" type="button" aria-label="关闭抽屉">关闭</button>
          </div>
        </div>
        <div class="ld-drawer-settings" id="ld-drawer-settings" hidden>
          <div class="ld-drawer-settings-card" role="dialog" aria-modal="true" aria-label="预览选项">
            <div class="ld-settings-head">
              <div class="ld-settings-title">预览选项</div>
              <button class="ld-settings-close" type="button" aria-label="关闭预览选项">关闭</button>
            </div>
            <label class="ld-setting-field">
              <span class="ld-setting-label">预览模式</span>
              <select class="ld-setting-control" data-setting="previewMode">
                <option value="smart">智能预览</option>
                <option value="iframe">整页模式</option>
              </select>
            </label>
            <label class="ld-setting-field">
              <span class="ld-setting-label">内容范围</span>
              <select class="ld-setting-control" data-setting="postMode">
                <option value="all">完整主题</option>
                <option value="first">仅首帖</option>
              </select>
            </label>
            <label class="ld-setting-field">
              <span class="ld-setting-label">回复排序</span>
              <select class="ld-setting-control" data-setting="replyOrder">
                <option value="default">默认顺序</option>
                <option value="latestFirst">最新回复优先</option>
              </select>
              <span class="ld-setting-hint">启用后会保留首帖在顶部，后续回复按从新到旧显示</span>
            </label>
            <label class="ld-setting-field">
              <span class="ld-setting-label">抽屉宽度</span>
              <select class="ld-setting-control" data-setting="drawerWidth">
                <option value="narrow">窄</option>
                <option value="medium">中</option>
                <option value="wide">宽</option>
                <option value="custom">自定义</option>
              </select>
              <span class="ld-setting-hint">也可以直接拖动抽屉左边边缘</span>
            </label>
            <button class="ld-settings-reset" type="button">恢复默认</button>
          </div>
        </div>
        <div class="ld-drawer-body">
          <div class="ld-drawer-content"></div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    state.root = root;
    state.header = root.querySelector(".ld-drawer-header");
    state.title = root.querySelector(".ld-drawer-title");
    state.meta = root.querySelector(".ld-drawer-meta");
    state.content = root.querySelector(".ld-drawer-content");
    state.openInTab = root.querySelector(".ld-drawer-link");
    state.settingsPanel = root.querySelector(".ld-drawer-settings");
    state.settingsCard = root.querySelector(".ld-drawer-settings-card");
    state.settingsCloseButton = root.querySelector(".ld-settings-close");
    state.settingsToggle = root.querySelector(".ld-drawer-settings-toggle");
    state.prevButton = root.querySelector('[data-nav="prev"]');
    state.nextButton = root.querySelector('[data-nav="next"]');
    state.resizeHandle = root.querySelector(".ld-drawer-resize-handle");

    root.querySelector(".ld-drawer-close").addEventListener("click", closeDrawer);
    state.prevButton.addEventListener("click", () => navigateTopic(-1));
    state.nextButton.addEventListener("click", () => navigateTopic(1));
    state.settingsToggle.addEventListener("click", toggleSettingsPanel);
    state.settingsPanel.addEventListener("click", handleSettingsPanelClick);
    state.settingsPanel.addEventListener("change", handleSettingsChange);
    state.settingsCloseButton.addEventListener("click", () => setSettingsPanelOpen(false));
    state.settingsPanel.querySelector(".ld-settings-reset").addEventListener("click", resetSettings);
    state.resizeHandle.addEventListener("pointerdown", startDrawerResize);

    syncSettingsUI();
    applyDrawerWidth();
    syncNavigationState();
    updateSettingsPopoverPosition();
  }

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("pointermove", handleDrawerResizeMove, true);
    document.addEventListener("pointerup", stopDrawerResize, true);
    document.addEventListener("pointercancel", stopDrawerResize, true);
    window.addEventListener("resize", handleWindowResize, true);
  }

  function handleDocumentClick(event) {
    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (!state.settingsPanel?.hidden && !target.closest(".ld-drawer-settings-card") && !target.closest(".ld-drawer-settings-toggle")) {
      setSettingsPanelOpen(false);
    }

    const link = target.closest("a[href]");
    if (!link || link.closest(`#${ROOT_ID}`)) {
      return;
    }

    const topicUrl = getTopicUrlFromLink(link);
    if (!topicUrl) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    openDrawer(topicUrl, link.textContent.trim(), link);
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && !state.settingsPanel?.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setSettingsPanelOpen(false);
      return;
    }

    if (isTypingTarget(event.target)) {
      return;
    }

    if (event.key === "Escape" && document.body.classList.contains(PAGE_OPEN_CLASS)) {
      closeDrawer();
      return;
    }

    if (!document.body.classList.contains(PAGE_OPEN_CLASS)) {
      return;
    }

    if (event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        navigateTopic(-1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        navigateTopic(1);
      }
    }
  }

  function getTopicUrlFromLink(link) {
    if (!link.matches(LINK_SELECTOR)) {
      return null;
    }

    if (!link.closest(LIST_ROW_SELECTOR)) {
      return null;
    }

    if (link.target && link.target !== "_self") {
      return null;
    }

    let url;

    try {
      url = new URL(link.href, location.href);
    } catch {
      return null;
    }

    if (url.origin !== location.origin || !url.pathname.startsWith("/t/")) {
      return null;
    }

    url.hash = "";
    url.search = "";

    return url.toString().replace(/\/$/, "");
  }

  function openDrawer(topicUrl, fallbackTitle, activeLink) {
    ensureDrawer();

    if (state.currentUrl === topicUrl && document.body.classList.contains(PAGE_OPEN_CLASS)) {
      highlightLink(activeLink);
      return;
    }

    state.currentUrl = topicUrl;
    state.currentFallbackTitle = fallbackTitle || "";
    state.currentTopic = null;
    state.title.textContent = fallbackTitle || "加载中…";
    state.meta.textContent = "正在载入帖子内容…";
    state.openInTab.href = topicUrl;
    state.content.innerHTML = renderLoading();

    highlightLink(activeLink);
    syncNavigationState();

    document.body.classList.add(PAGE_OPEN_CLASS);
    state.root.setAttribute("aria-hidden", "false");
    setIframeModeEnabled(state.settings.previewMode === "iframe");
    updateSettingsPopoverPosition();

    loadTopic(topicUrl, fallbackTitle);
  }

  function closeDrawer() {
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }

    document.body.classList.remove(PAGE_OPEN_CLASS);
    setIframeModeEnabled(false);
    state.root?.setAttribute("aria-hidden", "true");
    state.currentUrl = "";
    state.currentFallbackTitle = "";
    state.currentTopic = null;
    state.meta.textContent = "";
    clearHighlight();
    setSettingsPanelOpen(false);
    syncNavigationState();
  }

  function highlightLink(link) {
    clearHighlight();
    state.activeLink = link;
    state.activeLink?.classList.add(ACTIVE_LINK_CLASS);
    syncNavigationState();
  }

  function clearHighlight() {
    state.activeLink?.classList.remove(ACTIVE_LINK_CLASS);
    state.activeLink = null;
  }

  function getTopicEntries() {
    const entries = [];
    const seen = new Set();

    for (const row of document.querySelectorAll(LIST_ROW_SELECTOR)) {
      const link = row.querySelector(LINK_SELECTOR);
      if (!(link instanceof HTMLAnchorElement)) {
        continue;
      }

      const url = getTopicUrlFromLink(link);
      if (!url || seen.has(url)) {
        continue;
      }

      seen.add(url);
      entries.push({
        url,
        title: link.textContent.trim(),
        link
      });
    }

    return entries;
  }

  function syncNavigationState() {
    if (!state.prevButton || !state.nextButton) {
      return;
    }

    const entries = getTopicEntries();
    const currentIndex = entries.findIndex((entry) => entry.url === state.currentUrl);
    const hasDrawerOpen = Boolean(state.currentUrl);

    state.prevButton.disabled = !hasDrawerOpen || currentIndex <= 0;
    state.nextButton.disabled = !hasDrawerOpen || currentIndex === -1 || currentIndex >= entries.length - 1;
  }

  function navigateTopic(offset) {
    const entries = getTopicEntries();
    const currentIndex = entries.findIndex((entry) => entry.url === state.currentUrl);
    const nextEntry = currentIndex === -1 ? null : entries[currentIndex + offset];

    if (!nextEntry) {
      syncNavigationState();
      return;
    }

    nextEntry.link.scrollIntoView({ block: "nearest" });
    openDrawer(nextEntry.url, nextEntry.title, nextEntry.link);
  }

  async function loadTopic(topicUrl, fallbackTitle) {
    if (state.settings.previewMode === "iframe") {
      renderIframeFallback(topicUrl, fallbackTitle, null, true);
      return;
    }

    if (state.abortController) {
      state.abortController.abort();
    }

    const controller = new AbortController();
    state.abortController = controller;

    try {
      const response = await fetch(toTopicJsonUrl(topicUrl), {
        credentials: "include",
        signal: controller.signal,
        headers: {
          Accept: "application/json"
        }
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok || !contentType.includes("json")) {
        throw new Error(`Unexpected response: ${response.status}`);
      }

      const topic = await response.json();

      if (controller.signal.aborted || state.currentUrl !== topicUrl) {
        return;
      }

      renderTopic(topic, topicUrl, fallbackTitle);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      renderIframeFallback(topicUrl, fallbackTitle, error);
    } finally {
      if (state.abortController === controller) {
        state.abortController = null;
      }
    }
  }

  function renderTopic(topic, topicUrl, fallbackTitle) {
    setIframeModeEnabled(false);

    const posts = topic?.post_stream?.posts || [];

    if (!posts.length) {
      renderIframeFallback(topicUrl, fallbackTitle, new Error("No posts available"));
      return;
    }

    state.currentTopic = topic;
    state.title.textContent = topic.title || fallbackTitle || "帖子预览";
    state.meta.textContent = buildTopicMeta(topic, posts.length);
    state.content.replaceChildren(buildTopicView(topic, posts));
  }

  function buildTopicView(topic, posts) {
    const wrapper = document.createElement("div");
    wrapper.className = "ld-topic-view";

    const visiblePosts = getVisiblePosts(posts);

    if (!state.hasShownPreviewNotice) {
      const notice = document.createElement("div");
      notice.className = "ld-topic-note ld-topic-note-warning";
      notice.textContent = "抽屉预览是便捷阅读视图，标签和回复顺序可能与原帖页略有差异；需要完整阅读时可点右上角“新标签打开”。";
      wrapper.appendChild(notice);
      state.hasShownPreviewNotice = true;
    }

    if (Array.isArray(topic.tags) && topic.tags.length) {
      const tagList = document.createElement("div");
      tagList.className = "ld-tag-list";

      for (const tag of topic.tags) {
        const label = getTagLabel(tag);
        if (!label) {
          continue;
        }

        const item = document.createElement("span");
        item.className = "ld-tag";
        item.textContent = label;
        tagList.appendChild(item);
      }

      if (tagList.childElementCount > 0) {
        wrapper.appendChild(tagList);
      }
    }

    for (const post of visiblePosts) {
      wrapper.appendChild(buildPostCard(post));
    }

    const totalPosts = topic?.posts_count || posts.length;
    if (state.settings.postMode === "first" && posts.length > 1) {
      const note = document.createElement("div");
      note.className = "ld-topic-note";
      note.textContent = `当前为“仅首帖”模式。想看回复，可在右上角选项里切回“完整主题”。`;
      wrapper.appendChild(note);
    }

    if (state.settings.postMode !== "first" && state.settings.replyOrder === "latestFirst" && posts.length > 1) {
      const note = document.createElement("div");
      note.className = "ld-topic-note";
      note.textContent = `当前为“最新回复优先”模式。首帖保留在顶部，后续回复按从新到旧显示。`;
      wrapper.appendChild(note);
    }

    if (totalPosts > visiblePosts.length) {
      const note = document.createElement("div");
      note.className = "ld-topic-note";
      note.textContent = `当前抽屉预览了 ${visiblePosts.length} / ${totalPosts} 条帖子，完整内容可点右上角“新标签打开”。`;
      wrapper.appendChild(note);
    }

    return wrapper;
  }

  function getVisiblePosts(posts) {
    if (state.settings.postMode === "first") {
      return posts.slice(0, 1);
    }

    if (state.settings.replyOrder === "latestFirst" && posts.length > 1) {
      return [posts[0], ...posts.slice(1).reverse()];
    }

    return posts;
  }

  function getTagLabel(tag) {
    if (typeof tag === "string") {
      return tag;
    }

    if (!tag || typeof tag !== "object") {
      return "";
    }

    return tag.name || tag.id || tag.text || tag.label || "";
  }

  function buildPostCard(post) {
    const article = document.createElement("article");
    article.className = "ld-post-card";

    const header = document.createElement("div");
    header.className = "ld-post-header";

    const avatar = document.createElement("img");
    avatar.className = "ld-post-avatar";
    avatar.alt = post.username || "avatar";
    avatar.loading = "lazy";
    avatar.src = avatarUrl(post.avatar_template);

    const authorBlock = document.createElement("div");
    authorBlock.className = "ld-post-author";

    const authorRow = document.createElement("div");
    authorRow.className = "ld-post-author-row";

    const displayName = document.createElement("strong");
    displayName.textContent = post.name || post.username || "匿名用户";

    const username = document.createElement("span");
    username.className = "ld-post-username";
    username.textContent = post.username ? `@${post.username}` : "";

    authorRow.append(displayName, username);

    const meta = document.createElement("div");
    meta.className = "ld-post-meta";
    meta.textContent = buildPostMeta(post);

    authorBlock.append(authorRow, meta);
    header.append(avatar, authorBlock);

    const body = document.createElement("div");
    body.className = "ld-post-body cooked";
    body.innerHTML = post.cooked || "";

    for (const link of body.querySelectorAll("a[href]")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    article.append(header, body);
    return article;
  }

  function renderIframeFallback(topicUrl, fallbackTitle, error, forcedIframe = false) {
    setIframeModeEnabled(true);

    state.currentTopic = null;
    state.title.textContent = fallbackTitle || "帖子预览";
    state.meta.textContent = forcedIframe ? "当前为整页模式。" : "接口预览失败，已回退为完整页面。";

    const container = document.createElement("div");
    container.className = "ld-iframe-fallback";

    if (error) {
      const note = document.createElement("div");
      note.className = "ld-topic-note ld-topic-note-error";
      note.textContent = `预览接口不可用：${error?.message || "未知错误"}`;
      container.append(note);
    }

    const iframe = document.createElement("iframe");
    iframe.className = "ld-topic-iframe";
    iframe.src = topicUrl;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    container.append(iframe);
    state.content.replaceChildren(container);
  }

  function renderLoading() {
    return `
      <div class="ld-loading-state" aria-label="loading">
        <div class="ld-loading-bar"></div>
        <div class="ld-loading-bar ld-loading-bar-short"></div>
        <div class="ld-loading-card"></div>
        <div class="ld-loading-card"></div>
      </div>
    `;
  }

  function toTopicJsonUrl(topicUrl) {
    return `${topicUrl}.json`;
  }

  function avatarUrl(template) {
    if (!template) {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23d8dee9'/%3E%3C/svg%3E";
    }

    return new URL(template.replace("{size}", "96"), location.origin).toString();
  }

  function buildTopicMeta(topic, loadedPostCount) {
    const parts = [];

    if (topic.created_by?.username) {
      parts.push(`楼主 @${topic.created_by.username}`);
    }

    if (topic.created_at) {
      parts.push(formatDate(topic.created_at));
    }

    if (typeof topic.views === "number") {
      parts.push(`${topic.views.toLocaleString()} 浏览`);
    }

    const totalPosts = topic.posts_count || loadedPostCount;
    parts.push(`${totalPosts} 帖`);

    return parts.join(" · ");
  }

  function buildPostMeta(post) {
    const parts = [];

    if (post.created_at) {
      parts.push(formatDate(post.created_at));
    }

    if (typeof post.reads === "number") {
      parts.push(`${post.reads} 阅读`);
    }

    if (typeof post.reply_count === "number" && post.reply_count > 0) {
      parts.push(`${post.reply_count} 回复`);
    }

    return parts.join(" · ");
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function isTypingTarget(target) {
    return target instanceof HTMLElement && (
      target.isContentEditable ||
      target.matches("input, textarea, select") ||
      Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
    );
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      const settings = {
        ...DEFAULT_SETTINGS,
        ...(saved && typeof saved === "object" ? saved : {})
      };

      if (!(settings.drawerWidth in DRAWER_WIDTHS) && settings.drawerWidth !== "custom") {
        settings.drawerWidth = DEFAULT_SETTINGS.drawerWidth;
      }

      settings.drawerWidthCustom = clampDrawerWidth(settings.drawerWidthCustom);
      return settings;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function syncSettingsUI() {
    if (!state.settingsPanel) {
      return;
    }

    for (const control of state.settingsPanel.querySelectorAll("[data-setting]")) {
      const key = control.dataset.setting;
      if (key && key in state.settings) {
        control.value = state.settings[key];
      }
    }
  }

  function toggleSettingsPanel() {
    setSettingsPanelOpen(state.settingsPanel.hidden);
  }

  function handleSettingsPanelClick(event) {
    if (event.target === state.settingsPanel) {
      setSettingsPanelOpen(false);
    }
  }

  function setSettingsPanelOpen(isOpen) {
    if (!state.settingsPanel || !state.settingsToggle) {
      return;
    }

    if (isOpen) {
      updateSettingsPopoverPosition();
      queueMicrotask(() => state.settingsCard?.querySelector(".ld-setting-control")?.focus());
    }

    state.settingsPanel.hidden = !isOpen;
    state.settingsToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function handleSettingsChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const key = target.dataset.setting;
    if (!key || !(key in state.settings)) {
      return;
    }

    state.settings[key] = target.value;
    saveSettings();

    if (key === "drawerWidth") {
      applyDrawerWidth();
      syncSettingsUI();
      setSettingsPanelOpen(false);
      return;
    }

    refreshCurrentView();
    setSettingsPanelOpen(false);
  }

  function resetSettings() {
    state.settings = { ...DEFAULT_SETTINGS };
    syncSettingsUI();
    saveSettings();
    applyDrawerWidth();
    refreshCurrentView();
    setSettingsPanelOpen(false);
  }

  function applyDrawerWidth() {
    const width = state.settings.drawerWidth === "custom"
      ? `${clampDrawerWidth(state.settings.drawerWidthCustom)}px`
      : (DRAWER_WIDTHS[state.settings.drawerWidth] || DRAWER_WIDTHS.medium);

    document.documentElement.style.setProperty(
      "--ld-drawer-width",
      width
    );

    updateSettingsPopoverPosition();
  }

  function setIframeModeEnabled(enabled) {
    state.root?.classList.toggle(IFRAME_MODE_CLASS, enabled);
    document.body.classList.toggle(PAGE_IFRAME_OPEN_CLASS, Boolean(state.currentUrl) && enabled);
  }

  function refreshCurrentView() {
    if (!state.currentUrl) {
      return;
    }

    if (state.settings.previewMode === "iframe") {
      if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
      }

      renderIframeFallback(state.currentUrl, state.currentFallbackTitle, null, true);
      return;
    }

    if (state.currentTopic) {
      renderTopic(state.currentTopic, state.currentUrl, state.currentFallbackTitle);
      return;
    }

    loadTopic(state.currentUrl, state.currentFallbackTitle);
  }

  function clampDrawerWidth(value) {
    const numeric = Number(value);
    const maxWidth = Math.min(1400, Math.max(420, window.innerWidth - 40));

    if (!Number.isFinite(numeric)) {
      return Math.min(DEFAULT_SETTINGS.drawerWidthCustom, maxWidth);
    }

    return Math.min(Math.max(Math.round(numeric), 320), maxWidth);
  }

  function startDrawerResize(event) {
    if (event.button !== 0 || window.innerWidth <= 720) {
      return;
    }

    event.preventDefault();
    state.isResizing = true;
    document.body.classList.add("ld-drawer-resizing");
    state.settings.drawerWidth = "custom";
    syncSettingsUI();
    updateCustomDrawerWidth(event.clientX);
    state.resizeHandle?.setPointerCapture?.(event.pointerId);
  }

  function handleDrawerResizeMove(event) {
    if (!state.isResizing) {
      return;
    }

    event.preventDefault();
    updateCustomDrawerWidth(event.clientX);
  }

  function stopDrawerResize(event) {
    if (!state.isResizing) {
      return;
    }

    state.isResizing = false;
    document.body.classList.remove("ld-drawer-resizing");
    saveSettings();

    if (event?.pointerId !== undefined && state.resizeHandle?.hasPointerCapture?.(event.pointerId)) {
      state.resizeHandle.releasePointerCapture(event.pointerId);
    }
  }

  function updateCustomDrawerWidth(clientX) {
    state.settings.drawerWidth = "custom";
    state.settings.drawerWidthCustom = clampDrawerWidth(window.innerWidth - clientX);
    applyDrawerWidth();
  }

  function updateSettingsPopoverPosition() {
    if (!state.header || !state.settingsPanel) {
      return;
    }

    state.root.style.setProperty("--ld-settings-top", `${state.header.offsetHeight + 8}px`);
  }

  function handleWindowResize() {
    if (state.settings.drawerWidth === "custom") {
      state.settings.drawerWidthCustom = clampDrawerWidth(state.settings.drawerWidthCustom);
      applyDrawerWidth();
      saveSettings();
    } else {
      updateSettingsPopoverPosition();
    }
  }

  function watchLocationChanges() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      queueMicrotask(handleLocationChange);
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      queueMicrotask(handleLocationChange);
      return result;
    };

    window.addEventListener("popstate", handleLocationChange, true);

    let syncQueued = false;
    const queueNavigationSync = () => {
      if (syncQueued) {
        return;
      }

      syncQueued = true;
      requestAnimationFrame(() => {
        syncQueued = false;
        syncNavigationState();
      });
    };

    const observer = new MutationObserver(() => {
      if (location.href !== state.lastLocation) {
        handleLocationChange();
      } else if (state.currentUrl) {
        queueNavigationSync();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function handleLocationChange() {
    state.lastLocation = location.href;

    if (!document.querySelector(LIST_ROW_SELECTOR)) {
      closeDrawer();
      return;
    }

    syncNavigationState();
  }

  init();
})();
