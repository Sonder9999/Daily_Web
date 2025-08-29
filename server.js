const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '198386',
    database: 'daily_record',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');
        connection.release();
    } catch (error) {
        console.error('数据库连接失败:', error);
    }
}

// API路由

// 测试路由
app.get('/api/test', (req, res) => {
    res.json({ message: 'API服务器正常运行', timestamp: new Date().toISOString() });
});

// 获取指定日期的事件
app.get('/api/events/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM events WHERE date = ? ORDER BY start_time',
            [date]
        );
        res.json(rows);
    } catch (error) {
        console.error('获取事件失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加新事件
app.post('/api/events', async (req, res) => {
    try {
        const { date, start_time, end_time, event_name, notes } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO events (date, start_time, end_time, event_name, notes) VALUES (?, ?, ?, ?, ?)',
            [date, start_time, end_time, event_name, notes || '']
        );
        res.json({ id: result.insertId, message: '事件添加成功' });
    } catch (error) {
        console.error('添加事件失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新事件
app.put('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, start_time, end_time, event_name, notes } = req.body;
        await pool.execute(
            'UPDATE events SET date = ?, start_time = ?, end_time = ?, event_name = ?, notes = ? WHERE id = ?',
            [date, start_time, end_time, event_name, notes || '', id]
        );
        res.json({ message: '事件更新成功' });
    } catch (error) {
        console.error('更新事件失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除事件
app.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: '事件删除成功' });
    } catch (error) {
        console.error('删除事件失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取事件模板
app.get('/api/event-templates', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM event_templates ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('获取事件模板失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加新的事件模板
app.post('/api/event-templates', async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO event_templates (name) VALUES (?)',
            [name]
        );
        res.json({ id: result.insertId, message: '事件模板添加成功' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: '事件模板已存在' });
        } else {
            console.error('添加事件模板失败:', error);
            res.status(500).json({ error: '服务器错误' });
        }
    }
});

// 统计接口 - 获取事件统计数据
app.get('/api/statistics/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;

        // 事件频率统计
        const [frequencyRows] = await pool.execute(`
            SELECT event_name, COUNT(*) as frequency,
                   SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes
            FROM events
            WHERE date BETWEEN ? AND ?
            GROUP BY event_name
            ORDER BY frequency DESC
        `, [startDate, endDate]);

        res.json({ frequency: frequencyRows });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    testConnection();
});