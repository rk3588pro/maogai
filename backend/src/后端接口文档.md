# 打卡小程序 — 后端接口对接文档（给前端）

本文档为前端与后端联调使用的接口规范（与仓内实现对齐），包含：接口路径、请求方式、认证、请求体字段、成功与失败响应示例、常见错误码与注意事项。

通用说明
- 数据格式：请求与响应均使用 JSON，Content-Type: application/json
- 字符编码：UTF-8
- 时区与日期：后端统一以 上海/东八区（或后端服务器本地时间）为准，日期字段使用 YYYY-MM-DD，时间使用 HH:mm:ss；同时后端在需要时会返回 createdAt（ISO 8601）。
- 认证方式：除登录/注册/忘记密码外，其他接口需在 Header 中携带 Token：

Authorization: Bearer <token>

统一响应格式
- 成功响应（HTTP 200）：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

- 失败响应：后端会返回符合以下结构，并配合合适的 HTTP 状态码（例如 400/401/403/500）：

```json
{
  "code": 非0错误码,
  "message": "错误描述",
  "data": null
}
```

常见错误码（业务含义）
- 0: 成功
- 400: 参数错误（Bad Request）
- 401: 未登录或 token 失效（Unauthorized）
- 403: 无权限（Forbidden）
- 500: 服务器错误（Server Error）

接口列表（概要）
- 认证：
  - POST /api/auth/register  注册（无需认证）
  - POST /api/auth/login     登录（无需认证）
  - POST /api/auth/logout    退出（需认证）
  - POST /api/auth/forgot-password 忘记密码（占位，可选）
- 打卡：
  - GET  /api/checkin/today    获取今日打卡状态（需认证）
  - POST /api/checkin          提交打卡（需认证）
  - GET  /api/checkin/stats    获取打卡统计（需认证）
  - GET  /api/checkin/records  获取打卡记录列表（需认证，支持分页）

详细接口说明

1) POST /api/auth/register
- 说明：新用户注册
- 认证：否
- 请求头：Content-Type: application/json
- 请求体:

```json
{ "account": "string (手机号或邮箱, <=32)", "password": "string (<=20)" }
```
- 成功响应（HTTP 200）：

```json
{ "code": 0, "message": "注册成功", "data": null }
```

- 失败示例（账号已存在，HTTP 400）：

```json
{ "code": 400, "message": "该账号已注册", "data": null }
```

注意：前端需在提交前做简单校验（长度、非空）。

2) POST /api/auth/login
- 说明：账号密码登录，返回 token 与用户信息
- 认证：否
- 请求体:

```json
{ "account": "string", "password": "string" }
```

- 成功响应（HTTP 200）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "<jwt>",
    "userId": "string",
    "account": "脱敏后的账号",
    "nickname": "用户昵称"
  }
}
```

- 失败示例（账号或密码错误，HTTP 400）：

```json
{ "code": 400, "message": "账号或密码错误", "data": null }
```

前端对接要点：成功后将 token 保存在本地（例如 uni.setStorageSync('token', token)），后续请求在 Header 中带上 Authorization: Bearer <token>。

3) POST /api/auth/logout
- 说明：退出登录（演示实现为前端清除 token；若需要服务端黑名单请与后端确认）
- 认证：是（需 Authorization）
- 请求体：空
- 成功响应：

```json
{ "code": 0, "message": "success", "data": null }
```

4) POST /api/auth/forgot-password
- 说明：忘记密码占位（视需要实现发送验证码等）
- 认证：否
- 请求体：{ account: string }
- 成功响应示例：{ code:0, message: '验证码已发送', data: null }

5) GET /api/checkin/today
- 说明：获取当前用户今日是否已打卡以及时间
- 认证：是（Authorization）
- 请求参数：无
- 成功响应（已打卡）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "checked": true,
    "checkTime": "HH:mm:ss",
    "checkAt": "ISO 8601 时间"
  }
}
```

- 未打卡响应：

```json
{ "code": 0, "message": "success", "data": { "checked": false, "checkTime": null, "checkAt": null } }
```

6) POST /api/checkin
- 说明：提交今日打卡内容（一天仅允许一次）
- 认证：是
- 请求体：

```json
{ "content": "string, 1~500 字" }
```

- 成功响应（HTTP 200）：返回新建记录：

```json
{
  "code": 0,
  "message": "打卡成功",
  "data": {
    "id": "rec_...",
    "date": "YYYY-MM-DD",
    "time": "HH:mm:ss",
    "content": "...",
    "createdAt": "ISO 8601"
  }
}
```

- 失败示例（今日已打卡，HTTP 400）：

```json
{ "code": 400, "message": "今日已打卡，请勿重复提交", "data": null }
```

7) GET /api/checkin/stats
- 说明：获取连续打卡天数和当月打卡次数
- 认证：是
- 请求体/参数：无
- 成功响应示例：

```json
{ "code": 0, "message": "success", "data": { "streakDays": 7, "monthCount": 12 } }
```

说明：streakDays 表示从今天向前连续打卡的天数（含今天）。后端会以服务器日期为准计算。

8) GET /api/checkin/records
- 说明：获取打卡记录列表，按日期/时间倒序
- 认证：是
- 查询参数：page (默认1)、pageSize (默认20, 最大50)
- 成功响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      { "id": "rec_1", "date": "2025-03-15", "time": "14:30:05", "content": "...", "createdAt": "..." }
    ],
    "total": 28
  }
}
```

错误处理与前端建议
- 前端收到 HTTP 401 或 code 401 时，应清除本地 token 并跳转到登录页。
- 参数校验：前端应在调用前做基本校验（account 长度 <=32、password <=20、content 1~500）。
- 时间显示：前端展示使用 YYYY-MM-DD 与 HH:mm:ss；若后端返回 ISO 时间，前端可解析并显示 date/time 两个字段。

示例流程（简短）
1. 注册：POST /api/auth/register -> 成功
2. 登录：POST /api/auth/login -> 得到 token
3. 请求今日状态：GET /api/checkin/today (Header: Authorization: Bearer <token>)
4. 提交打卡：POST /api/checkin body: { content } (Header 带 token)

数据库 & 表结构（建议）
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(8),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

常见问题与调试建议
- 若出现时区/日期不一致，前端与后端需确认双方使用的时区（建议前端按后端提供的 date 字段显示，不自行计算“今天”）。
- 若后端返回 200 但 code 非0，表示业务级错误，前端应以 code 字段为准展示提示。

版本/维护
- 文档更新时间：2026-03-15（与当前后端实现对齐）
- 若后端改动（路径、字段名、认证策略），请及时通知前端更新此文件。
