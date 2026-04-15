/**
 * 学习计划工具函数
 * 负责数据存储、进度计算等逻辑
 */

const STORAGE_KEY = 'learning_plan_goals'
const PUNCH_RECORDS_KEY = 'punch_records'

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
export function calculateProgress(recordsOverride) {
  try {
    const records = Array.isArray(recordsOverride)
      ? recordsOverride
      : getLocalPunchRecords()
    
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

export function getLocalPunchRecords() {
  try {
    const records = uni.getStorageSync(PUNCH_RECORDS_KEY) || []
    return normalizeRecords(records)
  } catch (e) {
    console.warn('读取本地打卡记录失败', e)
    return []
  }
}

export function savePunchRecords(records) {
  try {
    uni.setStorageSync(PUNCH_RECORDS_KEY, normalizeRecords(records))
    return true
  } catch (e) {
    console.error('保存本地打卡记录失败', e)
    return false
  }
}

export function upsertPunchRecord(record) {
  const records = getLocalPunchRecords()
  const normalized = normalizeRecord(record)
  if (!normalized || !normalized.date) return records

  const nextRecords = records.filter((item) => item.date !== normalized.date)
  nextRecords.push(normalized)
  savePunchRecords(nextRecords)
  return nextRecords
}

function normalizeRecords(records) {
  if (!Array.isArray(records)) return []
  return records
    .map(normalizeRecord)
    .filter((record) => record && record.date)
}

function normalizeRecord(record) {
  if (!record) return null
  const date = formatDateKey(record.date || record.createdAt || record.checkAt)
  if (!date) return null

  return {
    ...record,
    date,
    time: record.time || ''
  }
}

function formatDateKey(value = new Date()) {
  try {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value
    }

    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return ''
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
      const recordDate = parseDateKey(record.date)
      if (recordDate && recordDate >= monday && recordDate <= sunday) {
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
      const recordDate = parseDateKey(record.date)
      if (recordDate && recordDate.getFullYear() === year && recordDate.getMonth() === month) {
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
    const uniqueDates = [...new Set(records.map(r => formatDateKey(r.date)).filter(Boolean))]
    
    const sortedDates = uniqueDates.sort().reverse()
    if (sortedDates.length === 0) return 0
    
    const today = formatDateKey()
    let streak = 0
    let checkDate = new Date()
    
    // 如果今天没打卡，检查昨天（允许断签一天）
    if (sortedDates[0] !== today) {
      checkDate.setDate(checkDate.getDate() - 1)
      const yesterday = formatDateKey(checkDate)
      // 如果昨天也没打卡，连续天数为0
      if (sortedDates[0] !== yesterday) {
        return 0
      }
    }
    
    // 从今天（或昨天）往前推，计算连续天数
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = formatDateKey(checkDate)
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

function parseDateKey(value) {
  const key = formatDateKey(value)
  if (!key) return null

  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
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
  getLocalPunchRecords,
  savePunchRecords,
  upsertPunchRecord,
  calculateProgress,
  checkGoalCompletion
}
