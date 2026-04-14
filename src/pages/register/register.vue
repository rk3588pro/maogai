<template>
  <view class="page">
    <!-- 品牌区 -->
    <view class="logo-area">
      <view class="logo">
        <text class="logo-icon">◆</text>
      </view>
      <text class="app-name">注册账号</text>
    </view>

    <!-- 表单区 -->
    <view class="form">
      <view class="field">
        <text class="label">账号</text>
        <input
          class="input"
          type="text"
          v-model="account"
          placeholder="请输入手机号/邮箱"
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
          placeholder="请设置密码"
          placeholder-class="placeholder"
          maxlength="20"
        />
      </view>

      <!-- 注册按钮 -->
      <button
        class="btn-main"
        hover-class="btn-main--hover"
        hover-stay-time="100"
        @click="onRegister"
      >
        注 册
      </button>
    </view>

    <!-- 去登录 -->
    <view class="link-wrap">
      <view
        class="link-box"
        hover-class="link-box--hover"
        hover-stay-time="80"
        @click="goLogin"
      >
        <text class="link">已有账号？去登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import request from '../../api/request'

const account = ref('')
const password = ref('')

async function onRegister() {
  const acc = account.value.trim()
  const pwd = password.value
  if (!acc) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return
  }
  if (!pwd) {
    uni.showToast({ title: '请设置密码', icon: 'none' })
    return
  }

  try {
    try { console.log('[register] sending', { url: '/api/auth/register', account: acc }) } catch (e) {}
    const res = await request({ url: '/api/auth/register', method: 'POST', data: { account: acc, password: pwd } })
    if (res && res.data && res.data.code === 0) {
      uni.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => { goLogin() }, 1000)
    } else {
      const msg = res && res.data && res.data.message ? res.data.message : '注册失败'
      uni.showToast({ title: msg, icon: 'none' })
    }
  } catch (err) {
    console.error('register error', err)
    uni.showToast({ title: '网络错误，请检查服务或网络', icon: 'none' })
  }
}

function goLogin() {
  try { uni.navigateBack() } catch (e) { /* ignore */ }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fafafa;
  background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(196, 30, 58, 0.06), transparent);
  padding: 80rpx 40rpx 40rpx;
}

.logo-area {
  text-align: center;
  margin-bottom: 56rpx;
}

.logo {
  width: 112rpx;
  height: 112rpx;
  background: linear-gradient(135deg, #c41e3a 0%, #e11d48 100%);
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

.btn-main {
  width: 100%;
  height: 104rpx;
  margin-top: 24rpx;
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

.btn-main::after {
  border: none;
}

.btn-main--hover {
  transform: scale(0.98);
  opacity: 0.95;
  box-shadow: 0 4rpx 24rpx rgba(196, 30, 58, 0.3);
}

.link-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 48rpx;
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
