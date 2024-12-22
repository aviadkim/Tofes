// public/js/debugSystem.js
class DebugSystem {
    constructor() {
        this.isEnabled = false;
        this.logs = [];
        this.MAX_LOGS = 1000;
        this.startTime = Date.now();
    }

    enable() {
        this.isEnabled = true;
        console.log('[DEBUG] Debug system enabled');
    }

    disable() {
        this.isEnabled = false;
        console.log('[DEBUG] Debug system disabled');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const log = { message, type, timestamp };
        
        this.logs.push(log);
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.shift();
        }

        if (this.isEnabled) {
            const prefix = `[${type.toUpperCase()}]`;
            console.log(`${prefix} ${message}`);
        }
    }

    error(message) {
        this.log(message, 'error');
    }

    warn(message) {
        this.log(message, 'warning');
    }

    info(message) {
        this.log(message, 'info');
    }

    clear() {
        this.logs = [];
        console.clear();
    }

    getLogs() {
        return this.logs;
    }

    getPerformance() {
        return {
            uptime: Date.now() - this.startTime,
            logsCount: this.logs.length
        };
    }
}

// Initialize global instance
window.debugSystem = new DebugSystem();

// public/js/pdfGenerator.js
class PDFGenerator {
    constructor() {
        this.debugMode = false;
        this.debugLogs = [];
        this.screenshots = [];
        
        // PDF Options
        this.defaultOptions = {
            format: 'a4',
            orientation: 'portrait',
            unit: 'mm',
            compress: true
        };
    }

    async generatePDF(elementId, options = {}) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error('Element not found');
            }

            const mergedOptions = { ...this.defaultOptions, ...options };
            
            // Generate canvas from element
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: this.debugMode,
                useCORS: true
            });

            // Create PDF
            const pdf = new jspdf.jsPDF(mergedOptions);
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            if (this.debugMode) {
                this.screenshots.push(imgData);
                this.log('PDF generated successfully');
            }

            return pdf;

        } catch (error) {
            this.log('Error generating PDF: ' + error.message, 'error');
            throw error;
        }
    }

    log(message, type = 'info') {
        const log = {
            timestamp: new Date().toISOString(),
            message,
            type
        };
        
        this.debugLogs.push(log);
        
        if (this.debugMode) {
            console.log(`[PDF ${type.toUpperCase()}] ${message}`);
        }

        // Also log to debug system if available
        if (window.debugSystem) {
            window.debugSystem.log(message, type);
        }
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    clearLogs() {
        this.debugLogs = [];
        this.screenshots = [];
    }
}

// Initialize global instance
window.pdfGenerator = new PDFGenerator();

// public/js/validation.js
class ValidationSystem {
    constructor() {
        this.debugMode = false;
        this.debugLogs = [];
        this.validators = this.initializeValidators();
        this.errorMessages = new Map();
    }

    initializeValidators() {
        return {
            required: (value) => value !== undefined && value !== null && value !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^[0-9]{10}$/.test(value),
            idNumber: (value) => /^[0-9]{9}$/.test(value),
            minLength: (value, min) => value.length >= min,
            maxLength: (value, max) => value.length <= max,
            numeric: (value) => /^[0-9]+$/.test(value),
            amount: (value) => !isNaN(value) && parseFloat(value) > 0
        };
    }

    validate(value, rules) {
        this.errorMessages.clear();
        let isValid = true;

        for (const [rule, params] of Object.entries(rules)) {
            const validator = this.validators[rule];
            if (!validator) {
                this.log(`Unknown validator: ${rule}`, 'error');
                continue;
            }

            const result = validator(value, params);
            if (!result) {
                isValid = false;
                this.addError(rule, value);
            }
        }

        return isValid;
    }

    addError(rule, value) {
        const messages = {
            required: 'שדה חובה',
            email: 'כתובת אימייל לא תקינה',
            phone: 'מספר טלפון לא תקין',
            idNumber: 'מספר תעודת זהות לא תקין',
            minLength: 'אורך מינימלי לא תקין',
            maxLength: 'אורך מקסימלי לא תקין',
            numeric: 'יש להזין מספרים בלבד',
            amount: 'יש להזין סכום חיובי'
        };

        this.errorMessages.set(rule, messages[rule]);
        this.log(`Validation failed: ${rule} for value: ${value}`, 'warning');
    }

    getErrors() {
        return Array.from(this.errorMessages.values());
    }

    log(message, type = 'info') {
        const log = {
            timestamp: new Date().toISOString(),
            message,
            type
        };
        
        this.debugLogs.push(log);
        
        if (this.debugMode) {
            console.log(`[VALIDATION ${type.toUpperCase()}] ${message}`);
        }

        // Also log to debug system if available
        if (window.debugSystem) {
            window.debugSystem.log(message, type);
        }
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    clearLogs() {
        this.debugLogs = [];
    }
}

// Initialize global instance
window.validationSystem = new ValidationSystem();