<template>
  <view class="page">
    <!-- 顶部：习读金句 -->
    <view class="quote-card">
      <view class="quote-content">
        <text class="quote-text">“{{ currentQuote.text }}”</text>
        <text class="quote-author">—— {{ currentQuote.author }}</text>
      </view>
    </view>

    <!-- 日期状态 -->
    <view class="header">
      <view class="header-left">
        <text class="header-date">{{ todayText }}</text>
        <text class="header-week">{{ weekText }}</text>
      </view>
      <view class="header-right">
        <text class="tag">{{ todayChecked ? '已习读' : '待习读' }}</text>
      </view>
    </view>

    <!-- 核心操作区 -->
    <view class="main-card">
      <view class="status-circle" :class="{ active: todayChecked }">
        <text class="status-icon">{{ todayChecked ? '★' : '学' }}</text>
      </view>
      <text class="status-title">{{ todayChecked ? '今日已完成学思践悟' : '尚未开始今日学习' }}</text>
      <text v-if="todayChecked" class="status-time">打卡时间：{{ todayCheckTime }}</text>
      
      <button
        class="btn-punch"
        :class="{ disabled: todayChecked }"
        @click="openPunchPopup"
        :disabled="todayChecked"
      >
        {{ todayChecked ? '今日任务已完成' : '立即学思打卡' }}
      </button>
    </view>

    <!-- 数据统计 -->
    <view class="stats-grid">
      <view class="stat-card">
        <text class="stat-value">{{ streakDays }}</text>
        <text class="stat-label">连续天数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ totalCount }}</text>
        <text class="stat-label">累计次数</text>
      </view>
    </view>

    <!-- 学习计划卡片 -->
    <view class="plan-card" @click="gotoPlan">
      <view class="plan-header">
        <view class="plan-title-row">
          <text class="plan-icon">🎯</text>
          <text class="plan-title">学习计划</text>
        </view>
        <text class="plan-arrow">›</text>
      </view>
      
      <view class="plan-progress-list">
        <view class="plan-progress-item">
          <view class="progress-info">
            <text class="progress-label">📅 本周</text>
            <text class="progress-value">{{ planProgress.weekCount }}/{{ planGoals.weeklyGoal }}</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: weekProgressPercent + '%' }"></view>
          </view>
        </view>
        
        <view class="plan-progress-item">
          <view class="progress-info">
            <text class="progress-label">📆 本月</text>
            <text class="progress-value">{{ planProgress.monthCount }}/{{ planGoals.monthlyGoal }}</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: monthProgressPercent + '%' }"></view>
          </view>
        </view>
        
        <view class="plan-progress-item">
          <view class="progress-info">
            <text class="progress-label">🔥 连续</text>
            <text class="progress-value">{{ planProgress.streakDays }}/{{ planGoals.streakGoal }}</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: streakProgressPercent + '%' }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 打卡填写弹窗 -->
    <view v-if="showPunchPopup" class="popup-mask" @click="closePunchPopup">
      <view class="popup-box" @click.stop>
        <text class="popup-title">撰写习读心得</text>
        <textarea
          class="popup-input"
          v-model="punchContent"
          placeholder="感悟思想伟力，汲取奋斗力量。请输入今日学习心得..."
          placeholder-class="popup-placeholder"
          maxlength="500"
          :auto-focus="true"
        />
        <view class="popup-actions">
          <button class="popup-btn cancel" @click="closePunchPopup">暂存</button>
          <button class="popup-btn submit" @click="submitPunch">提交心得</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../api/request'
import { getPlanGoals, calculateProgress, savePunchRecords, upsertPunchRecord } from '../plan/planUtils'

const todayChecked = ref(false)
const todayCheckTime = ref('')
const streakDays = ref(0)
const totalCount = ref(0)
const recordList = ref([])
const showPunchPopup = ref(false)
const punchContent = ref('')

// 学习计划相关数据
const planGoals = ref({
  weeklyGoal: 5,
  monthlyGoal: 20,
  streakGoal: 30
})
const planProgress = ref({
  weekCount: 0,
  monthCount: 0,
  streakDays: 0
})

// 计算进度百分比
const weekProgressPercent = computed(() => {
  if (planGoals.value.weeklyGoal === 0) return 0
  return Math.min((planProgress.value.weekCount / planGoals.value.weeklyGoal) * 100, 100)
})
const monthProgressPercent = computed(() => {
  if (planGoals.value.monthlyGoal === 0) return 0
  return Math.min((planProgress.value.monthCount / planGoals.value.monthlyGoal) * 100, 100)
})
const streakProgressPercent = computed(() => {
  if (planGoals.value.streakGoal === 0) return 0
  return Math.min((planProgress.value.streakDays / planGoals.value.streakGoal) * 100, 100)
})

const quotes = [
  { text: '星星之火，可以燎原。', author: '毛泽东' },
  { text: '一万年太久，只争朝夕。', author: '毛泽东' },
  { text: '实事求是。', author: '毛泽东' },
  { text: '世上无难事，只要肯登攀。', author: '毛泽东' },
  { text: '为人民服务。', author: '毛泽东' }
]
const currentQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])

const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const d = new Date()
const todayText = `${d.getMonth() + 1}月${d.getDate()}日`
const weekText = weekMap[d.getDay()]

// 初始化加载
async function initData() {
  try {
    // 1. 优先获取今日状态，确保按钮状态准确
    const statusRes = await request({ url: '/api/checkin/today', method: 'GET' })
    if (statusRes?.data?.code === 0) {
      const { checked, checkTime } = statusRes.data.data
      todayChecked.value = !!checked
      todayCheckTime.value = checkTime || ''
    }

    // 2. 获取统计数据
    const statsRes = await request({ url: '/api/checkin/stats', method: 'GET' })
    if (statsRes?.data?.code === 0) {
      streakDays.value = statsRes.data.data.streakDays || 0
      totalCount.value = statsRes.data.data.monthCount || 0 // 暂时用月统计代替总计
    }

    // 3. 同步后端打卡记录，用于学习计划进度计算
    await syncRemoteRecords()
  } catch (e) {
    console.warn('API加载失败，尝试读取本地缓存')
    loadLocalFallback()
  }
  
  // 4. 加载学习计划数据
  loadPlanData()
}

async function syncRemoteRecords() {
  const recordsRes = await request({ url: '/api/checkin/records?page=1&pageSize=100', method: 'GET' })
  if (recordsRes?.data?.code === 0) {
    const records = recordsRes.data.data.list || []
    savePunchRecords(records)
  }
}

function loadPlanData() {
  planGoals.value = getPlanGoals()
  planProgress.value = calculateProgress()
}

function loadLocalFallback() {
  const records = uni.getStorageSync('punch_records') || []
  const todayKey = new Date().toISOString().slice(0, 10)
  const found = records.find(r => r.date === todayKey)
  if (found) {
    todayChecked.value = true
    todayCheckTime.value = found.time
  }
}

function gotoPlan() {
  uni.navigateTo({ url: '/pages/plan/plan' })
}

function openPunchPopup() {
  if (todayChecked.value) return
  showPunchPopup.value = true
}

function closePunchPopup() {
  showPunchPopup.value = false
}

async function submitPunch() {
  const content = punchContent.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入学习心得', icon: 'none' })
    return
  }
  
  try {
    const res = await request({ url: '/api/checkin', method: 'POST', data: { content } })
    if (res?.data?.code === 0) {
      todayChecked.value = true
      todayCheckTime.value = res.data.data.time
      upsertPunchRecord(res.data.data)
      
      // 刷新统计和学习计划
      await initData()
      loadPlanData()
      
      closePunchPopup()
      
      // 检查目标达成情况
      checkGoalAchievement()
      
      // 跳转到成功页
      uni.navigateTo({ url: '/pages/success/success' })
    } else {
      uni.showToast({ title: res?.data?.message || '提交失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络异常', icon: 'none' })
  }
}

function checkGoalAchievement() {
  const messages = []
  
  if (planProgress.value.weekCount >= planGoals.value.weeklyGoal) {
    messages.push('本周目标已完成！')
  }
  if (planProgress.value.monthCount >= planGoals.value.monthlyGoal) {
    messages.push('本月目标已完成！')
  }
  if (planProgress.value.streakDays >= planGoals.value.streakGoal) {
    messages.push('连续打卡目标已达成！')
  }
  
  if (messages.length > 0) {
    setTimeout(() => {
      uni.showToast({
        title: '🎉 ' + messages[0],
        icon: 'none',
        duration: 2000
      })
    }, 600)
  }
}

onMounted(() => {
  initData()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #faf9f6; // 宣纸白
  padding: 30rpx;
}

.quote-card {
  background: linear-gradient(135deg, #c41e3a, #a01830);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(196, 30, 58, 0.2);
  position: relative;
  overflow: hidden;

  &::after {
    content: '★';
    position: absolute;
    right: -20rpx;
    bottom: -20rpx;
    font-size: 200rpx;
    color: rgba(255, 255, 255, 0.05);
  }
}

.quote-text {
  font-size: 36rpx;
  color: #fff;
  font-weight: 500;
  line-height: 1.6;
  display: block;
  margin-bottom: 20rpx;
  font-family: "Noto Serif SC", serif;
}

.quote-author {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
  display: block;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 0 10rpx;
}

.header-date {
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-right: 16rpx;
}

.header-week {
  font-size: 28rpx;
  color: #666;
}

.tag {
  background: rgba(196, 30, 58, 0.1);
  color: #c41e3a;
  padding: 4rpx 20rpx;
  border-radius: 40rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.main-card {
  background: #fff;
  border-radius: 30rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);
  border: 1rpx solid #eee;
  margin-bottom: 40rpx;
}

.status-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  transition: all 0.3s;
  border: 8rpx solid #fff;
  box-shadow: 0 0 0 4rpx #f5f5f5;

  &.active {
    background: #c41e3a;
    box-shadow: 0 0 0 4rpx rgba(196, 30, 58, 0.2);
    .status-icon { color: #fff; }
  }
}

.status-icon {
  font-size: 60rpx;
  color: #999;
  font-weight: bold;
}

.status-title {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 10rpx;
}

.status-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.btn-punch {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background: #c41e3a;
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 10rpx 20rpx rgba(196, 30, 58, 0.2);

  &.disabled {
    background: #e0e0e0;
    color: #999;
    box-shadow: none;
  }
}

.stats-grid {
  display: flex;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  border: 1rpx solid #eee;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #c41e3a;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 学习计划卡片样式 */
.plan-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-top: 20rpx;
  border: 1rpx solid #eee;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  }
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.plan-title-row {
  display: flex;
  align-items: center;
}

.plan-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.plan-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.plan-arrow {
  font-size: 40rpx;
  color: #c41e3a;
  font-weight: 300;
}

.plan-progress-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.plan-progress-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 26rpx;
  color: #666;
}

.progress-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #c41e3a;
}

.progress-bar {
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #c41e3a, #e63946);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.popup-box {
  width: 85%;
  background: #fff;
  border-radius: 30rpx;
  padding: 40rpx;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 600;
  text-align: center;
  display: block;
  margin-bottom: 30rpx;
  color: #c41e3a;
}

.popup-input {
  width: 100%;
  height: 300rpx;
  background: #f9f9f9;
  border-radius: 20rpx;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.popup-actions {
  display: flex;
  gap: 20rpx;
}

.popup-btn {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  font-size: 30rpx;
  &.cancel { background: #f5f5f5; color: #666; }
  &.submit { background: #c41e3a; color: #fff; }
}

.footer-action {
  margin-top: 60rpx;
  text-align: center;
}

.logout-link {
  font-size: 26rpx;
  color: #999;
  text-decoration: underline;
}
</style>
