// 主应用初始化
class DailyRecordApp {
    constructor() {
        this.backgroundManager = null;
        this.navbarManager = null;
        this.hoursDisplayManager = null;
        this.statisticsManager = null;
        this.init();
    }

    async init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeComponents();
            });
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            // 初始化背景管理器
            this.backgroundManager = new BackgroundManager();

            // 初始化导航栏管理器
            this.navbarManager = new NavbarManager();

            // 初始化24小时显示管理器
            this.hoursDisplayManager = new HoursDisplayManager();

            // 初始化统计管理器
            this.statisticsManager = new StatisticsManager();

            // 设置导航栏和小时显示的关联
            this.setupComponentInteractions();

            // 加载今天的数据
            this.loadTodayData();

            console.log('日常记录应用初始化完成');

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showInitError();
        }
    }

    setupComponentInteractions() {
        // 设置日期变化回调
        this.navbarManager.setDateChangeCallback((date) => {
            this.hoursDisplayManager.loadEvents(date);
        });

        // 监听页面切换事件
        document.addEventListener('pageChange', (e) => {
            this.handlePageChange(e.detail);
        });
    }

    loadTodayData() {
        const today = this.navbarManager.getCurrentDate();
        this.hoursDisplayManager.loadEvents(today);

        // 确保主页面初始状态正确
        this.showHomePage();
    }

    handlePageChange(page) {
        switch (page) {
            case 'home':
                this.showHomePage();
                break;
            case 'stats':
                this.showStatsPage();
                break;
            case 'settings':
                this.showSettingsPage();
                break;
        }
    }

    showHomePage() {
        // 显示主页面元素
        const hoursContainer = document.getElementById('hours-container');
        const statsContainer = document.getElementById('stats-container');
        const mainContainer = document.querySelector('.main-container');

        if (hoursContainer) {
            hoursContainer.style.display = 'grid'; // 恢复为grid布局
        }
        if (statsContainer) {
            statsContainer.style.display = 'none';
        }
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }

        console.log('显示主页面');
    }    showStatsPage() {
        // 隐藏主页面元素，显示统计页面
        const hoursContainer = document.getElementById('hours-container');
        const mainContainer = document.querySelector('.main-container');
        const statsContainer = document.getElementById('stats-container');

        if (mainContainer) {
            mainContainer.style.display = 'none';
        }
        if (hoursContainer) {
            hoursContainer.style.display = 'none';
        }
        if (statsContainer) {
            statsContainer.style.display = 'block';
        } else {
            // 如果统计容器不存在，确保统计管理器已创建
            if (this.statisticsManager) {
                this.statisticsManager.createStatsContainer();
                // 重新获取容器
                const newStatsContainer = document.getElementById('stats-container');
                if (newStatsContainer) {
                    newStatsContainer.style.display = 'block';
                }
            }
        }

        console.log('切换到统计页面');
    }

    showSettingsPage() {
        // TODO: 实现设置页面
        console.log('显示设置页面');
        alert('设置功能即将推出！');
    }

    showServerError() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="margin-bottom: 20px;">🚀 服务器未启动</h1>
                    <p style="margin-bottom: 15px;">请按照以下步骤启动服务器：</p>
                    <div style="
                        background: rgba(0, 0, 0, 0.2);
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                        font-family: 'Courier New', monospace;
                        line-height: 1.5;
                    ">
                        <p>1. 打开终端/命令提示符</p>
                        <p>2. 进入项目目录</p>
                        <p>3. 运行: <strong>node server.js</strong></p>
                        <p>4. 等待显示"服务器运行在 http://localhost:3000"</p>
                        <p>5. 刷新此页面</p>
                    </div>
                    <button onclick="location.reload()" style="
                        background: rgba(46, 204, 113, 0.8);
                        border: none;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 10px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(46, 204, 113, 1)'"
                       onmouseout="this.style.background='rgba(46, 204, 113, 0.8)'">
                        🔄 重新检测服务器
                    </button>
                    <button onclick="window.open('http://localhost:3000', '_blank')" style="
                        background: rgba(52, 152, 219, 0.8);
                        border: none;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 10px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(52, 152, 219, 1)'"
                       onmouseout="this.style.background='rgba(52, 152, 219, 0.8)'">
                        🌐 访问服务器版本
                    </button>
                </div>
            </div>
        `;
    }

    showInitError() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="margin-bottom: 20px;">应用初始化失败</h1>
                    <p style="margin-bottom: 20px;">请检查网络连接或稍后重试</p>
                    <button onclick="location.reload()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 14px;
                    ">重新加载</button>
                </div>
            </div>
        `;
    }
}

// 全局变量
let app;

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    app = new DailyRecordApp();
});
