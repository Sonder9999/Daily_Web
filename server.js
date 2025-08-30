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

        // 事件频率统计 - 修复时间计算
        const [frequencyRows] = await pool.execute(`
            SELECT event_name, COUNT(*) as frequency,
                   SUM(CASE
                       WHEN start_time IS NOT NULL AND end_time IS NOT NULL
                       THEN TIMESTAMPDIFF(MINUTE,
                           CONCAT(date, ' ', start_time),
                           CONCAT(date, ' ', end_time))
                       ELSE 0
                   END) as total_minutes
            FROM events
            WHERE date BETWEEN ? AND ?
            GROUP BY event_name
            ORDER BY frequency DESC
        `, [startDate, endDate]);

        console.log('统计查询结果:', frequencyRows); // 添加调试日志
        res.json({ frequency: frequencyRows });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 导出数据API
app.get('/api/export', async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;

        // 构建查询条件
        let whereClause = '';
        let params = [];

        if (startDate && endDate) {
            whereClause = 'WHERE date BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        // 查询所有事件，使用DATE_FORMAT确保日期格式正确
        const [events] = await pool.execute(`
            SELECT id, DATE_FORMAT(date, '%Y-%m-%d') as date, start_time, end_time, event_name, notes
            FROM events
            ${whereClause}
            ORDER BY date, start_time
        `, params);

        // 生成文件名
        let filename = 'daily_record';
        if (events.length > 0) {
            if (startDate && endDate) {
                filename = `daily_record_${startDate}_to_${endDate}`;
            } else {
                // 全部数据时，使用实际数据的日期范围
                const dates = events.map(event => event.date).sort(); // 现在日期已经是YYYY-MM-DD字符串格式

                const minDate = dates[0];
                const maxDate = dates[dates.length - 1];
                if (minDate === maxDate) {
                    filename = `daily_record_${minDate}`;
                } else {
                    filename = `daily_record_${minDate}_to_${maxDate}`;
                }
            }
        }

        if (format === 'json') {
            // JSON格式导出
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.json(events);
        } else {
            // Markdown格式导出
            const markdownContent = generateMarkdownContent(events);
            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
            res.send(markdownContent);
        }
    } catch (error) {
        console.error('导出数据失败:', error);
        res.status(500).json({ error: '导出失败' });
    }
});

// 导入数据API
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const fs = require('fs');
        const fileContent = fs.readFileSync(req.file.path, 'utf8');

        let events = [];

        if (req.file.originalname.endsWith('.json')) {
            events = JSON.parse(fileContent);
        } else if (req.file.originalname.endsWith('.md')) {
            events = parseMarkdownContent(fileContent);
        } else {
            throw new Error('不支持的文件格式');
        }

        let imported = 0;
        let skipped = 0;

        for (const event of events) {
            // 转换日期格式
            if (event.date) {
                // 如果是ISO格式的日期，转换为YYYY-MM-DD格式
                if (event.date.includes('T')) {
                    event.date = new Date(event.date).toISOString().split('T')[0];
                }
            }

            // 检查事件是否已存在
            const [existing] = await pool.execute(`
                SELECT id FROM events
                WHERE date = ? AND start_time = ? AND end_time = ? AND event_name = ?
            `, [event.date, event.start_time, event.end_time, event.event_name]);

            if (existing.length === 0) {
                // 插入新事件
                await pool.execute(`
                    INSERT INTO events (date, start_time, end_time, event_name, notes)
                    VALUES (?, ?, ?, ?, ?)
                `, [event.date, event.start_time, event.end_time, event.event_name, event.notes || '']);
                imported++;
            } else {
                skipped++;
            }
        }

        // 清理上传的文件
        fs.unlinkSync(req.file.path);

        res.json({ imported, skipped, total: events.length });
    } catch (error) {
        console.error('导入数据失败:', error);
        res.status(500).json({ error: '导入失败: ' + error.message });
    }
});

// 生成Markdown内容的辅助函数
function generateMarkdownContent(events) {
    const groupedEvents = {};

    // 按年月日分组
    events.forEach(event => {
        // 现在日期已经是YYYY-MM-DD字符串格式
        const [year, month, day] = event.date.split('-').map(Number);

        if (!groupedEvents[year]) groupedEvents[year] = {};
        if (!groupedEvents[year][month]) groupedEvents[year][month] = {};
        if (!groupedEvents[year][month][day]) groupedEvents[year][month][day] = [];

        groupedEvents[year][month][day].push(event);
    });

    let markdown = '# 日常记录导出\n\n';

    // 生成Markdown结构
    Object.keys(groupedEvents).sort().forEach(year => {
        markdown += `# ${year}年\n\n`;

        Object.keys(groupedEvents[year]).sort((a, b) => parseInt(a) - parseInt(b)).forEach(month => {
            markdown += `## ${month}月\n\n`;

            Object.keys(groupedEvents[year][month]).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
                markdown += `### ${month}月${day}日\n\n`;

                const dayEvents = groupedEvents[year][month][day];

                // 按小时分组
                const hourGroups = {};
                dayEvents.forEach(event => {
                    const hour = parseInt(event.start_time.split(':')[0]);
                    if (!hourGroups[hour]) hourGroups[hour] = [];
                    hourGroups[hour].push(event);
                });

                Object.keys(hourGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hour => {
                    const hourEvents = hourGroups[hour];
                    markdown += `**${hour}:00 - ${parseInt(hour) + 1}:00**\n\n`;

                    hourEvents.forEach(event => {
                        markdown += `- ${event.event_name}\n`;
                        markdown += `  - ${event.start_time} - ${event.end_time}\n`;
                        if (event.notes) {
                            markdown += `  - ${event.notes}\n`;
                        }
                    });

                    markdown += '\n';
                });
            });
        });
    });

    return markdown;
}

// 解析Markdown内容的辅助函数
function parseMarkdownContent(content) {
    const events = [];
    const lines = content.split('\n');

    let currentYear = null;
    let currentMonth = null;
    let currentDay = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 解析年份
        const yearMatch = line.match(/^# (\d+)年/);
        if (yearMatch) {
            currentYear = yearMatch[1];
            continue;
        }

        // 解析月份
        const monthMatch = line.match(/^## (\d+)月/);
        if (monthMatch) {
            currentMonth = monthMatch[1].padStart(2, '0');
            continue;
        }

        // 解析日期
        const dayMatch = line.match(/^### \d+月(\d+)日/);
        if (dayMatch) {
            currentDay = dayMatch[1].padStart(2, '0');
            continue;
        }

        // 解析事件
        const eventMatch = line.match(/^- (.+)$/);
        if (eventMatch && currentYear && currentMonth && currentDay) {
            const eventName = eventMatch[1];

            // 下一行应该是时间
            const nextLineIndex = i + 1;
            if (nextLineIndex < lines.length) {
                const timeLine = lines[nextLineIndex];
                const timeMatch = timeLine.match(/^\s+- (\d{2}:\d{2}:\d{2}) - (\d{2}:\d{2}:\d{2})/);
                if (timeMatch) {
                    const event = {
                        date: `${currentYear}-${currentMonth}-${currentDay}`,
                        start_time: timeMatch[1],
                        end_time: timeMatch[2],
                        event_name: eventName,
                        notes: ''
                    };

                    // 检查是否有备注
                    const noteLineIndex = nextLineIndex + 1;
                    if (noteLineIndex < lines.length) {
                        const noteLine = lines[noteLineIndex];
                        const noteMatch = noteLine.match(/^\s+- (.+)$/);
                        if (noteMatch && !noteLine.match(/^\s+- \d{2}:\d{2}:\d{2} - \d{2}:\d{2}:\d{2}/)) {
                            // 确保这不是另一个时间行
                            event.notes = noteMatch[1];
                        }
                    }

                    events.push(event);
                }
            }
        }
    }

    return events;
}

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