const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件配置
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'file://', null],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 处理预检请求
app.options('*', cors());

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

// 添加测试数据的路由
app.post('/api/test-data', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 清除今天的测试数据
        await pool.execute('DELETE FROM events WHERE date = ? AND event_name LIKE "测试%"', [today]);

        // 添加重叠的测试事件
        const testEvents = [
            { start_time: '08:00', end_time: '09:30', event_name: '测试-吃早餐', notes: '重叠测试1' },
            { start_time: '08:30', end_time: '09:00', event_name: '测试-刷B站', notes: '重叠测试2' },
            { start_time: '08:45', end_time: '09:15', event_name: '测试-看新闻', notes: '重叠测试3' },
            { start_time: '14:00', end_time: '15:30', event_name: '测试-学习', notes: '' },
            { start_time: '14:20', end_time: '15:00', event_name: '测试-休息', notes: '' },
        ];

        for (const event of testEvents) {
            await pool.execute(
                'INSERT INTO events (date, start_time, end_time, event_name, notes) VALUES (?, ?, ?, ?, ?)',
                [today, event.start_time, event.end_time, event.event_name, event.notes]
            );
        }

        res.json({ message: '测试数据添加成功', count: testEvents.length });
    } catch (error) {
        console.error('添加测试数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
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
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件服务: ${__dirname}`);
    console.log(`🌐 CORS已启用，支持Live Server访问`);
    console.log(`💾 数据库: ${dbConfig.database}`);
    console.log(`\n✅ 现在你可以:`);
    console.log(`   - 直接访问: http://localhost:${PORT}`);
    console.log(`   - 使用Live Server打开index.html`);
    console.log(`   - 双击index.html文件打开`);
    console.log(`\n🔧 如果Live Server端口不是5500，请在scripts/main.js中修改API_BASE_URL\n`);

    testConnection();
});