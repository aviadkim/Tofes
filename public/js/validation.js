// public/js/validation.js
class ValidationSystem {
    constructor() {
        this.debugMode = false;
        this.debugLogs = [];
        this.validators = this.initializeValidators();
        this.errorMessages = this.initializeErrorMessages();
    }

    initializeValidators() {
        return {
            required: (value) => value !== undefined && value !== null && value.toString().trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^05\d{8}$/.test(value),
            idNumber: (value) => {
                // בדיקת תעודת זהות ישראלית
                if (!/^\d{9}$/.test(value)) return false;
                const digits = value.split('').map(Number);
                let sum = 0;
                
                for (let i = 0; i < 9; i++) {
                    let digit = digits[i];
                    if (i % 2 === 0) {
                        digit *= 1;
                    } else {
                        digit *= 2;
                        if (digit > 9) {
                            digit = digit % 10 + Math.floor(digit / 10);
                        }
                    }
                    sum += digit;
                }
                
                return sum % 10 === 0;
            },
            minValue: (value, min) => {
                const numValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
                return !isNaN(numValue) && numValue >= min;
            },
            maxValue: (value, max) => {
                const numValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
                return !isNaN(numValue) && numValue <= max;
            },
            minLength: (value, length) => value.toString().length >= length,
            maxLength: (value, length) => value.toString().length <= length,
            pattern: (value, pattern) => new RegExp(pattern).test(value),
            custom: (value, validatorFn) => validatorFn(value)
        };
    }

    initializeErrorMessages() {
        return {
            required: 'שדה חובה',
            email: 'כתובת אימייל לא תקינה',
            phone: 'מספר טלפון לא תקין',
            idNumber: 'תעודת זהות לא תקינה',
            minValue: (min) => `הערך המינימלי הוא ${min}`,
            maxValue: (max) => `הערך המקסימלי הוא ${max}`,
            minLength: (length) => `אורך מינימלי הוא ${length} תווים`,
            maxLength: (length) => `אורך מקסימלי הוא ${length} תווים`,
            pattern: 'ערך לא תקין',
            custom: 'ערך לא תקין'
        };
    }

    validateField(fieldName, value, rules) {
        this.log(`Validating field: ${fieldName} with value: ${value}`);
        
        const errors = [];

        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            try {
                const validator = this.validators[ruleName];
                if (!validator) {
                    this.logError(`Unknown validator: ${ruleName}`);
                    continue;
                }

                const isValid = validator(value, ruleValue);
                if (!isValid) {
                    const errorMessage = typeof this.errorMessages[ruleName] === 'function' 
                        ? this.errorMessages[ruleName](ruleValue)
                        : this.errorMessages[ruleName];
                    
                    errors.push(errorMessage);
                    this.log(`Validation failed for ${fieldName}: ${errorMessage}`);
                }
            } catch (error) {
                this.logError(`Validation error for ${fieldName}`, error);
                errors.push('שגיאת מערכת');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateSection(sectionData, sectionRules) {
        this.log(`Validating section with ${Object.keys(sectionData).length} fields`);
        
        const results = {
            isValid: true,
            errors: {}
        };

        for (const [fieldName, rules] of Object.entries(sectionRules)) {
            const value = sectionData[fieldName];
            const fieldValidation = this.validateField(fieldName, value, rules);

            if (!fieldValidation.isValid) {
                results.isValid = false;
                results.errors[fieldName] = fieldValidation.errors;
            }
        }

        this.log(`Section validation ${results.isValid ? 'passed' : 'failed'}`);
        return results;
    }

    validateForm(formData) {
        this.log('Starting full form validation');
        
        const validationRules = {
            section1: {
                firstName: { required: true, minLength: 2 },
                lastName: { required: true, minLength: 2 },
                idNumber: { required: true, idNumber: true },
                email: { required: true, email: true },
                phone: { required: true, phone: true }
            },
            section2: {
                investmentAmount: { required: true, minValue: 100000 },
                bank: { required: true }
            },
            section3: {
                marketExperience: { required: true },
                riskLevel: { required: true }
            },
            section4: {
                acceptTerms: { required: true }
            }
        };

        const results = {
            isValid: true,
            errors: {}
        };

        for (const [section, rules] of Object.entries(validationRules)) {
            const sectionValidation = this.validateSection(formData[section] || {}, rules);
            
            if (!sectionValidation.isValid) {
                results.isValid = false;
                results.errors[section] = sectionValidation.errors;
            }
        }

        this.log(`Form validation ${results.isValid ? 'passed' : 'failed'}`);
        return results;
    }

    log(message) {
        const logEntry = `[${new Date().toISOString()}] Validation: ${message}`;
        this.debugLogs.push(logEntry);
        if (this.debugMode) {
            console.log(logEntry);
        }
    }

    logError(message, error = null) {
        const errorEntry = `[${new Date().toISOString()}] Validation ERROR: ${message} ${error ? '- ' + error.message : ''}`;
        this.debugLogs.push(errorEntry);
        console.error(errorEntry, error);
    }

    enableDebug() {
        this.debugMode = true;
        this.log('Debug mode enabled');
    }

    disableDebug() {
        this.debugMode = false;
        this.log('Debug mode disabled');
    }

    getDebugLogs() {
        return this.debugLogs;
    }
}

// Initialize global instance
window.validationSystem = new ValidationSystem();