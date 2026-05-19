<template>
  <view class="page">
    <!-- 个人信息头部 -->
    <view class="user-card">
      <view class="avatar-wrap" @click="chooseAvatar">
        <view class="avatar">
          <image v-if="userInfo.avatarUrl" class="avatar-img" :src="userInfo.avatarUrl" mode="aspectFill" />
          <text v-else class="avatar-icon">★</text>
        </view>
        <text class="avatar-edit">更换头像</text>
      </view>
      <view class="info-wrap">
        <view class="nickname-row" @click="editProfile">
          <text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
          <text class="edit-icon">✎</text>
        </view>
        <text class="signature" @click="editProfile">{{ userInfo.signature || '自强不息，厚德载物' }}</text>
      </view>
    </view>

    <!-- 学习数据简报 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{ stats.streakDays }}</text>
        <text class="stat-label">连续学思</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.totalCount }}</text>
        <text class="stat-label">累计足迹</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="chooseAvatar">
        <text class="menu-text">上传头像</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="editProfile">
        <text class="menu-text">修改个人资料</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="showVersion">
        <text class="menu-text">系统版本</text>
        <text class="version">v1.0.0 Alpha</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="action-area">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>

    <!-- 修改弹窗 -->
    <view v-if="showEditPopup" class="popup-mask" @click="closeEditPopup">
      <view class="popup-box" @click.stop>
        <text class="popup-title">编辑资料</text>
        <view class="form-item">
          <text class="label">昵称</text>
          <input class="input" v-model="tempInfo.nickname" placeholder="请输入昵称" maxlength="12" />
        </view>
        <view class="form-item">
          <text class="label">个性签名</text>
          <textarea class="textarea" v-model="tempInfo.signature" placeholder="请输入签名..." maxlength="40" />
        </view>
        <view class="popup-actions">
          <button class="popup-btn cancel" @click="closeEditPopup">取消</button>
          <button class="popup-btn submit" @click="saveProfile">保存修改</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import request from '../../api/request'

const userInfo = ref({
  nickname: '',
  signature: '',
  avatarUrl: ''
})

const stats = ref({
  streakDays: 0,
  totalCount: 0
})

const showEditPopup = ref(false)
const tempInfo = ref({ nickname: '', signature: '' })

function loadData() {
  // 从本地加载用户信息
  const saved = uni.getStorageSync('user_profile')
  if (saved) {
    userInfo.value = JSON.parse(saved)
  }
  
  // 加载统计信息 (复用之前的逻辑)
  const streak = uni.getStorageSync('punch_streak') || 0
  const records = uni.getStorageSync('punch_records') || []
  stats.value.streakDays = streak
  stats.value.totalCount = records.length
}

async function fetchRemoteStats() {
  try {
    const res = await request({ url: '/api/checkin/stats', method: 'GET' })
    if (res?.data?.code === 0) {
      stats.value.streakDays = res.data.data.streakDays || 0
      stats.value.totalCount = res.data.data.totalCount || stats.value.totalCount
    }

    const recordsRes = await request({ url: '/api/checkin/records?page=1&pageSize=1', method: 'GET' })
    if (recordsRes?.data?.code === 0) {
      stats.value.totalCount = recordsRes.data.data.total || 0
    }
  } catch (e) {}
}

function saveUserProfile(nextInfo = userInfo.value) {
  userInfo.value = { ...nextInfo }
  uni.setStorageSync('user_profile', JSON.stringify(userInfo.value))
}

function persistAvatarPath(tempPath) {
  return new Promise((resolve) => {
    // H5 下 saveFile 可能不可用，失败时直接使用临时地址；小程序下 saveFile 可提高持久性。
    if (!uni.saveFile) {
      resolve(tempPath)
      return
    }

    uni.saveFile({
      tempFilePath: tempPath,
      success: (res) => resolve(res.savedFilePath || tempPath),
      fail: () => resolve(tempPath)
    })
  })
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempPath = res.tempFilePaths && res.tempFilePaths[0]
      if (!tempPath) return

      const avatarUrl = await persistAvatarPath(tempPath)
      saveUserProfile({ ...userInfo.value, avatarUrl })
      uni.showToast({ title: '头像已更新', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '未选择图片', icon: 'none' })
    }
  })
}

function editProfile() {
  tempInfo.value = { ...userInfo.value }
  showEditPopup.value = true
}

function closeEditPopup() {
  showEditPopup.value = false
}

function saveProfile() {
  saveUserProfile({ ...userInfo.value, ...tempInfo.value })
  uni.showToast({ title: '修改成功', icon: 'success' })
  closeEditPopup()
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出当前账号吗？',
    confirmColor: '#c41e3a',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}

function showVersion() {
  uni.showModal({
    title: '学思践悟',
    content: '毛概学习助手 v1.0.0\n砥砺前行，思想永驻。',
    showCancel: false,
    confirmColor: '#c41e3a'
  })
}

onMounted(() => {
  loadData()
  fetchRemoteStats()
})

onShow(() => {
  loadData()
  fetchRemoteStats()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #faf9f6;
  padding: 40rpx 30rpx;
}

.user-card {
  background: linear-gradient(135deg, #c41e3a, #a01830);
  border-radius: 30rpx;
  padding: 60rpx 40rpx;
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(196, 30, 58, 0.2);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  margin-right: 30rpx;
  overflow: hidden;
}

.avatar-icon {
  font-size: 60rpx;
  color: #fff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-edit {
  display: block;
  margin-top: 10rpx;
  margin-right: 30rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.78);
  text-align: center;
}

.nickname-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  margin-right: 12rpx;
}

.edit-icon {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.signature {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-row {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  border: 1rpx solid #eee;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: 800;
  color: #c41e3a;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.stat-divider {
  width: 2rpx;
  height: 40rpx;
  background: #eee;
}

.menu-list {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  border: 1rpx solid #eee;
  margin-bottom: 60rpx;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child { border-bottom: none; }
  &:active { background: #f9f9f9; }
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}

.arrow, .version {
  font-size: 24rpx;
  color: #999;
}

.action-area {
  padding: 0 20rpx;
}

.logout-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: #fff;
  color: #c41e3a;
  border: 2rpx solid #c41e3a;
  border-radius: 45rpx;
  font-size: 30rpx;
  font-weight: 600;
}

/* 弹窗样式 */
.popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
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

.form-item {
  margin-bottom: 30rpx;
  
  .label {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 10rpx;
    display: block;
  }
  
  .input {
    height: 80rpx;
    background: #f9f9f9;
    padding: 0 20rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
  }
  
  .textarea {
    width: 100%;
    height: 160rpx;
    background: #f9f9f9;
    padding: 20rpx;
    box-sizing: border-box;
    border-radius: 12rpx;
    font-size: 28rpx;
  }
}

.popup-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.popup-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  
  &.cancel { background: #f5f5f5; color: #666; }
  &.submit { background: #c41e3a; color: #fff; }
}
</style>
