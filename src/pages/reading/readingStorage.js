const READING_PROGRESS_KEY = 'reading_progress_map'

export function getReadingProgressMap() {
  try {
    const raw = uni.getStorageSync(READING_PROGRESS_KEY)
    if (!raw) return {}
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    console.error('读取阅读进度失败', e)
    return {}
  }
}

export function saveReadingProgressMap(map) {
  try {
    uni.setStorageSync(READING_PROGRESS_KEY, JSON.stringify(map))
    return true
  } catch (e) {
    console.error('保存阅读进度失败', e)
    return false
  }
}

export function getArticleProgress(articleId) {
  const map = getReadingProgressMap()
  return map[articleId] || { progress: 0, isCompleted: false, scrollTop: 0, updatedAt: '' }
}

export function updateArticleProgress(articleId, patch) {
  const map = getReadingProgressMap()
  const prev = map[articleId] || { progress: 0, isCompleted: false, scrollTop: 0, updatedAt: '' }
  const next = {
    ...prev,
    ...patch,
    progress: Math.max(0, Math.min(100, Number(patch.progress ?? prev.progress ?? 0))),
    updatedAt: new Date().toISOString(),
  }
  next.isCompleted = !!(patch.isCompleted ?? next.progress >= 100)
  map[articleId] = next
  saveReadingProgressMap(map)
  return next
}

export function markArticleCompleted(articleId) {
  return updateArticleProgress(articleId, { progress: 100, isCompleted: true })
}

export function getReadingStats(totalCount = 0) {
  const map = getReadingProgressMap()
  const ids = Object.keys(map)
  const completedCount = ids.filter((id) => map[id]?.isCompleted).length
  const avgProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  return { completedCount, totalCount, avgProgress }
}
