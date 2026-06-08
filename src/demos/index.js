// 动态加载所有 demos
// 每个 demo 文件夹必须包含：
// - config.js (配置信息)
// - index.vue (渲染组件)
// - explanation.md (功能解释)
// - source.js (核心代码)

const demoModules = import.meta.glob('./**/config.js', { eager: true })

export const demos = Object.values(demoModules).map((module) => {
  const config = module.default
  const demoId = config.id
  
  return {
    ...config,
    explanation: () => import(`./${demoId}/explanation.md?raw`),
    sourceCode: () => import(`./${demoId}/source.js?raw`),
    component: () => import(`./${demoId}/index.vue`)
  }
}).sort((a, b) => a.order - b.order)

export default demos
