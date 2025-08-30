// 统计页面管理器
class StatisticsManager {
    constructor() {
        this.statsData = null;
        this.currentChartType = {
            frequency: 'pie',
            duration: 'bar'
        };
        this.charts = {
            frequency: null,
            duration: null
        };
        this.init();
    }

    init() {
        this.createStatsContainer();
        this.bindEvents();
        this.setDefaultDateRange();
    }

    createStatsContainer() {
        // 检查是否已经存在统计容器
        const existingContainer = document.getElementById('stats-container');
        if (existingContainer) {
            return;
        }

        const container = document.createElement('div');
        container.className = 'stats-container';
        container.id = 'stats-container';
        container.style.display = 'none'; // 默认隐藏
        container.innerHTML = `
            <div class="stats-header">
                <h2 class="stats-title">📊 事件统计分析</h2>
                <div class="stats-date-range">
                    <div class="date-range-input">
                        <label>开始日期:</label>
                        <input type="text" id="stats-start-date" class="custom-date-input" readonly placeholder="选择开始日期">
                    </div>
                    <div class="date-range-input">
                        <label>结束日期:</label>
                        <input type="text" id="stats-end-date" class="custom-date-input" readonly placeholder="选择结束日期">
                    </div>
                    <button class="stats-update-btn" id="update-stats">更新统计</button>
                </div>
            </div>

            <div class="stats-content">
                <!-- 事件频率统计 -->
                <div class="stats-card">
                    <div class="stats-card-header">
                        <h3 class="stats-card-title">事件频率统计</h3>
                        <div class="chart-type-toggle">
                            <button class="chart-type-btn active" data-chart="frequency" data-type="pie">饼图</button>
                            <button class="chart-type-btn" data-chart="frequency" data-type="bar">柱图</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas class="chart-canvas" id="frequency-chart"></canvas>
                    </div>
                </div>

                <!-- 事件时长统计 -->
                <div class="stats-card">
                    <div class="stats-card-header">
                        <h3 class="stats-card-title">事件时长统计</h3>
                        <div class="chart-type-toggle">
                            <button class="chart-type-btn" data-chart="duration" data-type="pie">饼图</button>
                            <button class="chart-type-btn active" data-chart="duration" data-type="bar">柱图</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas class="chart-canvas" id="duration-chart"></canvas>
                    </div>
                </div>

                <!-- 统计摘要 -->
                <div class="stats-card stats-summary">
                    <div class="stats-card-header">
                        <h3 class="stats-card-title">统计摘要</h3>
                    </div>
                    <div class="summary-grid" id="summary-grid">
                        <!-- 动态生成 -->
                    </div>
                </div>

                <!-- 事件详细列表 -->
                <div class="stats-card">
                    <div class="stats-card-header">
                        <h3 class="stats-card-title">事件详细列表</h3>
                    </div>
                    <div class="event-list" id="event-list">
                        <!-- 动态生成 -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    bindEvents() {
        // 更新统计按钮
        document.getElementById('update-stats').addEventListener('click', () => {
            this.loadStatistics();
        });

        // 自定义日期选择器
        document.getElementById('stats-start-date').addEventListener('click', () => {
            this.showDatePicker('stats-start-date');
        });

        document.getElementById('stats-end-date').addEventListener('click', () => {
            this.showDatePicker('stats-end-date');
        });

        // 图表类型切换
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                const displayType = e.target.dataset.type;

                // 更新按钮状态
                const toggleGroup = e.target.parentElement;
                toggleGroup.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // 更新图表类型
                this.currentChartType[chartType] = displayType;
                this.renderChart(chartType);
            });
        });

        // 监听页面切换事件
        document.addEventListener('pageChange', (e) => {
            const page = e.detail;
            const container = document.getElementById('stats-container');

            if (page === 'stats') {
                container.classList.add('active');
                if (!this.statsData) {
                    this.loadStatistics();
                }
            } else {
                container.classList.remove('active');
            }
        });
    }

    setDefaultDateRange() {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // 使用显示格式设置默认值
        document.getElementById('stats-start-date').value = this.formatDisplayDate(lastWeek);
        document.getElementById('stats-end-date').value = this.formatDisplayDate(today);

        // 存储实际的ISO日期值
        document.getElementById('stats-start-date').dataset.isoDate = this.formatDate(lastWeek);
        document.getElementById('stats-end-date').dataset.isoDate = this.formatDate(today);
    }

    showDatePicker(inputId) {
        const input = document.getElementById(inputId);
        const currentDate = input.dataset.isoDate ? new Date(input.dataset.isoDate) : new Date();

        const datePicker = new CustomDatePicker(currentDate, (selectedDate) => {
            input.value = this.formatDisplayDate(selectedDate);
            input.dataset.isoDate = this.formatDate(selectedDate);
        });
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDisplayDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    async loadStatistics() {
        const startDateElement = document.getElementById('stats-start-date');
        const endDateElement = document.getElementById('stats-end-date');

        if (!startDateElement || !endDateElement) {
            console.error('日期输入元素未找到');
            this.showError('无法获取日期输入元素');
            return;
        }

        const startDate = startDateElement.dataset.isoDate;
        const endDate = endDateElement.dataset.isoDate;

        if (!startDate || !endDate) {
            this.showError('请选择开始和结束日期');
            return;
        }

        if (startDate > endDate) {
            this.showError('开始日期不能晚于结束日期');
            return;
        }

        try {
            this.showLoading();

            const response = await fetch(`/api/statistics/${startDate}/${endDate}`);

            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
            }

            this.statsData = await response.json();

            this.renderStatistics();
        } catch (error) {
            console.error('加载统计数据失败:', error);
            this.showError('加载统计数据失败，请稍后重试');
        }
    }

    showLoading() {
        const frequencyChart = document.getElementById('frequency-chart');
        const durationChart = document.getElementById('duration-chart');
        const summaryGrid = document.getElementById('summary-grid');
        const eventList = document.getElementById('event-list');

        // 检查元素是否存在，如果存在则更新其父容器
        if (frequencyChart && frequencyChart.parentElement) {
            frequencyChart.parentElement.innerHTML = '<div class="loading-stats">加载中...</div>';
        }
        if (durationChart && durationChart.parentElement) {
            durationChart.parentElement.innerHTML = '<div class="loading-stats">加载中...</div>';
        }
        if (summaryGrid) {
            summaryGrid.innerHTML = '<div class="loading-stats">加载中...</div>';
        }
        if (eventList) {
            eventList.innerHTML = '<div class="loading-stats">加载中...</div>';
        }
    }

    showError(message) {
        const frequencyChart = document.getElementById('frequency-chart');
        const durationChart = document.getElementById('duration-chart');
        const summaryGrid = document.getElementById('summary-grid');
        const eventList = document.getElementById('event-list');

        // 检查元素是否存在，如果存在则更新其父容器
        if (frequencyChart && frequencyChart.parentElement) {
            frequencyChart.parentElement.innerHTML = `<div class="no-data">${message}</div>`;
        }
        if (durationChart && durationChart.parentElement) {
            durationChart.parentElement.innerHTML = `<div class="no-data">${message}</div>`;
        }
        if (summaryGrid) {
            summaryGrid.innerHTML = `<div class="no-data">${message}</div>`;
        }
        if (eventList) {
            eventList.innerHTML = `<div class="no-data">${message}</div>`;
        }
    }

    renderStatistics() {
        console.log('renderStatistics被调用, statsData:', this.statsData);

        if (!this.statsData || !this.statsData.frequency || this.statsData.frequency.length === 0) {
            console.log('数据为空，显示错误信息');
            this.showError('所选日期范围内暂无数据');
            return;
        }

        console.log('开始渲染图表和统计信息');
        this.renderCharts();
        this.renderSummary();
        this.renderEventList();
    }

    renderCharts() {
        // 直接替换容器内容为canvas元素
        const frequencyContainer = document.querySelector('.stats-card:nth-child(1) .chart-container');
        const durationContainer = document.querySelector('.stats-card:nth-child(2) .chart-container');

        if (frequencyContainer) {
            frequencyContainer.innerHTML = '<canvas class="chart-canvas" id="frequency-chart"></canvas>';
        }
        if (durationContainer) {
            durationContainer.innerHTML = '<canvas class="chart-canvas" id="duration-chart"></canvas>';
        }

        // 使用setTimeout确保DOM更新完成后再渲染图表
        setTimeout(() => {
            this.renderChart('frequency');
            this.renderChart('duration');
        }, 150);
    }

    renderChart(chartType) {
        console.log(`尝试渲染图表: ${chartType}`);
        const canvas = document.getElementById(`${chartType}-chart`);
        if (!canvas) {
            console.error(`Canvas element for ${chartType} not found`);
            console.log('DOM中所有元素:', document.querySelectorAll('.chart-container'));
            return;
        }

        console.log(`找到canvas元素: ${chartType}-chart`);
        const ctx = canvas.getContext('2d');

        // 清除之前的图表
        if (this.charts[chartType]) {
            this.charts[chartType].destroy();
        }

        const data = this.prepareChartData(chartType);
        const config = this.getChartConfig(chartType, data);

        this.charts[chartType] = new Chart(ctx, config);
    }

    prepareChartData(chartType) {
        const events = this.statsData.frequency;

        if (chartType === 'frequency') {
            return {
                labels: events.map(e => e.event_name),
                datasets: [{
                    data: events.map(e => e.frequency),
                    backgroundColor: events.map((e, i) => this.generateChartColor(i, events.length)),
                    borderColor: events.map((e, i) => this.generateChartColor(i, events.length, 0.8)),
                    borderWidth: 2
                }]
            };
        } else {
            return {
                labels: events.map(e => e.event_name),
                datasets: [{
                    label: '时长 (分钟)',
                    data: events.map(e => Math.round(parseFloat(e.total_minutes) || 0)),
                    backgroundColor: events.map((e, i) => this.generateChartColor(i, events.length, 0.7)),
                    borderColor: events.map((e, i) => this.generateChartColor(i, events.length)),
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            };
        }
    }

    getChartConfig(chartType, data) {
        const displayType = this.currentChartType[chartType];

        const baseConfig = {
            type: displayType,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: displayType === 'pie' ? 'bottom' : 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        };

        if (displayType === 'bar') {
            baseConfig.options.scales = {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#7f8c8d',
                        maxRotation: 45
                    }
                }
            };
        }

        return baseConfig;
    }

    generateChartColor(index, total, alpha = 1) {
        const hue = (index * 360 / total) % 360;
        const saturation = 65 + (index % 3) * 10; // 65-85%
        const lightness = 55 + (index % 4) * 5;   // 55-70%

        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }

    renderSummary() {
        const events = this.statsData.frequency;
        const totalEvents = events.reduce((sum, e) => sum + e.frequency, 0);

        // 修复时间计算，添加数据验证
        let totalMinutes = 0;
        events.forEach(e => {
            const minutes = parseFloat(e.total_minutes) || 0;
            // 验证数据合理性，如果超过1年的分钟数则可能是错误数据
            if (minutes > 0 && minutes < 525600) { // 525600 = 365 * 24 * 60
                totalMinutes += minutes;
            }
        });

        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        const avgDuration = totalEvents > 0 ? Math.round(totalMinutes / totalEvents) : 0;
        const mostFrequent = events.length > 0 ? events[0].event_name : '无';

        const summaryGrid = document.getElementById('summary-grid');
        summaryGrid.innerHTML = `
            <div class="summary-item">
                <div class="summary-value">${totalEvents}</div>
                <div class="summary-label">总事件数</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${totalHours}h</div>
                <div class="summary-label">总时长</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${avgDuration}分</div>
                <div class="summary-label">平均时长</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${events.length}</div>
                <div class="summary-label">事件类型</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${mostFrequent}</div>
                <div class="summary-label">最频繁事件</div>
            </div>
        `;
    }

    renderEventList() {
        const events = this.statsData.frequency;
        const eventList = document.getElementById('event-list');

        if (events.length === 0) {
            eventList.innerHTML = '<div class="no-data">暂无事件数据</div>';
            return;
        }

        eventList.innerHTML = events.map((event, index) => {
            const totalMinutes = parseFloat(event.total_minutes) || 0;
            const hours = Math.floor(totalMinutes / 60);
            const minutes = Math.round(totalMinutes % 60);
            const durationText = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
            const color = this.generateChartColor(index, events.length);

            return `
                <div class="event-item">
                    <div class="event-info">
                        <span class="event-color" style="background-color: ${color}"></span>
                        <span class="event-name">${event.event_name}</span>
                    </div>
                    <div class="event-stats">
                        <div class="event-duration">${durationText}</div>
                        <div class="event-frequency">${event.frequency} 次</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 全局统计管理器实例
let statisticsManager;
