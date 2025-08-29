-- 日常记录网站数据库结构
CREATE DATABASE IF NOT EXISTS daily_record;
USE daily_record;

-- 事件表
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 事件名称预设表（不存储颜色，颜色由JS生成）
CREATE TABLE event_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入一些默认的事件模板
INSERT INTO event_templates (name) VALUES
('睡觉'),
('吃饭'),
('学习'),
('工作'),
('运动'),
('娱乐'),
('刷B站'),
('休息');

-- 创建索引
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_time ON events(start_time, end_time);
CREATE INDEX idx_event_name ON events(event_name);