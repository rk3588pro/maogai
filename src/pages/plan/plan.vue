<template>
  <view class="page">
    <!-- 顶部总览卡片 -->
    <view class="overview-card">
      <view class="overview-header">
        <text class="overview-icon">🎯</text>
        <text class="overview-title">我的学习计划</text>
      </view>
      <text class="overview-subtitle">坚持每日习读，养成学习习惯</text>
    </view>

    <!-- 目标卡片列表 -->
    <view class="goals-section">
      <!-- 每周目标 -->
      <view class="goal-card">
        <view class="goal-header">
          <view class="goal-title-row">
            <text class="goal-icon">📅</text>
            <text class="goal-title">本周目标</text>
          </view>
          <text class="goal-edit" @click="editGoal('weekly')">修改</text>
        </view>
        
        <view class="progress-section">
          <view class="progress-ring-container">
            <view class="progress-ring">
              <view class="progress-value-wrapper">
                <text class="progress-value">{{ weekProgress }}</text>
                <text class="progress-unit">%</text>
              </view>
            </view>
            <view class="progress-circle" :style="{ background: getCircleStyle(weekProgress) }"></view>
          </view>
          
          <view class="progress-detail">
            <text class="progress-text">已完成 {{ currentWeekCount }}/{{ goals.weeklyGoal }} 天</text>
            <text class="progress-status" :class="{ completed: weekCompleted }">
              {{ weekCompleted ? '✓ 本周目标已达成！' : `还需 ${goals.weeklyGoal - currentWeekCount} 天` }}
            </text>
          </view>
        </view>
      </view>

      <!-- 每月目标 -->
      <view class="goal-card">
        <view class="goal-header">
          <view class="goal-title-row">
            <text class="goal-icon">📆</text>
            <text class="goal-title">本月目标</text>
          </view>
          <text class="goal-edit" @click="editGoal('monthly')">修改</text>
        </view>
        
        <view class="progress-section">
          <view class="progress-ring-container">
            <view class="progress-ring">
              <view class="progress-value-wrapper">
                <text class="progress-value">{{ monthProgress }}</text>
                <text class="progress-unit">%</text>
              </view>
            </view>
            <view class="progress-circle" :style="{ background: getCircleStyle(monthProgress) }"></view>
          </view>
          
          <view class="progress-detail">
            <text class="progress-text">已完成 {{ currentMonthCount }}/{{ goals.monthlyGoal }} 天</text>
            <text class="progress-status" :class="{ completed: monthCompleted }">
              {{ monthCompleted ? '✓ 本月目标已达成！' : `还需 ${goals.monthlyGoal - currentMonthCount} 天` }}
            </text>
          </view>
        </view>
      </view>

      <!-- 连续打卡挑战 -->
      <view class="goal-card">
        <view class="goal-header">
          <view class="goal-title-row">
            <text class="goal-icon">🔥</text>
            <text class="goal-title">连续打卡挑战</text>
          </view>
          <text class="goal-edit" @click="editGoal('streak')">修改</text>
        </view>
        
        <view class="progress-section">
          <view class="progress-ring-container">
            <view class="progress-ring">
              <view class="progress-value-wrapper">
                <text class="progress-value">{{ streakProgress }}</text>
                <text class="progress-unit">%</text>
              </view>
            </view>
            <view class="progress-circle" :style="{ background: getCircleStyle(streakProgress) }"></view>
          </view>
          
          <view class="progress-detail">
            <text class="progress-text">已连续 {{ currentStreak }}/{{ goals.streakGoal }} 天</text>
            <text class="progress-status" :class="{ completed: streakCompleted }">
              {{ streakCompleted ? '✓ 挑战目标已达成！' : `还需 ${goals.streakGoal - currentStreak} 天` }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 修改目标弹窗 -->
    <view v-if="showEditPopup" class="popup-mask" @click="closeEditPopup">
      <view class="popup-box" @click.stop>
        <text class="popup-title">{{ editPopupTitle }}</text>
        <view class="input-group">
          <text class="input-label">目标天数</text>
          <input
            class="input-field"
            type="number"
            v-model.number="editValue"
            :placeholder="editPlaceholder"
          />
        </view>
        <view class="popup-actions">
          <button class="popup-btn cancel" @click="closeEditPopup">取消</button>
          <button class="popup-btn submit" @click="saveGoal">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import request from '../../api/request'
import { getPlanGoals, savePlanGoals, calculateProgress, savePunchRecords } from './planUtils'

const goals = ref({
  weeklyGoal: 5,
  monthlyGoal: 20,
  streakGoal: 30
})

const currentWeekCount = ref(0)
const currentMonthCount = ref(0)
const currentStreak = ref(0)

const showEditPopup = ref(false)
const editType = ref('')
const editValue = ref(0)

const editPopupTitle = computed(() => {
  const titles = {
    weekly: '修改每周目标',
    monthly: '修改每月目标',
    streak: '修改连续打卡目标'
  }
  return titles[editType.value] || '修改目标'
})

const editPlaceholder = computed(() => {
  const placeholders = {
    weekly: '如：5',
    monthly: '如：20',
    streak: '如：30'
  }
  return placeholders[editType.value] || '请输入天数'
})

// 进度计算
const weekProgress = computed(() => {
  if (goals.value.weeklyGoal === 0) return 0
  return Math.min(Math.round((currentWeekCount.value / goals.value.weeklyGoal) * 100), 100)
})

const monthProgress = computed(() => {
  if (goals.value.monthlyGoal === 0) return 0
  return Math.min(Math.round((currentMonthCount.value / goals.value.monthlyGoal) * 100), 100)
})

const streakProgress = computed(() => {
  if (goals.value.streakGoal === 0) return 0
  return Math.min(Math.round((currentStreak.value / goals.value.streakGoal) * 100), 100)
})

const weekCompleted = computed(() => currentWeekCount.value >= goals.value.weeklyGoal)
const monthCompleted = computed(() => currentMonthCount.value >= goals.value.monthlyGoal)
const streakCompleted = computed(() => currentStreak.value >= goals.value.streakGoal)

function getCircleStyle(progress) {
  const deg = (progress / 100) * 360
  if (progress <= 50) {
    return `conic-gradient(#c41e3a ${deg}deg, #f0f0f0 ${deg}deg)`
  } else {
    return `conic-gradient(#c41e3a ${deg}deg, #f0f0f0 ${deg}deg)`
  }
}

function editGoal(type) {
  editType.value = type
  const goalMap = {
    weekly: goals.value.weeklyGoal,
    monthly: goals.value.monthlyGoal,
    streak: goals.value.streakGoal
  }
  editValue.value = goalMap[type]
  showEditPopup.value = true
}

function closeEditPopup() {
  showEditPopup.value = false
}

function saveGoal() {
  if (!editValue.value || editValue.value <= 0) {
    uni.showToast({ title: '请输入有效的天数', icon: 'none' })
    return
  }

  const goalMap = {
    weekly: 'weeklyGoal',
    monthly: 'monthlyGoal',
    streak: 'streakGoal'
  }
  
  goals.value[goalMap[editType.value]] = editValue.value
  savePlanGoals(goals.value)
  
  uni.showToast({ title: '目标已更新', icon: 'success' })
  closeEditPopup()
}

async function syncRemoteRecords() {
  try {
    const res = await request({ url: '/api/checkin/records?page=1&pageSize=100', method: 'GET' })
    if (res?.data?.code === 0) {
      savePunchRecords(res.data.data.list || [])
    }
  } catch (e) {
    console.warn('同步打卡记录失败，使用本地缓存计算计划进度')
  }
}

async function loadData() {
  // 加载目标设置
  goals.value = getPlanGoals()

  // 优先同步后端打卡记录，失败时自动使用本地缓存
  await syncRemoteRecords()
  
  // 计算当前进度
  const progress = calculateProgress()
  currentWeekCount.value = progress.weekCount
  currentMonthCount.value = progress.monthCount
  currentStreak.value = progress.streakDays
}

onMounted(() => {
  loadData()
})

onShow(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #faf9f6;
  padding: 30rpx;
}

.overview-card {
  background: linear-gradient(135deg, #c41e3a, #a01830);
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(196, 30, 58, 0.2);
  animation: fadeInDown 0.5s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.overview-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.overview-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.overview-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.overview-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  padding-left: 64rpx;
}

.goals-section {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.goal-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid #eee;
  animation: fadeInUp 0.6s ease backwards;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.goal-title-row {
  display: flex;
  align-items: center;
}

.goal-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.goal-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.goal-edit {
  font-size: 26rpx;
  color: #c41e3a;
  padding: 8rpx 20rpx;
  background: rgba(196, 30, 58, 0.08);
  border-radius: 20rpx;
  transition: all 0.2s;
  
  &:active {
    background: rgba(196, 30, 58, 0.15);
    transform: scale(0.95);
  }
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 40rpx;
}

.progress-ring-container {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
}

.progress-ring {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.progress-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  z-index: 1;
  transition: all 0.5s ease;
}

.progress-value-wrapper {
  display: flex;
  align-items: baseline;
  background: #fff;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
}

.progress-value {
  font-size: 44rpx;
  font-weight: 800;
  color: #c41e3a;
}

.progress-unit {
  font-size: 24rpx;
  color: #c41e3a;
  margin-left: 4rpx;
}

.progress-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.progress-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.progress-status {
  font-size: 24rpx;
  color: #999;
  
  &.completed {
    color: #52c41a;
    font-weight: 600;
  }
}

/* 弹窗样式 */
.popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.popup-box {
  width: 80%;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #c41e3a;
  text-align: center;
  display: block;
  margin-bottom: 40rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.input-label {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.input-field {
  width: 100%;
  height: 88rpx;
  background: #f9f9f9;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  box-sizing: border-box;
}

.popup-actions {
  display: flex;
  gap: 20rpx;
}

.popup-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  
  &.cancel {
    background: #f5f5f5;
    color: #666;
  }
  
  &.submit {
    background: #c41e3a;
    color: #fff;
  }
}
</style>
