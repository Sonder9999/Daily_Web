// 24小时显示管理器
class HoursDisplayManager {
    constructor() {
        this.events = [];
        this.currentDate = null;
        this.tooltip = null;
        this.init();
    }

    init() {
        this.createMainContainer();
        this.createTooltip();
        this.generateHourCapsules();
        this.bindEvents();
    }

    createMainContainer() {
        const container = document.createElement('div');
        container.className = 'main-container';
        container.innerHTML = `
            <div class="hours-container" id="hours-container">
                <div class="loading">加载中...</div>
            </div>
        `;
        document.body.appendChild(container);
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'event-tooltip';
        document.body.appendChild(this.tooltip);
    }

    generateHourCapsules() {
        const container = document.getElementById('hours-container');
        container.innerHTML = '';

        for (let hour = 0; hour < 24; hour++) {
            const capsule = this.createHourCapsule(hour);
            container.appendChild(capsule);
        }
    }

    createHourCapsule(hour) {
        const capsule = document.createElement('div');
        capsule.className = `hour-capsule hour-${hour}`;
        capsule.dataset.hour = hour;

        const hourLabel = document.createElement('div');
        hourLabel.className = 'hour-label';
        hourLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;

        const minutesContainer = document.createElement('div');
        minutesContainer.className = 'minutes-container';

        const addBtn = document.createElement('button');
        addBtn.className = 'add-event-btn';
        addBtn.innerHTML = '+';
        addBtn.title = `添加 ${hour}:00 的事件`;

        capsule.appendChild(hourLabel);
        capsule.appendChild(minutesContainer);
        capsule.appendChild(addBtn);

        // 绑定添加事件按钮
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showAddEventDialog(hour);
        });

        return capsule;
    }

    // 加载指定日期的事件
    async loadEvents(date) {
        try {
            this.currentDate = date;
            const response = await fetch(`/api/events/${date}`);
            this.events = await response.json();
            this.renderEvents();
        } catch (error) {
            console.error('加载事件失败:', error);
            this.showError('加载事件失败，请稍后重试');
        }
    }

    // 渲染事件到胶囊中
    renderEvents() {
        // 清除所有现有事件
        document.querySelectorAll('.event-block').forEach(block => block.remove());

        this.events.forEach(event => {
            this.renderEvent(event);
        });
    }

    renderEvent(event) {
        const startTime = this.parseTime(event.start_time);
        const endTime = this.parseTime(event.end_time);

        // 处理跨小时事件
        const startHour = startTime.hour;
        const endHour = endTime.hour;

        for (let hour = startHour; hour <= endHour; hour++) {
            const capsule = document.querySelector(`[data-hour="${hour}"] .minutes-container`);
            if (!capsule) continue;

            let startMinute = 0;
            let endMinute = 59;

            if (hour === startHour) {
                startMinute = startTime.minute;
            }
            if (hour === endHour) {
                endMinute = endTime.minute;
            }

            // 如果结束时间的分钟是0，且不是开始小时，则跳过
            if (hour === endHour && endTime.minute === 0 && hour !== startHour) {
                continue;
            }

            this.createEventBlock(capsule, event, startMinute, endMinute, hour);
        }
    }

    createEventBlock(container, event, startMinute, endMinute, hour) {
        const eventBlock = document.createElement('div');
        eventBlock.className = 'event-block';
        eventBlock.dataset.eventId = event.id;

        // 计算位置和宽度
        const left = (startMinute / 60) * 100;
        const width = ((endMinute - startMinute + 1) / 60) * 100;

        eventBlock.style.left = `${left}%`;
        eventBlock.style.width = `${width}%`;

        // 生成事件颜色
        const color = this.generateEventColor(event.event_name, hour);
        eventBlock.style.background = color;

        // 事件文本
        const eventText = document.createElement('span');
        eventText.className = 'event-text';
        eventText.textContent = event.event_name;
        eventBlock.appendChild(eventText);

        // 绑定事件
        this.bindEventBlockEvents(eventBlock, event);

        container.appendChild(eventBlock);
    }

    bindEventBlockEvents(eventBlock, event) {
        // 点击编辑
        eventBlock.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEditEventDialog(event);
        });

        // 悬停提示
        eventBlock.addEventListener('mouseenter', (e) => {
            this.showTooltip(e, event);
        });

        eventBlock.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });

        eventBlock.addEventListener('mousemove', (e) => {
            this.updateTooltipPosition(e);
        });
    }

    showTooltip(e, event) {
        const startTime = event.start_time.substring(0, 5);
        const endTime = event.end_time.substring(0, 5);
        const duration = this.calculateDuration(event.start_time, event.end_time);

        let content = `${startTime} - ${endTime}<br>`;
        content += `${event.event_name}<br>`;
        content += `时长: ${duration}`;

        if (event.notes) {
            content += `<br>备注: ${event.notes}`;
        }

        this.tooltip.innerHTML = content;
        this.tooltip.classList.add('show');
        this.updateTooltipPosition(e);
    }

    hideTooltip() {
        this.tooltip.classList.remove('show');
    }

    updateTooltipPosition(e) {
        const rect = this.tooltip.getBoundingClientRect();
        let left = e.clientX + 10;
        let top = e.clientY - rect.height - 10;

        // 边界检查
        if (left + rect.width > window.innerWidth) {
            left = e.clientX - rect.width - 10;
        }
        if (top < 0) {
            top = e.clientY + 10;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    // 生成事件颜色
    generateEventColor(eventName, hour) {
        // 基于事件名称生成基础色调
        let hash = 0;
        for (let i = 0; i < eventName.length; i++) {
            hash = eventName.charCodeAt(i) + ((hash << 5) - hash);
        }

        const baseHue = Math.abs(hash) % 360;

        // 根据小时调整饱和度和亮度，保持莫兰迪色系
        const saturation = 30 + (hour % 4) * 10; // 30-60%
        const lightness = 60 + (hour % 3) * 10;   // 60-80%

        return `hsla(${baseHue}, ${saturation}%, ${lightness}%, 0.8)`;
    }

    // 显示添加事件对话框
    showAddEventDialog(hour) {
        const defaultStartTime = `${hour.toString().padStart(2, '0')}:00`;
        const defaultEndTime = hour === 23 ? '23:59' : `${(hour + 1).toString().padStart(2, '0')}:00`;

        this.showEventDialog(null, {
            date: this.currentDate,
            start_time: defaultStartTime,
            end_time: defaultEndTime,
            event_name: '',
            notes: ''
        });
    }

    // 显示编辑事件对话框
    showEditEventDialog(event) {
        this.showEventDialog(event.id, event);
    }

    // 显示事件对话框
    showEventDialog(eventId, eventData) {
        const isEdit = eventId !== null;
        const dialog = document.createElement('div');
        dialog.className = 'event-dialog-overlay';
        dialog.innerHTML = `
            <div class="event-dialog">
                <h3>${isEdit ? '编辑事件' : '添加事件'}</h3>
                <form id="event-form">
                    <div class="form-group">
                        <label>开始时间:</label>
                        <input type="time" id="start-time" value="${eventData.start_time}" required>
                    </div>
                    <div class="form-group">
                        <label>结束时间:</label>
                        <input type="time" id="end-time" value="${eventData.end_time}" required>
                    </div>
                    <div class="form-group">
                        <label>事件名称:</label>
                        <input type="text" id="event-name" value="${eventData.event_name}" list="event-templates" required>
                        <datalist id="event-templates"></datalist>
                    </div>
                    <div class="form-group">
                        <label>备注:</label>
                        <textarea id="event-notes" rows="3">${eventData.notes || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">取消</button>
                        ${isEdit ? '<button type="button" class="btn-delete">删除</button>' : ''}
                        <button type="submit" class="btn-save">${isEdit ? '保存' : '添加'}</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);
        this.loadEventTemplates();
        this.bindDialogEvents(dialog, eventId);
    }

    // 加载事件模板
    async loadEventTemplates() {
        try {
            const response = await fetch('/api/event-templates');
            const templates = await response.json();
            const datalist = document.getElementById('event-templates');

            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.name;
                datalist.appendChild(option);
            });
        } catch (error) {
            console.error('加载事件模板失败:', error);
        }
    }

    bindDialogEvents(dialog, eventId) {
        const form = dialog.querySelector('#event-form');
        const cancelBtn = dialog.querySelector('.btn-cancel');
        const deleteBtn = dialog.querySelector('.btn-delete');

        // 取消按钮
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        // 删除按钮
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (confirm('确定要删除这个事件吗？')) {
                    await this.deleteEvent(eventId);
                    document.body.removeChild(dialog);
                }
            });
        }

        // 表单提交
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveEvent(eventId, dialog);
        });

        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        });
    }

    // 保存事件
    async saveEvent(eventId, dialog) {
        const formData = {
            date: this.currentDate,
            start_time: document.getElementById('start-time').value,
            end_time: document.getElementById('end-time').value,
            event_name: document.getElementById('event-name').value,
            notes: document.getElementById('event-notes').value
        };

        try {
            const url = eventId ? `/api/events/${eventId}` : '/api/events';
            const method = eventId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // 保存事件名称到模板
                if (formData.event_name) {
                    await this.saveEventTemplate(formData.event_name);
                }

                await this.loadEvents(this.currentDate);
                document.body.removeChild(dialog);
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存事件失败:', error);
            alert('保存失败，请重试');
        }
    }

    // 删除事件
    async deleteEvent(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadEvents(this.currentDate);
            } else {
                throw new Error('删除失败');
            }
        } catch (error) {
            console.error('删除事件失败:', error);
            alert('删除失败，请重试');
        }
    }

    // 保存事件模板
    async saveEventTemplate(name) {
        try {
            await fetch('/api/event-templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });
        } catch (error) {
            // 忽略模板保存错误，不影响主要功能
            console.warn('保存事件模板失败:', error);
        }
    }

    // 工具函数
    parseTime(timeString) {
        const [hour, minute] = timeString.split(':').map(Number);
        return { hour, minute };
    }

    calculateDuration(startTime, endTime) {
        const start = this.parseTime(startTime);
        const end = this.parseTime(endTime);

        let totalMinutes = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute);

        if (totalMinutes < 0) {
            totalMinutes += 24 * 60; // 跨天处理
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
        } else {
            return `${minutes}分钟`;
        }
    }

    showError(message) {
        const container = document.getElementById('hours-container');
        container.innerHTML = `<div class="error">${message}</div>`;
    }

    bindEvents() {
        // 监听页面切换事件
        document.addEventListener('pageChange', (e) => {
            const page = e.detail;
            const container = document.querySelector('.main-container');

            if (page === 'home') {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
    }
}

// 全局小时显示管理器
let hoursDisplayManager;
