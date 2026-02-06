# Visual Sitemap Scanner — Mini Spec

## 目标
输入任意网站 URL，深度爬取页面链接，生成交互式可视化站点地图，展示页面间的链接关系。

## 核心功能
1. **URL 输入** — 用户输入目标网站 URL
2. **深度爬取** — 使用 Playwright 递归爬取页面链接（默认深度 3，最多 100 页）
3. **可视化展示** — D3.js force-directed graph 展示页面节点和链接关系
4. **交互功能** — 缩放、拖拽、点击节点查看详情（URL、标题、链接数）
5. **导出** — 导出 JSON 格式的站点结构数据

## 技术方案
- **前端**: React + Vite (TypeScript) + D3.js
- **后端**: Python FastAPI + Playwright（无头浏览器爬取）
- **AI 调用**: 无（纯工具型，不需要 LLM）
- **部署**: Docker → langsheng

## 美学方向
**Retro-Futuristic Terminal** — 复古科幻计算机终端风格
- 深色背景 + 磷光绿/琥珀色
- Monospace 字体显示 URL 数据
- 扫描线效果
- 节点连接如同电路/网络拓扑图
- 字体：JetBrains Mono（代码）+ Space Mono（UI）

## 完成标准
- [ ] 核心功能可用（输入 URL → 爬取 → 可视化）
- [ ] 部署到 sitemap.demo.densematrix.ai
- [ ] Health check 通过
- [ ] 7 种语言 i18n
- [ ] 基本 UI 可用（终端风格，能看能用）
