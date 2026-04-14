<template>
  <view class="page">
    <view class="summary-card">
      <text class="summary-title">毛泽东选集 · 精选阅读</text>
      <text class="summary-sub">已读 {{ stats.completedCount }}/{{ stats.totalCount }} 篇 · 完成度 {{ stats.avgProgress }}%</text>
      <view class="summary-bar">
        <view class="summary-fill" :style="{ width: stats.avgProgress + '%' }"></view>
      </view>
    </view>

    <scroll-view class="category-scroll" scroll-x>
      <view class="category-list">
        <view
          v-for="cat in categories"
          :key="cat"
          class="category-item"
          :class="{ active: currentCategory === cat }"
          @click="currentCategory = cat"
        >
          {{ cat }}
        </view>
      </view>
    </scroll-view>

    <view class="article-list">
      <view v-for="item in filteredArticles" :key="item.id" class="article-card" @click="goRead(item.id)">
        <view class="card-top">
          <text class="title">{{ item.title }}</text>
          <text class="year">{{ item.year }}</text>
        </view>
        <text class="subtitle">{{ item.subtitle }}</text>
        <text class="summary">{{ item.summary }}</text>
        <view class="meta-row">
          <text class="tag">{{ item.category }}</text>
          <text class="progress-text">{{ getProgress(item.id).progress }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: getProgress(item.id).progress + '%' }"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { articles, categories } from './data/articles'
import { getArticleProgress, getReadingStats } from './readingStorage'

const currentCategory = ref('全部')
const stats = ref({ completedCount: 0, totalCount: articles.length, avgProgress: 0 })

const filteredArticles = computed(() => {
  if (currentCategory.value === '全部') return articles
  return articles.filter((a) => a.category === currentCategory.value)
})

function getProgress(id) {
  return getArticleProgress(id)
}

function refreshStats() {
  stats.value = getReadingStats(articles.length)
}

function goRead(id) {
  uni.navigateTo({ url: `/pages/reading/article?id=${id}` })
}

onMounted(refreshStats)
onShow(refreshStats)
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #faf9f6; padding: 24rpx; }
.summary-card { background: linear-gradient(135deg,#c41e3a,#a01830); border-radius: 20rpx; padding: 28rpx; color: #fff; }
.summary-title { display: block; font-size: 34rpx; font-weight: 700; }
.summary-sub { display: block; margin-top: 8rpx; font-size: 24rpx; opacity: .9; }
.summary-bar { margin-top: 16rpx; height: 10rpx; background: rgba(255,255,255,.25); border-radius: 999rpx; overflow: hidden; }
.summary-fill { height: 100%; background: #fff; }
.category-scroll { margin: 20rpx 0; white-space: nowrap; }
.category-list { display: inline-flex; gap: 16rpx; }
.category-item { padding: 10rpx 22rpx; background: #fff; border-radius: 999rpx; color: #666; border: 1rpx solid #eee; font-size: 24rpx; }
.category-item.active { background: #c41e3a; color: #fff; border-color: #c41e3a; }
.article-list { display: flex; flex-direction: column; gap: 18rpx; }
.article-card { background: #fff; border-radius: 18rpx; padding: 24rpx; border: 1rpx solid #eee; }
.card-top { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 32rpx; color: #222; font-weight: 700; }
.year { font-size: 22rpx; color: #999; }
.subtitle { display:block; margin-top: 8rpx; font-size: 24rpx; color: #555; }
.summary { display:block; margin-top: 8rpx; font-size: 24rpx; color: #777; }
.meta-row { margin-top: 14rpx; display:flex; justify-content: space-between; align-items:center; }
.tag { background: rgba(196,30,58,.1); color:#c41e3a; border-radius: 999rpx; padding: 4rpx 14rpx; font-size: 22rpx; }
.progress-text { font-size: 22rpx; color: #c41e3a; font-weight: 600; }
.progress-bar { margin-top: 10rpx; height: 10rpx; background:#f0f0f0; border-radius: 999rpx; overflow:hidden; }
.progress-fill { height:100%; background: linear-gradient(90deg,#c41e3a,#e63946); }
</style>
