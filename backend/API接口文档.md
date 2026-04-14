# 打卡小程序 - 后端接口文档

本文档描述当前前端所需的后端接口，供后端开发对接使用。前端为 uniapp + Vue3，支持 H5 与微信小程序。

---

## 一、通用说明

### 1.1 基础信息

| 项目     | 说明 |
|----------|------|
| 数据格式 | 请求与响应均使用 **JSON**，`Content-Type: application/json` |
| 字符编码 | UTF-8 |
| 认证方式 | 除登录、注册、忘记密码外，其余接口均在请求头携带 Token |

### 1.2 请求头（需登录的接口）

```
Authorization: Bearer <token>
```

登录/注册成功后，前端会将服务端返回的 `token` 存入本地（如 `uni.setStorageSync('token', token)`），后续请求在 Header 中附带该 token。

### 1.3 统一响应结构

**成功时：**

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**失败时：**

```json
{
  "code": 非0错误码,
  "message": "错误描述",
  "data": null
}
```

- `code`: 0 表示成功，非 0 表示业务或系统错误。
- `message`: 给前端展示的提示文案。
- `data`: 业务数据，失败时可为 `null`。

### 1.4 常见错误码建议

| code | 说明       |
|------|------------|
| 0    | 成功       |
| 401  | 未登录或 token 失效 |
| 400  | 参数错误   |
| 403  | 无权限     |
| 500  | 服务器错误 |

---

## 二、认证模块

### 2.1 用户登录

**接口说明**：账号密码登录，返回 token 与用户信息，供前端保存并用于后续请求认证。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/auth/login` 或 `/api/user/login` |
| 方法 | `POST` |
| 认证 | 否 |

**请求体：**

| 字段     | 类型    | 必填 | 说明 |
|----------|---------|------|------|
| account  | string  | 是  | 账号（手机号或邮箱），前端限制 32 字符内 |
| password | string  | 是  | 密码，前端限制 20 字符内 |
| remember | boolean | 否  | 是否记住登录状态，前端“记住我”勾选时传 true |

**请求示例：**

```json
{
  "account": "13800138000",
  "password": "xxxxxx",
  "remember": true
}
```

**响应 data 建议结构：**

| 字段    | 类型   | 说明 |
|---------|--------|------|
| token   | string | 访问令牌，前端存本地并写入 Authorization |
| userId  | string | 用户 ID |
| account | string | 账号（脱敏可选） |
| nickname| string | 昵称（可选） |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "user_001",
    "account": "138****8000",
    "nickname": "用户昵称"
  }
}
```

---

### 2.2 用户注册

**接口说明**：新用户注册，仅需账号与密码。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/auth/register` 或 `/api/user/register` |
| 方法 | `POST` |
| 认证 | 否 |

**请求体：**

| 字段     | 类型   | 必填 | 说明 |
|----------|--------|------|------|
| account  | string | 是  | 账号（手机号/邮箱），前端限制 32 字符内 |
| password | string | 是  | 密码，前端限制 20 字符内 |

**请求示例：**

```json
{
  "account": "13800138000",
  "password": "xxxxxx"
}
```

**响应：** 无 data 或返回简单成功信息即可。

```json
{
  "code": 0,
  "message": "注册成功",
  "data": null
}
```

**失败示例（如账号已存在）：**

```json
{
  "code": 400,
  "message": "该账号已注册",
  "data": null
}
```

---

### 2.3 退出登录

**接口说明**：使当前 token 失效（如加入黑名单），前端会清除本地 token 并跳转登录页。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/auth/logout` 或 `/api/user/logout` |
| 方法 | `POST` |
| 认证 | 是（Header 带 Token） |

**请求体：** 可无 body。

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

### 2.4 忘记密码（可选）

**接口说明**：当前前端“忘记密码”仅做占位，若后续要做找回密码，可对接此接口（如发送验证码或重置链接）。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/auth/forgot-password` |
| 方法 | `POST` |
| 认证 | 否 |

**请求体：**

| 字段    | 类型   | 必填 | 说明 |
|---------|--------|------|------|
| account | string | 是  | 账号（手机号/邮箱） |

**响应：** 按实际业务返回（如“已发送验证码到手机/邮箱”）。

```json
{
  "code": 0,
  "message": "验证码已发送",
  "data": null
}
```

---

## 三、打卡模块

以下接口均需登录认证（Header: `Authorization: Bearer <token>`），且数据按当前登录用户隔离。

### 3.1 获取今日打卡状态

**接口说明**：首页进入时调用，用于展示“今日已打卡/未打卡”及打卡时间。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/checkin/today` 或 `/api/checkin/status` |
| 方法 | `GET` |
| 认证 | 是 |

**请求参数：** 无（服务端按 token 解析用户，按服务器当前日期判断“今日”）。

**响应 data 建议结构：**

| 字段       | 类型    | 说明 |
|------------|---------|------|
| checked    | boolean | 今日是否已打卡 |
| checkTime  | string  | 已打卡时的具体时间，如 "14:30:05"（未打卡可为 null） |
| checkAt    | string  | 可选，ISO 时间，如 "2025-03-15T06:30:05.000Z" |

**响应示例（已打卡）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "checked": true,
    "checkTime": "14:30:05",
    "checkAt": "2025-03-15T06:30:05.000Z"
  }
}
```

**响应示例（未打卡）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "checked": false,
    "checkTime": null,
    "checkAt": null
  }
}
```

---

### 3.2 提交打卡

**接口说明**：用户填写打卡内容后点击“提交打卡”时调用，一天仅允许成功提交一次（重复提交可由后端返回 400）。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/checkin` 或 `/api/checkin/submit` |
| 方法 | `POST` |
| 认证 | 是 |

**请求体：**

| 字段    | 类型   | 必填 | 说明 |
|---------|--------|------|------|
| content | string | 是  | 打卡内容，前端限制 1~500 字 |

**请求示例：**

```json
{
  "content": "今日完成毛概第一章复习，整理笔记约 800 字。"
}
```

**响应 data 建议结构：** 返回本次打卡记录，便于前端更新本地状态。

| 字段     | 类型   | 说明 |
|----------|--------|------|
| id       | string | 记录 ID |
| date     | string | 日期，如 "2025-03-15" |
| time     | string | 时间，如 "14:30:05" |
| content  | string | 打卡内容 |
| createdAt| string | 可选，ISO 创建时间 |

**响应示例：**

```json
{
  "code": 0,
  "message": "打卡成功",
  "data": {
    "id": "rec_001",
    "date": "2025-03-15",
    "time": "14:30:05",
    "content": "今日完成毛概第一章复习，整理笔记约 800 字。",
    "createdAt": "2025-03-15T06:30:05.000Z"
  }
}
```

**失败示例（今日已打卡）：**

```json
{
  "code": 400,
  "message": "今日已打卡，请勿重复提交",
  "data": null
}
```

---

### 3.3 获取打卡统计

**接口说明**：首页展示“连续打卡天数”和“本月打卡次数”。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/checkin/stats` |
| 方法 | `GET` |
| 认证 | 是 |

**请求参数：** 无。

**响应 data 建议结构：**

| 字段        | 类型  | 说明 |
|-------------|-------|------|
| streakDays  | number| 连续打卡天数（从今天往前连续有打卡的天数） |
| monthCount  | number| 本月打卡次数 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "streakDays": 7,
    "monthCount": 12
  }
}
```

---

### 3.4 获取打卡记录列表

**接口说明**：用于首页“最近打卡记录”和“记录”页的列表，支持分页；按日期、时间倒序。

| 项目 | 说明 |
|------|------|
| 路径 | `/api/checkin/records` 或 `/api/checkin/list` |
| 方法 | `GET` |
| 认证 | 是 |

**请求参数（Query）：**

| 参数      | 类型   | 必填 | 说明 |
|-----------|--------|------|------|
| page      | number | 否  | 页码，从 1 开始，默认 1 |
| pageSize  | number | 否  | 每页条数，默认 20，建议最大 50 |

**响应 data 建议结构：**

| 字段  | 类型  | 说明 |
|-------|-------|------|
| list  | array | 记录列表 |
| total | number| 总条数（可选，便于分页） |

**list 中单条记录：**

| 字段      | 类型   | 说明 |
|-----------|--------|------|
| id        | string | 记录 ID |
| date      | string | 日期，如 "2025-03-15" |
| time      | string | 时间，如 "14:30:05" |
| content   | string | 打卡内容，可为空字符串 |
| createdAt | string | 可选，ISO 创建时间 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "rec_001",
        "date": "2025-03-15",
        "time": "14:30:05",
        "content": "今日完成毛概第一章复习。",
        "createdAt": "2025-03-15T06:30:05.000Z"
      },
      {
        "id": "rec_002",
        "date": "2025-03-14",
        "time": "09:15:22",
        "content": "晨读 30 分钟。",
        "createdAt": "2025-03-14T01:15:22.000Z"
      }
    ],
    "total": 28
  }
}
```

---

## 四、接口汇总表

| 序号 | 模块 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|------|
| 1 | 认证 | POST | /api/auth/login | 登录 | 否 |
| 2 | 认证 | POST | /api/auth/register | 注册 | 否 |
| 3 | 认证 | POST | /api/auth/logout | 退出登录 | 是 |
| 4 | 认证 | POST | /api/auth/forgot-password | 忘记密码（可选） | 否 |
| 5 | 打卡 | GET | /api/checkin/today | 今日打卡状态 | 是 |
| 6 | 打卡 | POST | /api/checkin | 提交打卡 | 是 |
| 7 | 打卡 | GET | /api/checkin/stats | 打卡统计 | 是 |
| 8 | 打卡 | GET | /api/checkin/records | 打卡记录列表（分页） | 是 |

---

## 五、前端对接说明

- **登录/注册**：前端在调用登录/注册接口成功后，将返回的 `token` 存入本地（如 `uni.setStorageSync('token', data.token)`），并在后续请求的 Header 中统一添加 `Authorization: Bearer <token>`。
- **401 处理**：当接口返回 401 时，前端应清除本地 token 并跳转到登录页。
- **打卡**：前端会在进入首页时请求“今日状态”和“统计”，在提交打卡后请求“提交打卡”接口，并在首页和记录页请求“打卡记录列表”；记录列表建议按 `date`、`time` 倒序，与当前前端展示一致。
- **日期与时间**：前端展示使用“日期 YYYY-MM-DD”和“时间 HH:mm:ss”，后端若使用 ISO 时间，返回 `date`、`time` 两个字段即可满足前端直接展示。

如需调整路径、字段名或增加接口，可与前端对齐后更新本文档。
