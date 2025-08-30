// 设置页面管理器
class SettingsManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000'; // 服务器地址
        this.init();
    }

    init() {
        this.createSettingsContainer();
        this.bindEvents();
    }

    createSettingsContainer() {
        // 检查是否已经存在设置容器
        const existingContainer = document.getElementById('settings-container');
        if (existingContainer) {
            return;
        }

        const container = document.createElement('div');
        container.className = 'settings-container';
        container.id = 'settings-container';
        container.style.display = 'none'; // 默认隐藏
        container.innerHTML = `
            <div class="settings-header">
                <h2 class="settings-title">⚙️ 设置</h2>
            </div>

            <div class="settings-content">
                <!-- 导入导出功能 -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <h3 class="settings-card-title">📁 数据导入导出</h3>
                    </div>
                    <div class="settings-card-content">
                        <!-- 导出部分 -->
                        <div class="export-section">
                            <h4>数据导出</h4>
                            <div class="export-options">
                                <div class="date-range-section">
                                    <label>导出范围:</label>
                                    <div class="export-range-controls">
                                        <input type="radio" id="export-all" name="export-range" value="all" checked>
                                        <label for="export-all">全部数据</label>

                                        <input type="radio" id="export-custom" name="export-range" value="custom">
                                        <label for="export-custom">自定义时间段</label>
                                    </div>

                                    <div class="custom-date-range" id="custom-date-range" style="display: none;">
                                        <div class="date-input-group">
                                            <label>开始日期:</label>
                                            <input type="text" id="export-start-date" class="custom-date-input" readonly placeholder="选择开始日期">
                                        </div>
                                        <div class="date-input-group">
                                            <label>结束日期:</label>
                                            <input type="text" id="export-end-date" class="custom-date-input" readonly placeholder="选择结束日期">
                                        </div>
                                    </div>
                                </div>

                                <div class="format-section">
                                    <label>导出格式:</label>
                                    <div class="format-controls">
                                        <input type="radio" id="format-md" name="export-format" value="md" checked>
                                        <label for="format-md">Markdown文件 (.md)</label>

                                        <input type="radio" id="format-json" name="export-format" value="json">
                                        <label for="format-json">JSON文件 (.json)</label>
                                    </div>
                                </div>

                                <div class="filename-section">
                                    <label for="export-filename">文件名:</label>
                                    <input type="text" id="export-filename" placeholder="将根据日期范围自动生成">
                                </div>

                                <button class="export-btn" id="export-data-btn">
                                    <span class="btn-icon">📤</span>
                                    导出数据
                                </button>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <!-- 导入部分 -->
                        <div class="import-section">
                            <h4>数据导入</h4>
                            <div class="import-options">
                                <div class="file-upload-section">
                                    <label for="import-file" class="file-upload-label">
                                        <span class="upload-icon">📁</span>
                                        选择文件导入
                                    </label>
                                    <input type="file" id="import-file" accept=".json,.md" style="display: none;">
                                    <div class="file-info" id="file-info" style="display: none;">
                                        <span id="file-name"></span>
                                        <span id="file-size"></span>
                                    </div>
                                </div>

                                <button class="import-btn" id="import-data-btn" disabled>
                                    <span class="btn-icon">📥</span>
                                    导入数据
                                </button>

                                <div class="import-preview" id="import-preview" style="display: none;">
                                    <h5>导入预览:</h5>
                                    <div class="preview-content" id="preview-content"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 其他设置功能可以在这里添加 -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <h3 class="settings-card-title">🔧 其他设置</h3>
                    </div>
                    <div class="settings-card-content">
                        <p>更多设置功能即将推出...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    bindEvents() {
        // 导出范围选择
        document.querySelectorAll('input[name="export-range"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customDateRange = document.getElementById('custom-date-range');
                if (e.target.value === 'custom') {
                    customDateRange.style.display = 'block';
                } else {
                    customDateRange.style.display = 'none';
                }
                this.updateExportFilename();
            });
        });

        // 自定义日期选择
        document.getElementById('export-start-date').addEventListener('click', () => {
            this.showDatePicker('export-start-date');
        });

        document.getElementById('export-end-date').addEventListener('click', () => {
            this.showDatePicker('export-end-date');
        });

        // 导出格式选择
        document.querySelectorAll('input[name="export-format"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateExportFilename();
            });
        });

        // 导出按钮
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        // 文件选择
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // 导入按钮
        document.getElementById('import-data-btn').addEventListener('click', () => {
            this.importData();
        });
    }

    showDatePicker(inputId) {
        const input = document.getElementById(inputId);
        const currentDate = input.dataset.isoDate ? new Date(input.dataset.isoDate) : new Date();

        const datePicker = new CustomDatePicker(currentDate, (selectedDate) => {
            input.value = this.formatDisplayDate(selectedDate);
            input.dataset.isoDate = this.formatDate(selectedDate);
            this.updateExportFilename();
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

    updateExportFilename() {
        const filenameInput = document.getElementById('export-filename');
        const rangeType = document.querySelector('input[name="export-range"]:checked').value;
        const format = document.querySelector('input[name="export-format"]:checked').value;

        let filename = '';

        if (rangeType === 'all') {
            filename = `daily_record_all.${format}`;
        } else {
            const startDate = document.getElementById('export-start-date').dataset.isoDate;
            const endDate = document.getElementById('export-end-date').dataset.isoDate;

            if (startDate && endDate) {
                filename = `daily_record_${startDate}_to_${endDate}.${format}`;
            } else {
                filename = `daily_record_custom.${format}`;
            }
        }

        filenameInput.placeholder = filename;
    }

    async exportData() {
        try {
            const rangeType = document.querySelector('input[name="export-range"]:checked').value;
            const format = document.querySelector('input[name="export-format"]:checked').value;
            let filename = document.getElementById('export-filename').value;

            let url = `${this.API_BASE_URL}/api/export`;
            const params = new URLSearchParams();

            if (rangeType === 'custom') {
                const startDate = document.getElementById('export-start-date').dataset.isoDate;
                const endDate = document.getElementById('export-end-date').dataset.isoDate;

                if (!startDate || !endDate) {
                    alert('请选择导出的时间范围');
                    return;
                }

                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }

            params.append('format', format);
            url += '?' + params.toString();

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('导出失败');
            }

            // 从响应头获取文件名
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition && !filename) {
                const matches = contentDisposition.match(/filename="([^"]+)"/);
                if (matches) {
                    filename = matches[1];
                }
            }

            // 如果还是没有文件名，使用默认值
            if (!filename) {
                filename = document.getElementById('export-filename').placeholder;
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            alert('导出成功！');
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) {
            document.getElementById('file-info').style.display = 'none';
            document.getElementById('import-data-btn').disabled = true;
            return;
        }

        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        const fileInfo = document.getElementById('file-info');
        const importBtn = document.getElementById('import-data-btn');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileInfo.style.display = 'block';
        importBtn.disabled = false;

        // 预览文件内容
        this.previewFile(file);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    previewFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const preview = document.getElementById('import-preview');
            const previewContent = document.getElementById('preview-content');

            try {
                let events = [];
                if (file.name.endsWith('.json')) {
                    events = JSON.parse(content);
                } else if (file.name.endsWith('.md')) {
                    events = this.parseMarkdownContent(content);
                }

                previewContent.innerHTML = `
                    <p>检测到 ${events.length} 个事件</p>
                    <ul>
                        ${events.slice(0, 5).map(event =>
                            `<li>${event.date} ${event.start_time}-${event.end_time} ${event.event_name}</li>`
                        ).join('')}
                        ${events.length > 5 ? '<li>...</li>' : ''}
                    </ul>
                `;
                preview.style.display = 'block';
            } catch (error) {
                previewContent.innerHTML = '<p style="color: red;">文件格式错误，无法解析</p>';
                preview.style.display = 'block';
            }
        };
        reader.readAsText(file);
    }

    parseMarkdownContent(content) {
        // 简单的Markdown解析，这里需要根据导出格式实现对应的解析逻辑
        // 实际实现会更复杂，这里只是示例
        const events = [];
        const lines = content.split('\n');

        // TODO: 实现Markdown解析逻辑

        return events;
    }

    async importData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];

        if (!file) {
            alert('请先选择文件');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.API_BASE_URL}/api/import`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert(`导入成功！\n新增: ${result.imported} 个事件\n跳过: ${result.skipped} 个重复事件`);
                // 清空文件选择
                fileInput.value = '';
                document.getElementById('file-info').style.display = 'none';
                document.getElementById('import-preview').style.display = 'none';
                document.getElementById('import-data-btn').disabled = true;
            } else {
                throw new Error(result.error || '导入失败');
            }
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
        }
    }
}

// 全局设置管理器实例
let settingsManager;

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}
