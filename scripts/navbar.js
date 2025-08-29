// 导航栏管理器
class NavbarManager {
    constructor() {
        this.currentDate = new Date();
        this.onDateChange = null; // 回调函数
        this.init();
    }

    init() {
        this.updateDateDisplay();
        this.bindEvents();
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
        // 使用自定义日期选择器
        const datePicker = new CustomDatePicker(this.currentDate, (selectedDate) => {
            this.setDate(selectedDate);
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
