<script setup>
import { ref, computed, onMounted, watch, nextTick, defineAsyncComponent, markRaw } from 'vue'
import { demos } from './demos'
import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/atom-one-dark.min.css'

hljs.registerLanguage('javascript', javascript)

const searchQuery = ref('')
const displayQuery = ref('') // 用于实际显示的查询
const currentPage = ref(1)
const pageSize = 9
const selectedDemo = ref(null)
const activeTab = ref('demo') // 'explanation', 'code', 'demo'
const copied = ref(false)

const filteredDemos = computed(() => {
  const query = displayQuery.value.toLowerCase()
  return demos.filter(demo =>
    demo.title.toLowerCase().includes(query) ||
    (Array.isArray(demo.tag) ? demo.tag.some(t => t.toLowerCase().includes(query)) : demo.tag.toLowerCase().includes(query)) ||
    demo.content.toLowerCase().includes(query)
  )
})

const handleSearch = () => {
  displayQuery.value = searchQuery.value
  currentPage.value = 1
}

const handleClear = () => {
  searchQuery.value = ''
  displayQuery.value = ''
  currentPage.value = 1
}

const totalPages = computed(() => Math.ceil(filteredDemos.value.length / pageSize))

const paginatedDemos = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredDemos.value.slice(start, end)
})

const selectDemo = (demo) => {
  selectedDemo.value = {
    ...demo,
    explanationContent: '',
    sourceCodeContent: '',
    DemoComponent: null
  }
  loadDemoContent(demo)
}

const loadDemoContent = async (demo) => {
  try {
    const [explanationModule, sourceCodeModule, componentModule] = await Promise.all([
      demo.explanation(),
      demo.sourceCode(),
      demo.component()
    ])
    nextTick(() => {
      selectedDemo.value.explanationContent = explanationModule.default
      selectedDemo.value.sourceCodeContent = sourceCodeModule.default
      selectedDemo.value.DemoComponent = markRaw(componentModule.default)
      highlightCode()
    })
  } catch (error) {
    console.error('Error loading demo:', error)
  }
}

const goBack = () => {
  selectedDemo.value = null
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const highlightCode = () => {
  nextTick(() => {
    const codeBlocks = document.querySelectorAll('pre code')
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block)
    })
  })
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(selectedDemo.value.sourceCodeContent)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

watch(selectedDemo, (newVal) => {
  if (newVal) {
    nextTick(() => {
      highlightCode()
    })
  }
})

watch(activeTab, (newVal) => {
  if (newVal === 'code') {
    nextTick(() => {
      highlightCode()
    })
  }
})
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="title">
        <span class="icon">🎨</span>
        Three.js Demo 集合
        <span class="icon">✨</span>
      </h1>
    </header>

    <div v-if="!selectedDemo" class="main-content">
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="搜索 demo ..." class="search-input"
          @keyup.enter="handleSearch" />
        <button v-if="searchQuery || displayQuery" class="clear-btn" @click="handleClear">✕ 清除</button>
        <button class="search-btn" @click="handleSearch">🔍 搜索</button>
      </div>

      <div class="demo-list">
        <div v-for="demo in paginatedDemos" :key="demo.id" class="demo-card" @click="selectDemo(demo)">
          <div class="demo-header">
            <h3 class="demo-title">{{ demo.title }}</h3>
            <div class="demo-tags">
              <span v-for="(tag, index) in demo.tag" :key="index" class="demo-tag">{{ tag }}</span>
            </div>
          </div>
          <p class="demo-content">{{ demo.content }}</p>
          <div class="demo-arrow">→</div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
          下一页
        </button>
      </div>
    </div>

    <div v-else class="demo-view">
      <div class="demo-view-header-bar">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="demo-info">
          <h2 class="demo-view-title">{{ selectedDemo.title }}</h2>
          <div class="demo-view-tags">
            <span v-for="(tag, index) in selectedDemo.tag" :key="index" class="demo-view-tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button v-for="tab in [
          { id: 'demo', label: '效果实现', icon: '🎬' },
          { id: 'code', label: '核心源码', icon: '💻' },
          { id: 'explanation', label: '功能解释', icon: '📚' },

        ]" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'explanation'" class="explanation-panel">
          <pre class="explanation-text">{{ selectedDemo.explanationContent }}</pre>
        </div>

        <div v-if="activeTab === 'code'" class="code-panel">
          <div class="code-header">
            <div class="code-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <span class="code-title">JavaScript</span>
            <button class="copy-btn" @click="copyCode">
              <span v-if="copied">✓ 已复制</span>
              <span v-else>📋 复制代码</span>
            </button>
          </div>
          <pre class="code-pre"><code ref="codeRef" class="language-javascript">{{ selectedDemo.sourceCodeContent }}</code></pre>
        </div>

        <div v-if="activeTab === 'demo'" class="demo-panel">
          <component v-if="selectedDemo.DemoComponent" :is="selectedDemo.DemoComponent" />
          <div v-else class="loading">加载中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #ffffff;
  height: 100vh;
  overflow: hidden;
}

.app {
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  color: #333;
  padding: 15px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 5px;
}

.header p {
  font-size: 1rem;
  color: #666;
}

.main-content {
  background: white;
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  margin-bottom: 30px;
  flex-shrink: 0;
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 15px 20px;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #667eea;
}

.search-btn {
  padding: 15px 30px;
  font-size: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.search-btn:active {
  transform: translateY(0);
}

.clear-btn {
  padding: 15px 24px;
  font-size: 1rem;
  background: #f5f5f5;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #ff5252;
  color: white;
  border-color: #ff5252;
}

.demo-list {
  display: grid;
  padding-top: 10px;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  align-content: start;
  padding-right: 5px;
  margin-bottom: 20px;
}

.demo-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  padding: 25px;
  min-height: 160px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.demo-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.demo-card:hover::before {
  transform: scaleX(1);
}

.demo-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px -10px rgba(102, 126, 234, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.demo-title {
  font-size: 1.1rem;
  color: #333;
  flex: 1;
}

.demo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.demo-tag {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.demo-content {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
}

.demo-arrow {
  position: absolute;
  bottom: 20px;
  right: 25px;
  font-size: 1.5rem;
  color: #667eea;
  opacity: 0;
  transition: all 0.4s ease;
  transform: translateX(-10px);
}

.demo-card:hover .demo-arrow {
  opacity: 1;
  transform: translateX(0);
  animation: bounce 1s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(5px);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.page-btn {
  padding: 10px 25px;
  font-size: 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
}

.demo-view {
  background: white;
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.demo-view-header-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.back-btn {
  background: #f0f0f0;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #e0e0e0;
}

.demo-info {
  flex: 1;
}

.demo-view-title {
  font-size: 2rem;
  color: #333;
  margin-bottom: 8px;
}

.demo-view-tags {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}

.demo-view-tag {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 15px;
  border-radius: 15px;
  font-size: 0.9rem;
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f8f9fa;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 8px 8px 0 0;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
}

.tab-btn:hover {
  background: #e9ecef;
}

.tab-btn.active {
  background: white;
  border-bottom-color: #667eea;
  color: #667eea;
  font-weight: 600;
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-content {
  flex: 1;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.explanation-panel,
.code-panel,
.demo-panel {
  flex: 1;
  overflow: auto;
}

.explanation-panel {
  background: #f8f9fa;
  padding: 30px;
}

.explanation-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.8;
  color: #333;
  font-size: 1rem;
  white-space: pre-wrap;
}

.code-panel {
  background: #282c34;
  display: flex;
  flex-direction: column;
}

.code-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #21252b;
  border-bottom: 1px solid #3a3f4b;
}

.code-dots {
  display: flex;
  gap: 8px;
  margin-right: 20px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red { background: #f55; }
.dot-yellow { background: #fa0; }
.dot-green { background: #5c5; }

.code-title {
  color: #abb2bf;
  font-size: 0.85rem;
  font-weight: 500;
  flex: 1;
}

.copy-btn {
  background: #3e4451;
  color: #abb2bf;
  border: 1px solid #4b5363;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-btn:hover {
  background: #4b5363;
  border-color: #636d83;
  color: #fff;
}

.code-pre {
  margin: 0;
  padding: 24px 30px;
  flex: 1;
  overflow: auto;
  text-align: left;
}

.code-pre code {
  font-size: 0.95rem;
  line-height: 1.8;
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  text-align: left;
}

/* 优化一下滚动条 */
.code-pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-pre::-webkit-scrollbar-track {
  background: #21252b;
}

.code-pre::-webkit-scrollbar-thumb {
  background: #4b5363;
  border-radius: 4px;
}

.code-pre::-webkit-scrollbar-thumb:hover {
  background: #636d83;
}

.demo-panel {
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading {
  color: white;
  font-size: 1.2rem;
}
</style>
