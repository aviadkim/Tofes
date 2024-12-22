// public/js/debugSystem.js
class DebugSystem {
    constructor() {
        this.isEnabled = false;
        this.logs = [];
        this.MAX_LOGS = 1000;
        this.startTime = Date.now();
        this.components = new Set();
        
        // מאזין למקשי קיצור
        this.setupKeyboardShortcuts();
        // יצירת פאנל דיבוג
        this.createDebugPanel();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + D להפעלת/כיבוי דיבוג
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggleDebug();
            }
            // Ctrl + Shift + L לניקוי לוגים
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                this.clearLogs();
            }
        });
    }

    createDebugPanel() {
        const panel = document.createElement('div');
        panel.className = 'debug-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div class="debug-header">
                <h3>Debug Panel</h3>
                <button class="debug-close">×</button>
            </div>
            <div class="debug-content">
                <div class="debug-controls">
                    <button class="debug-btn" data-action="clear">Clear Logs</button>
                    <button class="debug-btn" data-action="save">Save Logs</button>
                    <button class="debug-btn" data-action="check">System Check</button>
                </div>
                <div class="debug-tabs">
                    <button class="debug-tab active" data-tab="logs">Logs</button>
                    <button class="debug-tab" data-tab="network">Network</button>
                    <button class="debug-tab" data-tab="state">State</button>
                </div>
                <div class="debug-log-container"></div>
                <div class="debug-status"></div>
            </div>
        `;

        // הוספת Event Listeners
        panel.querySelector('.debug-close').addEventListener('click', () => {
            this.hideDebugPanel();
        });

        panel.querySelector('[data-action="clear"]').addEventListener('click', () => {
            this.clearLogs();
        });

        panel.querySelector('[data-action="save"]').addEventListener('click', () => {
            this.saveLogs();
        });

        panel.querySelector('[data-action="check"]').addEventListener('click', () => {
            this.performSystemCheck();
        });

        // מעבר בין טאבים
        panel.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.body.appendChild(panel);
        this.panel = panel;
    }

    toggleDebug() {
        this.isEnabled = !this.isEnabled;
        this.panel.style.display = this.isEnabled ? 'block' : 'none';
        this.log(`Debug mode ${this.isEnabled ? 'enabled' : 'disabled'}`, 'system');
        
        // הוספת/הסרת class לגוף האתר
        document.body.classList.toggle('debug-mode', this.isEnabled);
    }

    log(message, type = 'info', component = 'general') {
        const timestamp = new Date().toISOString();
        const timeSinceStart = Date.now() - this.startTime;
        
        const logEntry = {
            timestamp,
            timeSinceStart,
            type,
            component,
            message,
            stack: new Error().stack
        };

        this.logs.push(logEntry);
        this.components.add(component);

        // שמירה על מספר מקסימלי של לוגים
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.shift();
        }

        if (this.isEnabled) {
            this.updateDebugPanel();
        }

        // שמירה ב-localStorage
        this.saveToLocalStorage();
    }

    error(message, error, component = 'general') {
        const errorDetails = {
            message: error?.message || message,
            stack: error?.stack,
            component
        };

        this.log(`ERROR: ${message}`, 'error', component);
        console.error(errorDetails);
    }

    warn(message, component = 'general') {
        this.log(message, 'warning', component);
    }

    updateDebugPanel() {
        const container = this.panel.querySelector('.debug-log-container');
        if (!container) return;

        const logsHTML = this.logs.map(log => `
            <div class="debug-log-entry ${log.type}">
                <span class="debug-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
                <span class="debug-component">[${log.component}]</span>
                <span class="debug-message">${this.escapeHtml(log.message)}</span>
            </div>
        `).join('');

        container.innerHTML = logsHTML;
        container.scrollTop = container.scrollHeight;
    }

    async performSystemCheck() {
        this.log('Starting system check...', 'system');

        const checks = [
            this.checkLocalStorage(),
            this.checkFirebaseConnection(),
            this.checkNetworkSpeed(),
            this.checkBrowserCompatibility(),
            this.checkMemoryUsage()
        ];

        try {
            const results = await Promise.all(checks);
            this.log('System check completed', 'system');
            this.updateSystemStatus(results);
        } catch (error) {
            this.error('System check failed', error);
        }
    }

    async checkLocalStorage() {
        try {
            const testKey = '_debug_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return { name: 'LocalStorage', status: 'OK' };
        } catch (error) {
            return { name: 'LocalStorage', status: 'Failed', error };
        }
    }

    async checkFirebaseConnection() {
        try {
            if (!window.firebase) {
                throw new Error('Firebase not initialized');
            }
            // בדיקת חיבור לפיירבייס
            const result = await firebase.firestore().collection('test').get();
            return { name: 'Firebase', status: 'Connected' };
        } catch (error) {
            return { name: 'Firebase', status: 'Disconnected', error };
        }
    }

    async checkNetworkSpeed() {
        const startTime = performance.now();
        try {
            await fetch('/ping');
            const endTime = performance.now();
            const latency = endTime - startTime;
            return { name: 'Network', status: `Latency: ${latency.toFixed(2)}ms` };
        } catch (error) {
            return { name: 'Network', status: 'Failed', error };
        }
    }

    checkBrowserCompatibility() {
        const features = {
            localStorage: !!window.localStorage,
            indexedDB: !!window.indexedDB,
            serviceWorker: !!navigator.serviceWorker,
            webGL: !!document.createElement('canvas').getContext('webgl'),
            pointer: !!window.PointerEvent
        };

        return {
            name: 'Browser Compatibility',
            status: Object.entries(features)
                .filter(([, supported]) => !supported)
                .map(([feature]) => feature)
                .join(', ') || 'All features supported'
        };
    }

    checkMemoryUsage() {
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            return {
                name: 'Memory Usage',
                status: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
            };
        }
        return { name: 'Memory Usage', status: 'Not available' };
    }

    updateSystemStatus(results) {
        const statusContainer = this.panel.querySelector('.debug-status');
        if (!statusContainer) return;

        statusContainer.innerHTML = results.map(result => `
            <div class="status-item ${result.status.includes('Failed') ? 'error' : 'success'}">
                <span class="status-name">${result.name}:</span>
                <span class="status-value">${result.status}</span>
            </div>
        `).join('');
    }

    saveLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearLogs() {
        this.logs = [];
        this.updateDebugPanel();
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('debug_logs', JSON.stringify(this.logs.slice(-100)));
        } catch (error) {
            console.error('Failed to save logs to localStorage:', error);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Export the debug system
export const debugSystem = new DebugSystem();
export default debugSystem;