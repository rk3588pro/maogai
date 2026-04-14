const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_2025';
const LLM_API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const AI_SYSTEM_PROMPT = `
你是“毛概学习助手”，服务于大学生《毛泽东思想和中国特色社会主义理论体系概论》课程学习。

你的目标：
1. 围绕毛概课程内容进行讲解、问答、概念辨析、答题思路整理和学习感悟润色。
2. 优先使用清晰、准确、适合学生复习的中文表达。
3. 回答尽量结构化，必要时用“概念-背景-要点-意义”的方式展开。
4. 遇到用户要求写完整作业、考试作弊、伪造调研或编造引用时，要拒绝并改为提供思路、提纲或学习辅导。
5. 若问题超出毛概课程范围，也可以简要回答，但应优先贴近思想政治理论学习语境。

输出风格：
- 语气自然、稳重、易懂，不要空泛套话。
- 如果用户问“怎么答题”，优先给出可直接组织成答案的分点。
- 如果用户要求润色学习心得，要保留原意，避免夸张和明显 AI 腔。
`.trim();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'api_linxiksp_cn',
  password: process.env.DB_PASS || '4NMfwxerwTSrMRxY',
  database: process.env.DB_NAME || 'api_linxiksp_cn',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const getLocalTime = () => {
  const now = new Date();
  const shStr = now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
  const shDate = new Date(shStr);
  const iso = shDate.toISOString();
  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 19)
  };
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.json({ code: 401, message: '未登录或 token 失效', data: null });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.json({ code: 401, message: '未登录或 token 失效', data: null });
    }
    req.user = user;
    next();
  });
};

const normalizeChatMessages = (history, message) => {
  const safeHistory = Array.isArray(history) ? history : [];
  const filteredHistory = safeHistory
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .slice(-10)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 4000)
    }))
    .filter((item) => item.content);

  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  return {
    trimmedMessage,
    messages: [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      ...filteredHistory,
      { role: 'user', content: trimmedMessage }
    ]
  };
};

app.post('/api/auth/register', async (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.json({ code: 400, message: '账号和密码不能为空', data: null });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE account = ?', [account]);
    if (rows.length > 0) {
      return res.json({ code: 400, message: '该账号已注册', data: null });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (account, password, nickname) VALUES (?, ?, ?)', [
      account,
      hashedPassword,
      '用户_' + account.slice(-4)
    ]);
    res.json({ code: 0, message: '注册成功', data: null });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: '服务器异常', data: null });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { account, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE account = ?', [account]);
    if (rows.length === 0) {
      return res.json({ code: 400, message: '账号或密码错误', data: null });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.json({ code: 400, message: '账号或密码错误', data: null });
    }

    const token = jwt.sign({ id: user.id, account: user.account }, JWT_SECRET, { expiresIn: '7d' });
    const maskedAccount = account.length > 7 ? account.slice(0, 3) + '****' + account.slice(-4) : account;

    res.json({
      code: 0,
      message: 'success',
      data: { token, userId: String(user.id), account: maskedAccount, nickname: user.nickname }
    });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: '服务器异常', data: null });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ code: 0, message: 'success', data: null });
});

app.post('/api/auth/forgot-password', (req, res) => {
  res.json({ code: 0, message: '验证码已发送', data: null });
});

app.get('/api/checkin/today', authenticateToken, async (req, res) => {
  const { date } = getLocalTime();
  try {
    const [rows] = await pool.query('SELECT time, created_at FROM checkins WHERE user_id = ? AND date = ?', [
      req.user.id,
      date
    ]);
    if (rows.length > 0) {
      return res.json({
        code: 0,
        message: 'success',
        data: { checked: true, checkTime: rows[0].time, checkAt: rows[0].created_at }
      });
    }

    res.json({ code: 0, message: 'success', data: { checked: false, checkTime: null, checkAt: null } });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: '服务器异常', data: null });
  }
});

app.post('/api/checkin', authenticateToken, async (req, res) => {
  const { content } = req.body;
  const { date, time } = getLocalTime();

  try {
    const [exist] = await pool.query('SELECT id FROM checkins WHERE user_id = ? AND date = ?', [req.user.id, date]);
    if (exist.length > 0) {
      return res.json({ code: 400, message: '今日已打卡，请勿重复提交', data: null });
    }

    const [result] = await pool.query('INSERT INTO checkins (user_id, date, time, content) VALUES (?, ?, ?, ?)', [
      req.user.id,
      date,
      time,
      content
    ]);

    res.json({
      code: 0,
      message: '打卡成功',
      data: { id: 'rec_' + result.insertId, date, time, content, createdAt: new Date().toISOString() }
    });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: '服务器异常', data: null });
  }
});

app.get('/api/checkin/stats', authenticateToken, async (req, res) => {
  try {
    const currentMonth = getLocalTime().date.slice(0, 7);
    const [monthRows] = await pool.query(
      'SELECT COUNT(*) as count FROM checkins WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?',
      [req.user.id, currentMonth]
    );
    const monthCount = monthRows[0].count;

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
        streakDays = 1;
      } else if (diffDays === 1) {
        streakDays++;
        currentDate = checkDate;
      } else if (diffDays === 0 && streakDays > 0) {
        continue;
      } else {
        break;
      }
    }

    res.json({ code: 0, message: 'success', data: { streakDays, monthCount } });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: '服务器异常', data: null });
  }
});

app.get('/api/checkin/records', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 20;
  const offset = (page - 1) * pageSize;

  try {
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM checkins WHERE user_id = ?', [req.user.id]);
    const total = totalRows[0].total;

    const [rows] = await pool.query(
      'SELECT * FROM checkins WHERE user_id = ? ORDER BY date DESC, time DESC LIMIT ? OFFSET ?',
      [req.user.id, pageSize, offset]
    );

    const list = rows.map((row) => ({
      id: 'rec_' + row.id,
      date: new Date(row.date).toISOString().split('T')[0],
      time: row.time,
      content: row.content || '',
      createdAt: row.created_at
    }));

    res.json({ code: 0, message: 'success', data: { list, total } });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: '服务器异常', data: null });
  }
});

app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  const { message, history } = req.body || {};
  const { trimmedMessage, messages } = normalizeChatMessages(history, message);

  if (!trimmedMessage) {
    return res.json({ code: 400, message: '问题内容不能为空', data: null });
  }

  if (!LLM_API_KEY) {
    return res.json({ code: 500, message: '未配置大模型密钥，请先设置 LLM_API_KEY', data: null });
  }

  if (typeof fetch !== 'function') {
    return res.json({ code: 500, message: '当前 Node 环境不支持 fetch，请升级到 Node 18+', data: null });
  }

  try {
    const llmRes = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: 0.7
      })
    });

    const result = await llmRes.json().catch(() => null);

    if (!llmRes.ok) {
      return res.json({
        code: 500,
        message: (result && result.error && result.error.message) || '大模型接口调用失败',
        data: null
      });
    }

    const reply = result && result.choices && result.choices[0] && result.choices[0].message
      ? result.choices[0].message.content
      : '';

    if (!reply) {
      return res.json({ code: 500, message: '模型未返回有效内容', data: null });
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        reply,
        model: LLM_MODEL
      }
    });
  } catch (error) {
    console.error('ai chat error', error);
    res.json({ code: 500, message: 'AI 服务暂时不可用', data: null });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`正式 API 服务已启动，正在监听 ${PORT} 端口...`);
});
