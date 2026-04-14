/**
 * 学习计划工具函数
 * 负责数据存储、进度计算等逻辑
 */

const STORAGE_KEY = 'learning_plan_goals'

/**
 * 获取学习计划目标
 * @returns {Object} 目标配置 { weeklyGoal, monthlyGoal, streakGoal }
 */
export function getPlanGoals() {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (stored) {
      const goals = JSON.parse(stored)
      return {
        weeklyGoal: goals.weeklyGoal || 5,
        monthlyGoal: goals.monthlyGoal || 20,
        streakGoal: goals.streakGoal || 30
      }
    }
  } catch (e) {
    console.warn('读取学习计划失败', e)
  }
  
  // 返回默认值
  return {
    weeklyGoal: 5,
    monthlyGoal: 20,
    streakGoal: 30
  }
}

/**
 * 保存学习计划目标
 * @param {Object} goals - 目标配置
 */
export function savePlanGoals(goals) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(goals))
    return true
  } catch (e) {
    console.error('保存学习计划失败', e)
    return false
  }
}

/**
 * 计算当前进度
 * @returns {Object} { weekCount, monthCount, streakDays }
 */
export function calculateProgress() {
  try {
    const records = uni.getStorageSync('punch_records') || []
    
    // 计算本周打卡数
    const weekCount = getWeekCheckinCount(records)
    
    // 计算本月打卡数
    const monthCount = getMonthCheckinCount(records)
    
    // 计算连续打卡天数
    const streakDays = calculateStreakDays(records)
    
    return {
      weekCount,
      monthCount,
      streakDays
    }
  } catch (e) {
    console.error('计算进度失败', e)
    return {
      weekCount: 0,
      monthCount: 0,
      streakDays: 0
    }
  }
}

/**
 * 获取本周打卡天数（周一到周日）
 */
function getWeekCheckinCount(records) {
  if (!records || records.length === 0) return 0
  
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=周日, 1=周一, ..., 6=周六
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 计算距离周一的天数
  
  // 本周周一的日期
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  
  // 本周日的日期（周末）
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  // 统计本周打卡记录
  let count = 0
  records.forEach(record => {
    try {
      const recordDate = new Date(record.date)
      if (recordDate >= monday && recordDate <= sunday) {
        count++
      }
    } catch (e) {
      console.warn('日期解析失败', record)
    }
  })
  
  return count
}

/**
 * 获取本月打卡天数
 */
function getMonthCheckinCount(records) {
  if (!records || records.length === 0) return 0
  
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  let count = 0
  records.forEach(record => {
    try {
      const recordDate = new Date(record.date)
      if (recordDate.getFullYear() === year && recordDate.getMonth() === month) {
        count++
      }
    } catch (e) {
      console.warn('日期解析失败', record)
    }
  })
  
  return count
}

/**
 * 计算连续打卡天数
 */
function calculateStreakDays(records) {
  if (!records || records.length === 0) return 0
  
  try {
    // 去重并按日期排序（从新到旧）
    const uniqueDates = [...new Set(records.map(r => {
      try {
        return new Date(r.date).toISOString().slice(0, 10)
      } catch (e) {
        return null
      }
    }).filter(d => d !== null))]
    
    const sortedDates = uniqueDates.sort().reverse()
    if (sortedDates.length === 0) return 0
    
    const today = new Date().toISOString().slice(0, 10)
    let streak = 0
    let checkDate = new Date()
    
    // 如果今天没打卡，检查昨天（允许断签一天）
    if (sortedDates[0] !== today) {
      checkDate.setDate(checkDate.getDate() - 1)
      const yesterday = checkDate.toISOString().slice(0, 10)
      // 如果昨天也没打卡，连续天数为0
      if (sortedDates[0] !== yesterday) {
        return 0
      }
    }
    
    // 从今天（或昨天）往前推，计算连续天数
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = checkDate.toISOString().slice(0, 10)
      if (sortedDates[i] === expectedDate) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  } catch (e) {
    console.error('计算连续天数失败', e)
    return 0
  }
}

/**
 * 检查是否达成目标
 * @returns {Object} { weekCompleted, monthCompleted, streakCompleted }
 */
export function checkGoalCompletion() {
  const goals = getPlanGoals()
  const progress = calculateProgress()
  
  return {
    weekCompleted: progress.weekCount >= goals.weeklyGoal,
    monthCompleted: progress.monthCount >= goals.monthlyGoal,
    streakCompleted: progress.streakDays >= goals.streakGoal
  }
}

export default {
  getPlanGoals,
  savePlanGoals,
  calculateProgress,
  checkGoalCompletion
}
