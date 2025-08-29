// 导航栏管理器
class NavbarManager {
    constructor() {
        this.currentDate = new Date();
        this.onDateChange = null; // 回调函数
        this.init();
    }

    init() {
        this.createNavbar();
        this.updateDateDisplay();
        this.bindEvents();
    }

    createNavbar() {
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.innerHTML = `
            <div class="navbar-left">
                <a href="#" class="navbar-logo">📅 日常记录</a>
            </div>
            <div class="navbar-center">
                <div class="date-selector">
                    <button class="date-nav-btn" id="prev-date">‹</button>
                    <span class="current-date" id="current-date"></span>
                    <button class="date-nav-btn" id="next-date">›</button>
                </div>
            </div>
            <div class="navbar-right">
                <a href="#" class="nav-btn active" id="home-btn">主页</a>
                <a href="#" class="nav-btn" id="stats-btn">统计</a>
                <a href="#" class="nav-btn" id="settings-btn">设置</a>
            </div>
        `;

        document.body.appendChild(navbar);
    }

    bindEvents() {
        // 日期导航事件
        document.getElementById('prev-date').addEventListener('click', () => {
            this.changeDate(-1);
        });

        document.getElementById('next-date').addEventListener('click', () => {
            this.changeDate(1);
        });

        // 导航按钮事件
        document.getElementById('home-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.setActiveButton('home-btn');
            this.showPage('home');
        });

        document.getElementById('stats-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.setActiveButton('stats-btn');
            this.showPage('stats');
        });

        document.getElementById('settings-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.setActiveButton('settings-btn');
            this.showPage('settings');
        });

        // 点击当前日期可以选择日期
        document.getElementById('current-date').addEventListener('click', () => {
            this.showDatePicker();
        });
    }

    changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.updateDateDisplay();

        if (this.onDateChange) {
            this.onDateChange(this.formatDate(this.currentDate));
        }
    }

    setDate(date) {
        this.currentDate = new Date(date);
        this.updateDateDisplay();

        if (this.onDateChange) {
            this.onDateChange(this.formatDate(this.currentDate));
        }
    }

    updateDateDisplay() {
        const dateElement = document.getElementById('current-date');
        const today = new Date();
        const isToday = this.isSameDate(this.currentDate, today);

        if (isToday) {
            dateElement.textContent = `今天 ${this.formatDateChinese(this.currentDate)}`;
        } else {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (this.isSameDate(this.currentDate, yesterday)) {
                dateElement.textContent = `昨天 ${this.formatDateChinese(this.currentDate)}`;
            } else if (this.isSameDate(this.currentDate, tomorrow)) {
                dateElement.textContent = `明天 ${this.formatDateChinese(this.currentDate)}`;
            } else {
                dateElement.textContent = this.formatDateChinese(this.currentDate);
            }
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateChinese(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdays[date.getDay()];

        return `${month}月${day}日 ${weekday}`;
    }

    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    setActiveButton(activeId) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(activeId).classList.add('active');
    }

    showPage(page) {
        // 触发页面切换事件
        const event = new CustomEvent('pageChange', { detail: page });
        document.dispatchEvent(event);
    }

    showDatePicker() {
        // 创建隐藏的日期输入框
        const input = document.createElement('input');
        input.type = 'date';
        input.value = this.formatDate(this.currentDate);
        input.style.position = 'fixed';
        input.style.top = '50%';
        input.style.left = '50%';
        input.style.transform = 'translate(-50%, -50%)';
        input.style.zIndex = '9999';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';

        document.body.appendChild(input);

        // 强制触发日期选择器
        setTimeout(() => {
            input.style.opacity = '1';
            input.style.pointerEvents = 'auto';
            input.focus();
            input.click();
        }, 10);

        input.addEventListener('change', () => {
            if (input.value) {
                this.setDate(input.value);
            }
            document.body.removeChild(input);
        });

        // 点击其他地方关闭
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                }
            }, 100);
        });
    }    // 设置日期变化回调
    setDateChangeCallback(callback) {
        this.onDateChange = callback;
    }

    // 获取当前日期
    getCurrentDate() {
        return this.formatDate(this.currentDate);
    }
}

// 全局导航栏实例
let navbarManager;
