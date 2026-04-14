<template>
  <view class="page">
    <view class="head">
      <text class="title">{{ article?.title || '经典著作' }}</text>
      <text class="sub">阅读进度 {{ progress.progress }}%</text>
      <view class="bar"><view class="fill" :style="{ width: progress.progress + '%' }"></view></view>
    </view>

    <scroll-view class="content" scroll-y :scroll-top="progress.scrollTop" @scroll="onScroll">
      <text class="article-title">{{ article?.title }}</text>
      <text class="article-subtitle">{{ article?.subtitle }} · {{ article?.year }}</text>
      <text class="article-text">{{ article?.content }}</text>
      <view style="height: 40rpx"></view>
    </scroll-view>

    <view class="footer">
      <button class="btn mark" @click="markDone">标记已读</button>
      <button class="btn back" @click="goBack">返回列表</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getArticleById } from './data/articles'
import { getArticleProgress, updateArticleProgress, markArticleCompleted } from './readingStorage'

const article = ref(null)
const articleId = ref('')
const progress = ref({ progress: 0, isCompleted: false, scrollTop: 0 })

onLoad((query) => {
  articleId.value = query?.id || ''
  article.value = getArticleById(articleId.value)
})

function loadProgress() {
  progress.value = getArticleProgress(articleId.value)
}

function onScroll(e) {
  const { scrollTop, scrollHeight, deltaY } = e.detail
  if (!scrollHeight) return
  const viewHeight = 1
  const ratio = Math.max(0, Math.min(1, scrollTop / Math.max(1, scrollHeight - viewHeight)))
  const p = Math.round(ratio * 100)
  progress.value = updateArticleProgress(articleId.value, {
    progress: Math.max(progress.value.progress, p),
    scrollTop,
    isCompleted: p >= 100 || progress.value.isCompleted,
    deltaY,
  })
}

function markDone() {
  progress.value = markArticleCompleted(articleId.value)
  uni.showToast({ title: '已标记完成', icon: 'success' })
}

function goBack() {
  uni.navigateBack()
}

onMounted(loadProgress)
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f7f4ef; display:flex; flex-direction:column; }
.head { padding: 24rpx; background:#fff; border-bottom: 1rpx solid #eee; }
.title { display:block; font-size: 34rpx; font-weight:700; color:#222; }
.sub { display:block; margin-top:6rpx; font-size:22rpx; color:#c41e3a; }
.bar { margin-top: 12rpx; height: 8rpx; background:#f0f0f0; border-radius:999rpx; overflow:hidden; }
.fill { height:100%; background: linear-gradient(90deg,#c41e3a,#e63946); }
.content { flex:1; padding: 30rpx; }
.article-title { display:block; font-size:40rpx; color:#222; font-weight:700; margin-bottom: 12rpx; }
.article-subtitle { display:block; font-size:24rpx; color:#888; margin-bottom: 24rpx; }
.article-text { font-size: 30rpx; color:#333; line-height: 1.9; white-space: pre-wrap; }
.footer { padding: 20rpx; background:#fff; display:flex; gap:16rpx; border-top:1rpx solid #eee; }
.btn { flex:1; height:86rpx; line-height:86rpx; border-radius: 43rpx; font-size: 30rpx; }
.mark { background:#c41e3a; color:#fff; }
.back { background:#f5f5f5; color:#666; }
</style>
