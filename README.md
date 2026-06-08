# Three.js Demo 集合（Vue 3 + Vite）

一个用于学习与验证 Three.js 知识点的 Demo 集合站点：支持搜索/分页，点击进入 Demo 后可查看「效果实现 / 核心源码 / 功能解释」。

技术栈：

- Vue 3（SFC + `<script setup>`）
- Vite
- Three.js
- highlight.js（代码高亮）

## 快速开始

环境要求：Node.js 18+（建议使用 LTS）

安装依赖：

```bash
npm i
```

启动开发环境：

```bash
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

## Demo 如何组织

所有 Demo 都在 [src/demos](./src/demos) 下，以“序号-标题”文件夹形式存放，例如：

```
src/demos/53-材质渲染视口/
  config.js
  index.vue
  explanation.md
  source.js
```

项目会自动扫描并注册所有 Demo（见 [src/demos/index.js](./src/demos/index.js)）：

- `config.js`：Demo 元信息（必须）
  - `id`：必须与文件夹名一致（例如 `53-材质渲染视口`）
  - `title`：展示名称
  - `tag`：标签数组
  - `content`：列表简介
  - `order`：排序用数字（从小到大）
- `index.vue`：Demo 具体实现（渲染画布 + 交互）
- `explanation.md`：功能解释（以文本展示）
- `source.js`：核心代码片段（以代码高亮展示）

## 页面功能

首页：

- 支持按 `title/tag/content` 搜索
- 分页展示 Demo 列表（每页 9 个）

详情页：

- 效果实现：直接渲染 Demo 组件
- 核心源码：展示 `source.js` 并支持一键复制
- 功能解释：展示 `explanation.md`

实现入口： [src/App.vue](./src/App.vue)

## 常见说明

- 部分加载/压缩相关 Demo（DRACO/KTX2/Meshopt）可能依赖在线解码资源；离线环境下可能加载失败
- 建议每个 Demo 在卸载时释放资源（geometry/material/texture/controls/renderer 等），避免切换 Demo 后占用持续增长
