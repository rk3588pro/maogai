// 简单的请求封装，统一使用 BASE_URL，并自动注入 token 到 Authorization
import { BASE_URL } from '../main'

const _BASE = typeof BASE_URL === 'string' ? BASE_URL.replace(/\/+$/, '') : BASE_URL

/**
 * options: { url, method = 'GET', data, header }
 * 返回 Promise，resolve 为 uni.request 的 res
 */
export function request(options) {
  const { url, method = 'GET', data = {}, header = {} } = options
  const fullUrl = url && url.startsWith && url.startsWith('http')
    ? url
    : `${_BASE}${url.startsWith('/') ? url : '/' + url}`

  let token = null
  try {
    token = uni.getStorageSync('token')
  } catch (e) {}

  const finalHeader = Object.assign(
    { 'Content-Type': 'application/json' },
    header,
    token ? { Authorization: `Bearer ${token}` } : {}
  )

  try {
    console.log('[request] ->', method, fullUrl, JSON.stringify(data), finalHeader)
  } catch (e) {}

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header: finalHeader,
      success: (res) => {
        try {
          console.log('[request] res ->', res && res.statusCode, res && res.data)
        } catch (e) {}

        if (res && res.data && res.data.code === 401) {
          try {
            uni.removeStorageSync('token')
          } catch (e) {}
          try {
            uni.reLaunch({ url: '/pages/login/login' })
          } catch (e) {}
          return reject(res)
        }

        resolve(res)
      },
      fail: (err) => {
        try {
          console.error('[request] fail ->', err)
        } catch (e) {}
        reject(err)
      }
    })
  })
}

export default request
