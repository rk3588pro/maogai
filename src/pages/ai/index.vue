<template>
  <view class="page">
    <view class="hero-card">
      <text class="hero-kicker">AI Study Copilot</text>
      <text class="hero-title">毛概学习助手</text>
      <text class="hero-subtitle">围绕课程知识、理论理解和学习表达进行问答，不代写违规内容。</text>
    </view>

    <view class="tips-card">
      <text class="tips-title">可以这样问</text>
      <view class="prompt-list">
        <view
          v-for="item in quickPrompts"
          :key="item"
          class="prompt-chip"
          @click="usePrompt(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <scroll-view class="chat-panel" scroll-y :scroll-into-view="scrollIntoView">
      <view class="chat-list">
        <view
          v-for="(item, index) in messages"
          :key="item.id"
          :id="`msg-${index}`"
          class="message-row"
          :class="item.role"
        >
          <view class="avatar">{{ item.role === 'assistant' ? 'AI' : '我' }}</view>
          <view class="bubble">
            <text class="bubble-text">{{ item.content }}</text>
          </view>
        </view>

        <view v-if="loading" id="msg-loading" class="message-row assistant">
          <view class="avatar">AI</view>
          <view class="bubble loading-bubble">
            <text class="bubble-text">正在思考中...</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="toolbar">
      <button class="ghost-btn" @click="resetConversation">清空对话</button>
      <text class="toolbar-hint">预设提示词已内置在后端接口中</text>
    </view>

    <view class="composer">
      <textarea
        v-model="inputText"
        class="composer-input"
        maxlength="1000"
        auto-height
        placeholder="输入你的问题，例如：如何理解实事求是的思想路线？"
        placeholder-class="composer-placeholder"
      />
      <button class="send-btn" :disabled="loading" @click="sendMessage">
        {{ loading ? '发送中' : '发送' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import request from '../../api/request'

const STORAGE_KEY = 'ai_chat_messages'
const quickPrompts = [
  '帮我用通俗的话解释“实事求是”的含义',
  '从毛概考试角度概括新民主主义革命理论',
  '根据群众路线给我 3 个答题要点',
  '把下面这段学习感悟润色得更自然一些'
]

const defaultMessages = [
  {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '我是毛概学习助手，可以帮你梳理概念、总结要点、润色学习感悟，也会尽量用适合复习和表达的方式回答。'
  }
]

const messages = ref(loadMessages())
const inputText = ref('')
const loading = ref(false)
const scrollIntoView = ref('')

function loadMessages() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (Array.isArray(saved) && saved.length) {
      return saved
    }
  } catch (e) {}
  return [...defaultMessages]
}

function persistMessages() {
  try {
    uni.setStorageSync(STORAGE_KEY, messages.value)
  } catch (e) {}
}

function scrollToBottom(targetId) {
  nextTick(() => {
    scrollIntoView.value = ''
    nextTick(() => {
      scrollIntoView.value = targetId
    })
  })
}

function usePrompt(text) {
  inputText.value = text
}

function resetConversation() {
  messages.value = [...defaultMessages]
  persistMessages()
  uni.showToast({ title: '已清空', icon: 'success' })
  scrollToBottom('msg-0')
}

async function sendMessage() {
  const content = inputText.value.trim()
  if (!content || loading.value) {
    return
  }

  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content
  }
  messages.value = [...messages.value, userMessage]
  inputText.value = ''
  persistMessages()
  scrollToBottom(`msg-${messages.value.length - 1}`)
  loading.value = true

  try {
    const history = messages.value
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-10)
      .map(({ role, content: text }) => ({ role, content: text }))

    const res = await request({
      url: '/api/ai/chat',
      method: 'POST',
      data: {
        message: content,
        history
      }
    })

    if (res?.data?.code === 0 && res?.data?.data?.reply) {
      messages.value = [
        ...messages.value,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.data.data.reply
        }
      ]
      persistMessages()
      scrollToBottom(`msg-${messages.value.length - 1}`)
    } else {
      uni.showToast({ title: res?.data?.message || '回复失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络异常，请稍后再试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(212, 175, 55, 0.12), transparent 35%),
    linear-gradient(180deg, #f7f1e6 0%, #faf9f6 24%, #f4efe6 100%);
  padding: 24rpx;
  box-sizing: border-box;
}

.hero-card {
  background: linear-gradient(135deg, #7b0f1a 0%, #c41e3a 58%, #d4af37 140%);
  border-radius: 28rpx;
  padding: 34rpx 30rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(123, 15, 26, 0.18);
}

.hero-kicker {
  display: block;
  font-size: 22rpx;
  letter-spacing: 3rpx;
  text-transform: uppercase;
  opacity: 0.8;
}

.hero-title {
  display: block;
  margin-top: 12rpx;
  font-size: 42rpx;
  font-weight: 700;
}

.hero-subtitle {
  display: block;
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.7;
  opacity: 0.92;
}

.tips-card {
  margin-top: 20rpx;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12rpx);
  border: 1rpx solid rgba(196, 30, 58, 0.08);
  border-radius: 24rpx;
  padding: 24rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #7b0f1a;
}

.prompt-list {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.prompt-chip {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: #fff4f1;
  border: 1rpx solid rgba(196, 30, 58, 0.1);
  color: #9a2334;
  font-size: 24rpx;
  line-height: 1.4;
}

.chat-panel {
  height: 760rpx;
  margin-top: 20rpx;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 26rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.04);
}

.chat-list {
  padding: 28rpx 22rpx 36rpx;
}

.message-row {
  display: flex;
  margin-bottom: 22rpx;
  align-items: flex-start;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  background: #c41e3a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.message-row.user .avatar {
  background: #7b0f1a;
}

.bubble {
  max-width: 76%;
  margin: 0 16rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
}

.message-row.user .bubble {
  background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
}

.bubble-text {
  font-size: 28rpx;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
}

.message-row.user .bubble-text {
  color: #fff;
}

.loading-bubble {
  background: #f8f1e8;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 18rpx;
  padding: 0 6rpx;
}

.ghost-btn {
  margin: 0;
  height: 68rpx;
  line-height: 68rpx;
  padding: 0 24rpx;
  background: transparent;
  border: 2rpx solid rgba(196, 30, 58, 0.22);
  color: #a01830;
  border-radius: 999rpx;
  font-size: 24rpx;
}

.ghost-btn::after {
  border: none;
}

.toolbar-hint {
  flex: 1;
  text-align: right;
  font-size: 22rpx;
  color: #8a8175;
}

.composer {
  margin-top: 18rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24rpx;
  padding: 18rpx;
  display: flex;
  gap: 18rpx;
  align-items: flex-end;
  box-shadow: 0 10rpx 26rpx rgba(0, 0, 0, 0.04);
}

.composer-input {
  flex: 1;
  min-height: 96rpx;
  max-height: 220rpx;
  background: #f8f5ef;
  border-radius: 18rpx;
  padding: 18rpx 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  line-height: 1.6;
}

.composer-placeholder {
  color: #a69f93;
}

.send-btn {
  width: 154rpx;
  height: 96rpx;
  line-height: 96rpx;
  margin: 0;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #c41e3a 0%, #7b0f1a 100%);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 20rpx rgba(160, 24, 48, 0.2);
}

.send-btn::after {
  border: none;
}

.send-btn[disabled] {
  background: #d5c8c1;
  color: #fff;
  box-shadow: none;
}
</style>
