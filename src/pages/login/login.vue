<template>
  <view class="page">
    <!-- 品牌区 -->
    <view class="logo-area">
      <view class="logo">
        <text class="logo-icon">★</text>
      </view>
      <text class="app-name">学思践悟</text>
    </view>

    <!-- 表单区 -->
    <view class="form">
      <view class="field">
        <text class="label">账号</text>
        <input
          class="input"
          type="text"
          v-model="account"
          placeholder="请输入手机号/邮箱/用户名"
          placeholder-class="placeholder"
          maxlength="32"
        />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input
          class="input"
          type="password"
          v-model="password"
          placeholder="请输入密码"
          placeholder-class="placeholder"
          maxlength="20"
        />
      </view>

      <!-- 协议勾选 -->
      <view class="protocol-row" @click="isAgreed = !isAgreed">
        <view class="protocol-check" :class="{ checked: isAgreed }">
          <text v-if="isAgreed" class="check-icon">✓</text>
        </view>
        <view class="protocol-text">
          我已阅读并同意
          <text class="link" @click.stop="openProtocol('service')">《用户服务协议》</text>
          和
          <text class="link" @click.stop="openProtocol('privacy')">《隐私政策》</text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button
        class="btn-login"
        hover-class="btn-login--hover"
        hover-stay-time="100"
        @click="onLogin"
      >
        登 录
      </button>
    </view>

    <!-- 辅助链接 -->
    <view class="link-wrap">
      <view
        class="link-box"
        hover-class="link-box--hover"
        hover-stay-time="80"
        @click="onForgotPassword"
      >
        <text class="link">忘记密码</text>
      </view>
      <view
        class="link-box"
        hover-class="link-box--hover"
        hover-stay-time="80"
        @click="onRegister"
      >
        <text class="link">注册账号</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const account = ref('')
const password = ref('')
const isAgreed = ref(false)

import request from '../../api/request'

async function onLogin() {
  const acc = account.value.trim()
  const pwd = password.value
  
  if (!isAgreed.value) {
    uni.showToast({ title: '请先勾选同意协议', icon: 'none' })
    return
  }
  
  if (!acc) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return
  }
  if (!pwd) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  try {
    const res = await request({ url: '/api/auth/login', method: 'POST', data: { account: acc, password: pwd } })
    if (res && res.data && res.data.code === 0) {
      const token = res.data.data && res.data.data.token
      if (token) {
        try { uni.setStorageSync('token', token) } catch (e) {}
      }
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 600)
    } else {
      const msg = res && res.data && res.data.message ? res.data.message : '登录失败'
      uni.showToast({ title: msg, icon: 'none' })
    }
  } catch (err) {
    console.error('login error', err)
    uni.showToast({ title: '网络错误，请检查网络或尚未启动服务', icon: 'none', duration: 3000 })
  }
}

function onForgotPassword() {
  uni.showToast({ title: '你忘记密码我也没有办法喵╮(╯▽╰)╭', icon: 'none' })
}

function onRegister() {
  try {
    uni.navigateTo({ url: '/pages/register/register' })
  } catch (e) {
    uni.showToast({
      title: '页面跳转失败',
      icon: 'none'
    })
  }
}

function openProtocol(type) {
  uni.navigateTo({ url: `/pages/mine/protocol?type=${type}` })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #faf9f6;
  padding: 80rpx 40rpx 40rpx;
}

.logo-area {
  text-align: center;
  margin-bottom: 56rpx;
}

.logo {
  width: 112rpx;
  height: 112rpx;
  background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
  border-radius: 32rpx;
  margin: 0 auto 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(196, 30, 58, 0.35);
}

.logo-icon {
  font-size: 52rpx;
  color: #fff;
}

.app-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.field {
  .label {
    display: block;
    font-size: 26rpx;
    font-weight: 500;
    color: #737373;
    margin-bottom: 16rpx;
  }

  .input {
    width: 100%;
    height: 100rpx;
    padding: 0 32rpx;
    background: #fff;
    border: 4rpx solid #e5e5e5;
    border-radius: 20rpx;
    font-size: 32rpx;
    color: #1a1a1a;
    box-sizing: border-box;
  }

  .input:focus {
    border-color: #c41e3a;
  }

  .placeholder {
    color: #737373;
    opacity: 0.7;
  }
}

.protocol-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-top: 10rpx;
  padding: 10rpx 0;
}

.protocol-check {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4rpx;
  flex-shrink: 0;
  
  &.checked {
    background: #c41e3a;
    border-color: #c41e3a;
  }
}

.check-icon {
  color: #fff;
  font-size: 20rpx;
  font-weight: bold;
}

.protocol-text {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
  
  .link {
    color: #c41e3a;
    font-weight: 500;
  }
}

.btn-login {
  width: 100%;
  height: 104rpx;
  margin-top: 16rpx;
  background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
  border: none;
  border-radius: 20rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba(196, 30, 58, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-login::after {
  border: none;
}

.btn-login--hover {
  transform: scale(0.98);
  opacity: 0.95;
  box-shadow: 0 4rpx 24rpx rgba(196, 30, 58, 0.3);
}

.link-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  margin-top: 40rpx;
  flex-wrap: wrap;
}

.link-box {
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  background: transparent;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.link-box--hover {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(196, 30, 58, 0.15);
  box-shadow: 0 8rpx 32rpx rgba(196, 30, 58, 0.08);
}

.link {
  font-size: 28rpx;
  color: #c41e3a;
  font-weight: 500;
}
</style>
