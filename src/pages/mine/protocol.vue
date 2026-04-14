<template>
  <view class="page">
    <view class="content">
      <text class="title">{{ type === 'privacy' ? '隐私政策' : '用户服务协议' }}</text>
      <!-- 使用数据绑定的方式显示文本，确保 \n 被正确解析 -->
      <text class="text" space="emsp">{{ protocolContent }}</text>
    </view>
    <button class="back-btn" @click="goBack">已阅读并返回</button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const type = ref('privacy')

const privacyText = `欢迎使用【学思践悟】小程序！我们非常重视您的隐私。

1. 我们收集哪些信息：
为了提供学思打卡和历史记录功能，我们需要您提供账号（手机号/邮箱/用户名）和密码。

2. 信息用途：
所收集信息仅用于账号身份验证及学习数据统计，不会向任何第三方披露。

3. 账号安全：
请妥善保管您的账号密码。我们建议您定期修改密码。

4. 免责声明：
本应用仅作为学习辅助工具，不涉及任何非法内容。

`

const serviceText = `【用户服务协议】

一、服务内容
本小程序为您提供基于毛概学习主题的打卡记录、统计及分享服务。

二、用户义务
用户应遵守法律法规，不得利用本平台传播任何违法违规信息。

三、知识产权
本平台展示的理论内容归相关著作权人所有，平台功能设计归开发者所有。

四、协议修改
我们保留随时修改本协议的权利，修改后将即时生效。`

const protocolContent = computed(() => {
  return type.value === 'privacy' ? privacyText : serviceText
})

onLoad((options) => {
  if (options.type) type.value = options.type
})

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
  padding: 40rpx 40rpx 80rpx;
  background-color: #fff;
  min-height: 100vh;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  text-align: center;
  margin-bottom: 60rpx;
  color: #c41e3a;
}
.text {
  font-size: 28rpx;
  color: #333;
  line-height: 2;
  /* 关键属性：保留换行 */
  white-space: pre-wrap; 
  display: block;
  word-break: break-all;
}
.back-btn {
  margin-top: 80rpx;
  background: linear-gradient(135deg, #c41e3a, #a01830);
  color: #fff;
  border-radius: 45rpx;
  font-size: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(196, 30, 58, 0.2);
}
</style>
