# Reply Emoji Shortcode Design

## Goal

为抽屉自定义回复面板增加一个接近 Linux.do 风格的 emoji 选择面板。
用户点击工具栏中的 emoji 按钮后，可以：

- 按名称、别名搜索表情
- 按分类浏览常用表情
- 点击左侧分类后滚动到对应分组
- 滚动右侧内容时自动同步左侧分类高亮
- 点击后把表情以 `:alias:` 形式插入当前光标位置

## Scope

本次只做：

- emoji 工具按钮
- 搜索框
- 分类侧栏
- 右侧按分类分段展示
- 分类点击跳转与滚动联动高亮
- 点选插入 `:alias:`

本次不做：

- 输入 `:` 自动补全
- 远程拉取站点自定义表情
- 全量 Discourse 原生编辑器工具栏

## Data

数据源优先使用论坛当前页面下的：

- `/emojis.json`
- `/emojis/search-aliases.json`

请求失败时，回退到内置的一份常用 emoji shortcodes 数据表。统一适配成每项包含：

- `emoji`
- `alias`
- `category`
- `keywords`

搜索匹配 `alias` 和 `keywords`，插入时统一写成 `:alias:`。

## UX

- 面板挂在回复面板内部，不改发送和上传逻辑
- 默认视图按分类分段展示；搜索时切换为单独结果视图
- `Esc` 关闭 emoji 面板
- 点击面板外关闭
- 点击插入后自动关闭并回到输入框
- 窄屏和桌面端共用同一逻辑，只调整样式

## Verification

- 搜索 `grinning` 能命中 `:grinning_face:`
- 论坛接口可用时，面板优先显示论坛真实表情集与自定义表情
- 接口失败时自动回退到内置常用表情，不出现空白面板
- 点击 emoji 后，输入框插入对应 shortcode
- 点击左侧分类能跳到对应分组
- 滚动右侧内容时左侧分类高亮会同步更新
- 不影响现有粘贴图片上传和 `Ctrl+Enter` 发送
