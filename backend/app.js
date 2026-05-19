const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // 如果项目根有 .env，会加载

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_2025'; // 生产环境请通过环境变量设置更复杂的密钥

// 创建数据库连接池 (比单次连接更高效，适合正式接口)
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'api_linxiksp_cn',
  password: process.env.DB_PASS || '4NMfwxerwTSrMRxY',
  database: process.env.DB_NAME || 'api_linxiksp_cn',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 获取本地当天日期 YYYY-MM-DD 和 时间 HH:mm:ss 的辅助函数（使用 Asia/Shanghai 时区）
const getLocalTime = () => {
  const now = new Date();
  // 使用 toLocaleString 生成上海时区时间，再转换为 Date 以获得 ISO 字符串
  const shStr = now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
  const shDate = new Date(shStr);
  const iso = shDate.toISOString();
  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 19)
  };
};

// ================== 中间件：Token 验证 ==================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ code: 401, message: "未登录或 token 失效", data: null });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.json({ code: 401, message: "未登录或 token 失效", data: null });
    req.user = user;
    next();
  });
};

// ================== 二、认证模块 ==================

// 2.2 用户注册
app.post('/api/auth/register', async (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) return res.json({ code: 400, message: "账号和密码不能为空", data: null });

  try {
    const[rows] = await pool.query('SELECT id FROM users WHERE account = ?', [account]);
    if (rows.length > 0) return res.json({ code: 400, message: "该账号已注册", data: null });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (account, password, nickname) VALUES (?, ?, ?)',[account, hashedPassword, '用户_' + account.slice(-4)]);
    res.json({ code: 0, message: "注册成功", data: null });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "服务器错误", data: null });
  }
});

// 2.1 用户登录
app.post('/api/auth/login', async (req, res) => {
  const { account, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE account = ?', [account]);
    if (rows.length === 0) return res.json({ code: 400, message: "账号或密码错误", data: null });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.json({ code: 400, message: "账号或密码错误", data: null });

    const token = jwt.sign({ id: user.id, account: user.account }, JWT_SECRET, { expiresIn: '7d' });
    
    // 脱敏账号
    const maskedAccount = account.length > 7 ? account.slice(0,3) + '****' + account.slice(-4) : account;

    res.json({
      code: 0,
      message: "success",
      data: { token, userId: String(user.id), account: maskedAccount, nickname: user.nickname }
    });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "服务器错误", data: null });
  }
});

// 2.3 退出登录 & 2.4 忘记密码 (占位)
app.post('/api/auth/logout', authenticateToken, (req, res) => res.json({ code: 0, message: "success", data: null }));
app.post('/api/auth/forgot-password', (req, res) => res.json({ code: 0, message: "验证码已发送", data: null }));

// ================== 三、打卡模块 ==================

// 3.1 获取今日打卡状态
app.get('/api/checkin/today', authenticateToken, async (req, res) => {
  const { date } = getLocalTime();
  try {
    const [rows] = await pool.query('SELECT time, created_at FROM checkins WHERE user_id = ? AND date = ?',[req.user.id, date]);
    if (rows.length > 0) {
      res.json({
        code: 0, message: "success",
        data: { checked: true, checkTime: rows[0].time, checkAt: rows[0].created_at }
      });
    } else {
      res.json({ code: 0, message: "success", data: { checked: false, checkTime: null, checkAt: null } });
    }
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "服务器错误", data: null });
  }
});

// 3.2 提交打卡
app.post('/api/checkin', authenticateToken, async (req, res) => {
  const { content } = req.body;
  const { date, time } = getLocalTime();

  try {
    // 检查今日是否已打卡
    const[exist] = await pool.query('SELECT id FROM checkins WHERE user_id = ? AND date = ?', [req.user.id, date]);
    if (exist.length > 0) return res.json({ code: 400, message: "今日已打卡，请勿重复提交", data: null });

    const [result] = await pool.query('INSERT INTO checkins (user_id, date, time, content) VALUES (?, ?, ?, ?)', [req.user.id, date, time, content]);
    
    res.json({
      code: 0, message: "打卡成功",
      data: { id: "rec_" + result.insertId, date, time, content, createdAt: new Date().toISOString() }
    });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "服务器错误", data: null });
  }
});

// 3.3 获取打卡统计
app.get('/api/checkin/stats', authenticateToken, async (req, res) => {
  try {
    // 计算本月打卡次数
    const currentMonth = getLocalTime().date.slice(0, 7); // YYYY-MM
    const [monthRows] = await pool.query('SELECT COUNT(*) as count FROM checkins WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?', [req.user.id, currentMonth]);
    const monthCount = monthRows[0].count;

    const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM checkins WHERE user_id = ?', [req.user.id]);
    const totalCount = totalRows[0].count;

    // 计算连续打卡天数 (简单逻辑：查询该用户所有打卡日期，按日期倒序排)
    const [dates] = await pool.query('SELECT date FROM checkins WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    let streakDays = 0;
    const { date: todayStr } = getLocalTime();
    let currentDate = new Date(todayStr);

    for (let i = 0; i < dates.length; i++) {
      const recordDateStr = new Date(dates[i].date).toISOString().split('T')[0];
      const checkDate = new Date(recordDateStr);
      
      const diffTime = Math.abs(currentDate - checkDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0 && streakDays === 0) {
        streakDays = 1; // 今天打卡了
      } else if (diffDays === 1) {
        streakDays++;
        currentDate = checkDate; // 向前推一天
      } else if (diffDays === 0 && streakDays > 0) {
        continue; // 同一天多次记录（如果有）跳过
      } else {
        break; // 断签了
      }
    }

    res.json({ code: 0, message: "success", data: { streakDays, monthCount, totalCount } });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "服务器错误", data: null });
  }
});

// 3.4 获取打卡记录列表 (分页)
app.get('/api/checkin/records', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  try {
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM checkins WHERE user_id = ?', [req.user.id]);
    const total = totalRows[0].total;

    const [rows] = await pool.query('SELECT * FROM checkins WHERE user_id = ? ORDER BY date DESC, time DESC LIMIT ? OFFSET ?', [req.user.id, pageSize, offset]);
    
    const list = rows.map(row => ({
      id: "rec_" + row.id,
      date: new Date(row.date).toISOString().split('T')[0],
      time: row.time,
      content: row.content || "",
      createdAt: row.created_at
    }));

    res.json({ code: 0, message: "success", data: { list, total } });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "服务器错误", data: null });
  }
});

// 让后端程序监听 3000 端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`正式 API 服务已启动，正在监听 ${PORT} 端口...`);
});
