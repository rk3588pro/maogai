<template>
  <view class="page">
    <view class="content-box">
      <!-- 顶部装饰 -->
      <view class="success-icon-wrap">
        <text class="success-icon">★</text>
      </view>
      <text class="success-title">习读完成</text>
      
      <!-- 金句区域 -->
      <view class="quote-container">
        <view class="quote-card">
          <text class="quote-symbol-open">“</text>
          <text class="quote-text">{{ currentQuote.text }}</text>
          <text class="quote-symbol-close">”</text>
          <text class="quote-author">—— {{ currentQuote.source }}</text>
        </view>
      </view>
      
      <text class="hint-text">感悟思想伟力，指导实践调研</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer-actions">
      <!-- #ifdef MP-WEIXIN -->
      <button class="btn btn-share" open-type="share">
        <text class="btn-icon">➦</text> 分享感悟
      </button>
      <!-- #endif -->
      
      <!-- #ifndef MP-WEIXIN -->
      <button class="btn btn-share" @click="handleShare">
        <text class="btn-icon">➦</text> 分享感悟
      </button>
      <!-- #endif -->
      
      <button class="btn btn-back" @click="handleBack">
        返回首页
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

const quotes = [
  { text: '没有调查，没有发言权。', source: '《反对本本主义》' },
  { text: '“实事”就是客观存在着的一切事物，“求”就是我们去研究， “是”就是客观事物的内部联系，即规律性。', source: '《改造我们的学习》' },
  { text: '调查就象“十月怀胎”，解决问题就象“一朝分娩”。调查就是解决问题。', source: '《反对本本主义》' },
  { text: '必须明白：群众是真正的英雄，而我们自己则往往是幼稚可笑的，不了解这一点，就不能得到起码的知识。', source: '《〈农村调查〉的序言和跋》' },
  { text: '要了解情况，唯一的方法是向社会作调查，向人们公认的贤达作调查。', source: '《〈农村调查〉的序言和跋》' },
  { text: '离开实际调查就要产生唯心的阶级估量和唯心的工作指导，那末，它的结果，不是机会主义，便是盲动主义。', source: '《反对本本主义》' },
  { text: '共产党的正确策略制定，决不是少数人坐在房子里能够产生的，它是要在群众的斗争过程中才能产生的。', source: '《反对本本主义》' }
]

const currentQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])

// 微信小程序分享给好友
onShareAppMessage(() => {
  return {
    title: `【习读感悟】“${currentQuote.value.text}”`,
    path: '/pages/index/index',
    imageUrl: '/static/logo.png'
  }
})

// 微信小程序分享到朋友圈
onShareTimeline(() => {
  return {
    title: `习读感悟：${currentQuote.value.text}`,
    query: 'from=timeline'
  }
})

function handleBack() {
  uni.switchTab({ url: '/pages/index/index' })
}

function handleShare() {
  // #ifdef H5
  uni.showModal({
    title: '分享提示',
    content: '请点击右上角“···”分享给好友或朋友圈',
    showCancel: false,
    confirmColor: '#c41e3a'
  })
  // #endif
  
  // #ifndef H5 || MP-WEIXIN
  uni.showToast({ title: '当前环境不支持直接分享', icon: 'none' })
  // #endif
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #faf9f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

.content-box {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 100rpx;
}

.success-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  background: #c41e3a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 20rpx rgba(196, 30, 58, 0.2);
  margin-bottom: 20rpx;
}

.success-icon {
  font-size: 60rpx;
  color: #fff;
}

.success-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #c41e3a;
  letter-spacing: 4rpx;
  margin-bottom: 60rpx;
}

.quote-container {
  width: 100%;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.quote-card {
  background: #fff;
  border-radius: 30rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 4rpx 30rpx rgba(0,0,0,0.05);
  border: 1rpx solid #eee;
  position: relative;
  text-align: center;
}

.quote-symbol-open {
  position: absolute;
  top: 20rpx;
  left: 30rpx;
  font-size: 80rpx;
  color: rgba(196, 30, 58, 0.1);
  font-family: serif;
}

.quote-symbol-close {
  position: absolute;
  bottom: 0rpx;
  right: 30rpx;
  font-size: 80rpx;
  color: rgba(196, 30, 58, 0.1);
  font-family: serif;
}

.quote-text {
  font-size: 34rpx;
  color: #333;
  line-height: 1.8;
  font-weight: 500;
  display: block;
  margin-bottom: 30rpx;
  font-family: "Noto Serif SC", serif;
}

.quote-author {
  font-size: 26rpx;
  color: #c41e3a;
  display: block;
  font-weight: 600;
}

.hint-text {
  margin-top: 40rpx;
  font-size: 24rpx;
  color: #999;
  letter-spacing: 2rpx;
}

.footer-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.btn:active {
  opacity: 0.8;
}

.btn-share {
  background-color: #c41e3a;
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(196, 30, 58, 0.2);
}

.btn-back {
  background-color: transparent;
  color: #666;
  border: 2rpx solid #ddd;
}

.btn-icon {
  margin-right: 10rpx;
  font-size: 32rpx;
}
</style>
