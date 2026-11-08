# LeetCode 3 动画规格说明（ANIMATION_SPEC）

> 对应 AC-023；本规格先于动画实现制定。最终 PASS 仍需满足 AC-001～AC-025（含 AC-024）及 B1-B7。

## 1. 观察状态与布局
- 主结构：输入字符串的 Unicode code point 数组，稳定节点 ID `char-{index}`。
- 辅助结构：字符最近出现位置的哈希表逻辑（索引标记）及最长子串快照。
- 标量：left/right、当前窗口、最长长度；每帧变量快照绑定代码 anchor。
- 单帧最多一个 `current`，重复比较最多两个 `compare`。
- 初始题解步骤示例输入 `abcabcbb` 共 25 个语义帧，输入提交后按原始输入重算快照。

## 2. 分镜
| operation | 焦点 | 状态/数据变化 | narration 要点 | anchor |
| --- | --- | --- | --- | --- |
| init | 无 | 建立空窗 | 为什么 left 从 0 开始且单向移动 | init |
| compare | 重复字符与旧位置 | 标记冲突 | 因重复位置仍在窗内，左边界必须越过旧位置 | duplicate |
| move | 左边界 | 左边界右移、被排除字符留 visited | 哈希记录允许直接跳过已证无效范围 | shrink |
| read | 当前右端字符 | 扩展窗口 | 添加字符后窗口唯一，长度可计算 | read |
| match | 当前窗口 | 最长结果变更并保持 done | 只有长度严格变大才覆盖最佳结果 | update-best |
| done | 最终答案 | 最终子串保持 done | 扫描完成并给出长度 | return |

每个步骤是不可变快照；重复步骤 narration 中包含具体对象、原因/结果，相邻步骤不同。代码有 Java/Python/Go/JavaScript anchor 对照。

## 3. 坐标与结构
- 逻辑 viewBox 1200×720；数组沿 x 轴固定等距，坐标公式 `x = 80 + index * 1040 / max(n-1, 1)`，y=350。
- 所有输入节点全部落在画布范围内；同一输入内每帧 ID 和坐标保持稳定。
- 窗口标注通过 `placeLabels` 测量/避让，窗口节点被明确标识；最终最长子串用 done 状态。
- SVG 基于容器比例动态扩展 viewBox，不留空黑边；D3 按 ID keyed join，分层为 containers/edges/arrows/nodes/labels。
- D3 zoom 支持缩放与平移；用户操作镜头后步骤不重置 transform。

## 4. 运动与状态

本项目采用 **运动语法**：`MOTION` token 控制 enter/update/exit/arrow 时长，倍速、暂停节拍和 reduced-motion 统一处理。步骤节点使用稳定 ID 和坐标实现 **稳定布局**；每帧先 interrupt 命名转场，退场由 `fadeOutAndRemove` 清理。

## 状态图例与教学层
固定 **状态图例** 为 current / compare / visited / done，配合索引徽标与节点边框作为非颜色冗余编码。画布始终展示 **操作徽标**、步骤解说、图例及三个指标。

## 辅助结构容器
本题不使用栈/队列，因此无需 **辅助结构容器**；保留模板容器层以便未来数据结构复用。

## 箭头与标注规范
当前边界迁移箭头包含动作 + 对象文本；窗口标注提供主行和 detail 第二行，通过 placeLabels 自动避让。此即 **箭头与标注规范**。

## 画布优先与无障碍
按 **画布优先** 空间预算验收：1366×768 chrome ≤26%、画布卡片 ≥62%、SVG ≥50%；1920×1080 分别 ≤22%、≥76%、≥66%。必须响应 **prefers-reduced-motion**，且零动效时仍完整更新语义信息。
- `MOTION` tokens 控制 enter/update/exit/arrow 时长；倍速、暂停节拍和 reduced-motion 统一处理。
- 转场前按命名 transition interrupt；退场由 `fadeOutAndRemove` 清理。
- 状态色固定 current/compare/visited/done；索引徽标、节点边框与固定文字图例作为非颜色冗余编码。
- 常驻 operation badge、step narration、固定 legend 和三个来自快照的 metrics。
- reduced-motion 下 D3 JS 时长为 0、CSS 动画关闭，语义状态/解说/图例/代码绑定继续更新。

## 5. 1x/3x/跳步/reduced-motion 实测记录
- 1x 完整播放：须逐帧确认 narration 与窗口、焦点、代码行一致。
- 3x 快速播放：须观察命名 transition 不排队、不会闪回。
- 随机跳步 10 次：节点稳定、operation/narration 与目标快照一致。
- reduced-motion 截图：状态、代码高亮、图例、指标仍完整更新且 JS 时长为 0。
- 上述项目在最终发布前须用真实浏览器执行并记录结果，不能只用静态审阅代替。

## 6. 证据计划及当前结果
- 已有组件化动画实现，单测覆盖步骤语义、稳定节点 ID、图例/时长、标签布局、渲染及快速退场清理。
- 必须实测：1366×768 与 1920×1080 空间预算；1x/3x 播放；随机跳步 10 次；语言切换；reduced-motion；实际画布平移/缩放。
- 证据路径：`test-results/`（Playwright 输出）及验收报告模板。最终 B1-B7 结论以实际全套命令和浏览器检查为准。
