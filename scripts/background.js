// 背景管理器
class BackgroundManager {
    constructor() {
        this.container = document.getElementById('background-container');
        this.currentImageIndex = 0;
        this.images = [];
        this.isMobile = window.innerWidth <= 768;
        this.changeInterval = 30000; // 30秒
        this.intervalId = null;

        this.init();
    }

    init() {
        this.loadBackgroundImages();
        this.startAutoChange();

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            const newIsMobile = window.innerWidth <= 768;
            if (newIsMobile !== this.isMobile) {
                this.isMobile = newIsMobile;
                this.loadBackgroundImages();
            }
        });
    }

    // 加载背景图片列表
    async loadBackgroundImages() {
        const folder = this.isMobile ? 'mobile' : 'pc';
        this.images = [];

        // 假设有17张背景图（根据您的文件结构）
        for (let i = 1; i <= 17; i++) {
            this.images.push(`images/bg/${folder}/bg${i}.png`);
        }

        // 预加载第一张图片
        if (this.images.length > 0) {
            this.preloadImage(this.images[0]);
            this.setBackgroundImage(this.images[0]);
        }

        // 预加载下几张图片
        this.preloadNextImages();
    }

    // 预加载图片
    preloadImage(src) {
        const img = new Image();
        img.src = src;
        return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
    }

    // 预加载接下来的几张图片
    async preloadNextImages() {
        const preloadCount = Math.min(3, this.images.length);
        for (let i = 1; i < preloadCount; i++) {
            const nextIndex = (this.currentImageIndex + i) % this.images.length;
            try {
                await this.preloadImage(this.images[nextIndex]);
            } catch (error) {
                console.warn(`Failed to preload image: ${this.images[nextIndex]}`);
            }
        }
    }

    // 设置背景图片
    setBackgroundImage(src) {
        this.container.style.backgroundImage = `url(${src})`;
    }

    // 切换到下一张背景图片
    async nextBackground() {
        if (this.images.length === 0) return;

        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        const nextImage = this.images[this.currentImageIndex];

        try {
            await this.preloadImage(nextImage);
            this.setBackgroundImage(nextImage);

            // 预加载下一张
            const preloadIndex = (this.currentImageIndex + 1) % this.images.length;
            this.preloadImage(this.images[preloadIndex]).catch(() => {});
        } catch (error) {
            console.warn(`Failed to load background image: ${nextImage}`);
            // 如果加载失败，尝试下一张
            this.nextBackground();
        }
    }

    // 开始自动切换
    startAutoChange() {
        this.stopAutoChange();
        this.intervalId = setInterval(() => {
            this.nextBackground();
        }, this.changeInterval);
    }

    // 停止自动切换
    stopAutoChange() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // 手动切换背景
    changeBackground() {
        this.nextBackground();
        // 重新开始计时
        this.startAutoChange();
    }

    // 销毁
    destroy() {
        this.stopAutoChange();
        window.removeEventListener('resize', this.handleResize);
    }
}

// 初始化背景管理器
document.addEventListener('DOMContentLoaded', () => {
    window.backgroundManager = new BackgroundManager();
});
