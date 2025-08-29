// 自定义日期选择器类
class CustomDatePicker {
    constructor(initialDate, onDateSelect) {
        this.currentDate = new Date(initialDate);
        this.selectedDate = new Date(initialDate);
        this.viewDate = new Date(initialDate); // 当前显示的月份
        this.onDateSelect = onDateSelect;
        this.overlay = null;
        this.monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        this.weekdays = ['日', '一', '二', '三', '四', '五', '六'];

        this.create();
        this.render();
    }

    create() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'custom-date-picker-overlay';

        // 创建日期选择器主体
        this.overlay.innerHTML = `
            <div class="custom-date-picker">
                <div class="date-picker-header">
                    <div class="date-picker-title">选择日期</div>
                    <button class="date-picker-close">&times;</button>
                </div>

                <div class="date-picker-nav">
                    <button id="prev-month">&lt;</button>
                    <div class="date-picker-month-year" id="month-year"></div>
                    <button id="next-month">&gt;</button>
                </div>

                <div class="date-picker-calendar">
                    <div class="date-picker-weekdays">
                        ${this.weekdays.map(day => `<div class="date-picker-weekday">${day}</div>`).join('')}
                    </div>
                    <div class="date-picker-days" id="calendar-days"></div>
                </div>

                <div class="date-picker-actions">
                    <button class="date-picker-btn today" id="select-today">今天</button>
                    <button class="date-picker-btn cancel" id="cancel-date">取消</button>
                    <button class="date-picker-btn confirm" id="confirm-date">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);
        this.bindEvents();
    }

    bindEvents() {
        // 关闭按钮
        this.overlay.querySelector('.date-picker-close').addEventListener('click', () => {
            this.close();
        });

        // 点击遮罩关闭
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // 月份导航
        this.overlay.querySelector('#prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        this.overlay.querySelector('#next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // 操作按钮
        this.overlay.querySelector('#select-today').addEventListener('click', () => {
            this.selectToday();
        });

        this.overlay.querySelector('#cancel-date').addEventListener('click', () => {
            this.close();
        });

        this.overlay.querySelector('#confirm-date').addEventListener('click', () => {
            this.confirm();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    render() {
        this.renderMonthYear();
        this.renderDays();
    }

    renderMonthYear() {
        const monthYear = this.overlay.querySelector('#month-year');
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        monthYear.textContent = `${year}年${this.monthNames[month]}`;
    }

    renderDays() {
        const daysContainer = this.overlay.querySelector('#calendar-days');
        daysContainer.innerHTML = '';

        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();

        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // 获取当月第一天是星期几
        const firstDayWeek = firstDay.getDay();

        // 添加上个月的最后几天
        for (let i = firstDayWeek - 1; i >= 0; i--) {
            const prevDate = new Date(year, month, -i);
            this.createDayButton(prevDate, true);
        }

        // 添加当月所有天
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            this.createDayButton(date, false);
        }

        // 添加下个月的前几天，填满6行
        const totalCells = daysContainer.children.length;
        const remainingCells = 42 - totalCells; // 6行 × 7列 = 42个单元格

        for (let day = 1; day <= remainingCells; day++) {
            const nextDate = new Date(year, month + 1, day);
            this.createDayButton(nextDate, true);
        }
    }

    createDayButton(date, isOtherMonth) {
        const daysContainer = this.overlay.querySelector('#calendar-days');
        const button = document.createElement('button');
        button.className = 'date-picker-day';
        button.textContent = date.getDate();

        if (isOtherMonth) {
            button.classList.add('other-month');
        }

        // 判断是否是今天
        const today = new Date();
        if (this.isSameDate(date, today)) {
            button.classList.add('today');
        }

        // 判断是否是选中的日期
        if (this.isSameDate(date, this.selectedDate)) {
            button.classList.add('selected');
        }

        // 绑定点击事件
        button.addEventListener('click', () => {
            this.selectDate(date);
        });

        daysContainer.appendChild(button);
    }

    selectDate(date) {
        this.selectedDate = new Date(date);

        // 如果选择的是其他月份的日期，切换到对应月份
        if (date.getMonth() !== this.viewDate.getMonth() ||
            date.getFullYear() !== this.viewDate.getFullYear()) {
            this.viewDate = new Date(date);
            this.render();
        } else {
            // 只更新选中状态
            this.overlay.querySelectorAll('.date-picker-day').forEach(btn => {
                btn.classList.remove('selected');
            });
            event.target.classList.add('selected');
        }
    }

    selectToday() {
        const today = new Date();
        this.selectedDate = new Date(today);
        this.viewDate = new Date(today);
        this.render();
    }

    changeMonth(delta) {
        this.viewDate.setMonth(this.viewDate.getMonth() + delta);
        this.render();
    }

    confirm() {
        if (this.onDateSelect) {
            this.onDateSelect(this.selectedDate);
        }
        this.close();
    }

    close() {
        if (this.overlay && document.body.contains(this.overlay)) {
            // 添加淡出动画
            this.overlay.style.opacity = '0';
            this.overlay.querySelector('.custom-date-picker').style.transform = 'translateY(20px)';

            setTimeout(() => {
                document.body.removeChild(this.overlay);
            }, 300);
        }
    }

    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
}
