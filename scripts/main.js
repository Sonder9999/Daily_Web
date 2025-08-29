// 主应用初始化
class DailyRecordApp {
    constructor() {
        this.backgroundManager = null;
        this.navbarManager = null;
        this.hoursDisplayManager = null;
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
    }

    handlePageChange(page) {
        switch (page) {
            case 'home':
                // 主页已经在hoursDisplayManager中处理
                break;
            case 'stats':
                this.showStatsPage();
                break;
            case 'settings':
                this.showSettingsPage();
                break;
        }
    }

    showStatsPage() {
        // TODO: 实现统计页面
        console.log('显示统计页面');
        alert('统计功能即将推出！');
    }

    showSettingsPage() {
        // TODO: 实现设置页面
        console.log('显示设置页面');
        alert('设置功能即将推出！');
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

// 检查服务器连接
async function checkServerConnection() {
    try {
        const response = await fetch('/api/event-templates');
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 全局变量
let app;

// 启动应用
document.addEventListener('DOMContentLoaded', async () => {
    // 检查服务器连接
    const serverConnected = await checkServerConnection();

    if (!serverConnected) {
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
                    <h1 style="margin-bottom: 20px;">无法连接到服务器</h1>
                    <p style="margin-bottom: 20px;">请确保服务器正在运行</p>
                    <p style="margin-bottom: 20px; font-size: 14px; opacity: 0.8;">运行命令: npm start</p>
                    <button onclick="location.reload()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 14px;
                    ">重新尝试</button>
                </div>
            </div>
        `;
        return;
    }

    // 初始化应用
    app = new DailyRecordApp();
});
