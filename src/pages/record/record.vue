<template>
  <view class="page">
    <view class="header">
      <view class="header-content">
        <text class="header-title">成长足迹</text>
        <text class="header-subtitle">不忘初心，方得始终</text>
      </view>
      <view class="header-stats">
        <text class="stats-num">{{ list.length }}</text>
        <text class="stats-label">已走过的里程</text>
      </view>
    </view>

    <view v-if="list.length" class="timeline">
      <view
        v-for="(item, i) in list"
        :key="i"
        class="timeline-item"
        :class="{ 'is-last': i === list.length - 1 }"
      >
        <!-- 左侧坐标轴 -->
        <view class="timeline-axis">
          <view class="node">
            <text class="node-icon">★</text>
          </view>
          <view v-if="i !== list.length - 1" class="line"></view>
        </view>

        <!-- 右侧内容卡片 -->
        <view class="timeline-content">
          <view class="record-card">
            <view class="card-header">
              <text class="record-date">{{ item.dateText }}</text>
              <text class="record-time">{{ item.time }}</text>
            </view>
            <view class="card-body">
              <text class="record-text">{{ item.content || '今日无感悟，砥砺前行。' }}</text>
            </view>
            <!-- 装饰角标 -->
            <view class="card-number">#{{ list.length - i }}</view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <view class="empty-icon">★</view>
      <text class="empty-text">长征万里，始于足下</text>
      <button class="goto-btn" @click="gotoHome">开始今日习读</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../api/request'

const list = ref([])
const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

async function loadList() {
  try {
    const res = await request({ url: '/api/checkin/records', method: 'GET' })
    if (res?.data?.code === 0) {
      const rows = res.data.data.list || []
      list.value = rows.map((item) => {
        const d = new Date(item.date)
        const month = d.getMonth() + 1
        const day = d.getDate()
        const week = weekMap[d.getDay()]
        return { 
          dateText: `${month}月${day}日 ${week}`, 
          time: item.time || '', 
          content: item.content || '' 
        }
      }).reverse() // 最新的在最上面
    }
  } catch (e) {
    // Fallback to local storage
    const raw = uni.getStorageSync('punch_records') || []
    list.value = raw.map((item) => {
      const d = new Date(item.date)
      return {
        dateText: `${d.getMonth() + 1}月${d.getDate()}日 ${weekMap[d.getDay()]}`,
        time: item.time || '',
        content: item.content || ''
      }
    }).reverse()
  }
}

function gotoHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

onMounted(() => {
  loadList()
})
</script>

<script>
// 为了在 tab 切换时刷新数据
export default {
  onShow() {
    this.$nextTick(() => {
      // 这里的逻辑在 setup 中通过 onMounted 也可以，但 switchTab 不会触发 onMounted
      // 所以保留 onShow 刷新
    })
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #faf9f6; // 宣纸白
  padding: 40rpx 30rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 60rpx;
  padding: 0 10rpx;
  border-bottom: 4rpx solid #c41e3a;
  padding-bottom: 20rpx;
}

.header-title {
  font-size: 48rpx;
  font-weight: 800;
  color: #c41e3a;
  display: block;
}

.header-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.header-stats {
  text-align: right;
}

.stats-num {
  font-size: 52rpx;
  font-weight: 800;
  color: #c41e3a;
  line-height: 1;
}

.stats-label {
  font-size: 20rpx;
  color: #999;
  display: block;
}

.timeline {
  padding-left: 20rpx;
}

.timeline-item {
  display: flex;
  margin-bottom: 0;
}

.timeline-axis {
  width: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.node {
  width: 44rpx;
  height: 44rpx;
  background-color: #fff;
  border: 4rpx solid #c41e3a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 4rpx 10rpx rgba(196, 30, 58, 0.2);
}

.node-icon {
  font-size: 24rpx;
  color: #c41e3a;
}

.line {
  flex: 1;
  width: 4rpx;
  background: linear-gradient(to bottom, #c41e3a, rgba(196, 30, 58, 0.1));
  margin: -4rpx 0;
}

.timeline-content {
  flex: 1;
  padding-left: 30rpx;
  padding-bottom: 60rpx; // 控制节点间距
}

.record-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #eee;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6rpx;
    background: #c41e3a;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.record-date {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

.record-time {
  font-size: 24rpx;
  color: #c41e3a;
  background: rgba(196, 30, 58, 0.05);
  padding: 2rpx 16rpx;
  border-radius: 20rpx;
}

.record-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.card-number {
  position: absolute;
  right: -10rpx;
  bottom: -10rpx;
  font-size: 60rpx;
  font-weight: 900;
  color: rgba(196, 30, 58, 0.03);
  font-style: italic;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 100rpx;
  color: rgba(196, 30, 58, 0.1);
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.goto-btn {
  background: #c41e3a;
  color: #fff;
  border-radius: 50rpx;
  padding: 0 60rpx;
  font-size: 30rpx;
  height: 88rpx;
  line-height: 88rpx;
}
</style>
