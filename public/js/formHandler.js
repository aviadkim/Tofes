// public/js/formHandler.js
class FormHandler {
    constructor() {
        console.log('[DEBUG] Initializing FormHandler');
        
        // Initialize state
        this.currentSection = 0;
        this.formData = {};
        this.signatures = {};
        this.sections = document.querySelectorAll('.form-section');
        this.totalSections = this.sections.length;
        
        // Navigation buttons
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.submitBtn = document.getElementById('submitBtn');

        // Initialize components
        this.initializeComponents();
        this.loadSavedData();
        this.setupEventListeners();

        // Show first section
        this.showSection(0);
    }

    async initializeComponents() {
        console.log('[DEBUG] Setting up form components');
        try {
            // Initialize signature system
            this.signatureSystem = new SignatureSystem();
            await this.signatureSystem.initialize();

            // Initialize validation
            this.setupValidation();

            // Initialize autosave
            this.setupAutosave();

            console.log('[DEBUG] Components initialized successfully');
        } catch (error) {
            console.error('[ERROR] Failed to initialize components:', error);
            this.showError('שגיאה באתחול המערכת');
        }
    }

    setupEventListeners() {
        console.log('[DEBUG] Setting up event listeners');

        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prevSection());
        this.nextBtn.addEventListener('click', () => this.nextSection());
        this.submitBtn.addEventListener('click', () => this.submitForm());

        // Form inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', () => this.handleInputChange(input));
            input.addEventListener('blur', () => this.validateField(input));
        });

        // Debug button
        document.getElementById('checkLogsBtn')?.addEventListener('click', () => {
            this.showDebugInfo();
        });
    }

    async handleInputChange(input) {
        console.log(`[DEBUG] Input changed: ${input.name}`);
        
        // Update form data
        this.formData[input.name] = input.value;
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Special handling for specific fields
        if (input.name === 'idNumber') {
            await this.validateIdNumber(input.value);
        }
    }

    validateField(input) {
        const value = input.value;
        const name = input.name;
        let isValid = true;
        let errorMessage = '';

        console.log(`[DEBUG] Validating field: ${name}`);

        switch (name) {
            case 'idNumber':
                isValid = /^\d{9}$/.test(value);
                errorMessage = 'תעודת זהות חייבת להכיל 9 ספרות';
                break;
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                errorMessage = 'כתובת אימייל לא תקינה';
                break;
            case 'phone':
                isValid = /^[0-9]{10}$/.test(value);
                errorMessage = 'מספר טלפון חייב להכיל 10 ספרות';
                break;
            case 'investmentAmount':
                const amount = parseInt(value.replace(/[^\d]/g, ''));
                isValid = amount >= 100000;
                errorMessage = 'סכום ההשקעה המינימלי הוא 100,000 ש"ח';
                break;
        }

        this.toggleFieldError(input, !isValid, errorMessage);
        return isValid;
    }

    toggleFieldError(input, hasError, message = '') {
        const container = input.closest('.input-group');
        if (!container) return;

        const errorDiv = container.querySelector('.error-message') || 
                        document.createElement('div');
        
        if (hasError) {
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            if (!container.querySelector('.error-message')) {
                container.appendChild(errorDiv);
            }
            input.classList.add('invalid');
        } else {
            errorDiv.remove();
            input.classList.remove('invalid');
        }
    }

    async validateSection(sectionIndex) {
        console.log(`[DEBUG] Validating section ${sectionIndex}`);
        
        const section = this.sections[sectionIndex];
        const inputs = section.querySelectorAll('input[required], select[required]');
        let isValid = true;

        // Validate all required fields
        for (const input of inputs) {
            if (!this.validateField(input)) {
                isValid = false;
            }
        }

        // Validate signature if exists
        const signaturePad = section.querySelector('.signature-canvas');
        if (signaturePad && this.signatureSystem.isSignatureEmpty(sectionIndex)) {
            isValid = false;
            this.showError('נדרשת חתימה להמשך');
        }

        return isValid;
    }

    async nextSection() {
        console.log('[DEBUG] Attempting to move to next section');

        if (!await this.validateSection(this.currentSection)) {
            console.log('[DEBUG] Current section validation failed');
            this.showError('יש למלא את כל השדות הנדרשים');
            return;
        }

        if (this.currentSection === 0) {
            try {
                await this.saveSectionOneToFirebase();
            } catch (error) {
                console.error('[ERROR] Failed to save section 1:', error);
                this.showError('שגיאה בשמירת הנתונים');
                return;
            }
        }

        if (this.currentSection < this.totalSections - 1) {
            this.showSection(this.currentSection + 1);
        }
    }

    prevSection() {
        if (this.currentSection > 0) {
            this.showSection(this.currentSection - 1);
        }
    }

    showSection(index) {
        console.log(`[DEBUG] Showing section ${index}`);
        
        // Update sections visibility
        this.sections.forEach((section, i) => {
            section.classList.toggle('active', i === index);
        });

        // Update progress bar
        document.querySelectorAll('.step').forEach((step, i) => {
            step.classList.toggle('active', i <= index);
        });

        // Update navigation buttons
        this.prevBtn.style.display = index === 0 ? 'none' : 'block';
        this.nextBtn.style.display = index === this.totalSections - 1 ? 'none' : 'block';
        this.submitBtn.style.display = index === this.totalSections - 1 ? 'block' : 'none';

        this.currentSection = index;
    }

    async submitForm() {
        console.log('[DEBUG] Starting form submission');
        
        try {
            this.showLoader();

            // Final validation
            if (!await this.validateSection(this.currentSection)) {
                throw new Error('יש למלא את כל השדות הנדרשים');
            }

            // Generate and save PDF
            const pdf = await this.generateFullPDF();
            const submission = await this.saveSubmissionToFirebase(pdf);

            this.showSuccess('הטופס נשלח בהצלחה!');
            this.clearLocalStorage();

            // Redirect to thank you page
            setTimeout(() => {
                window.location.href = `/thank-you.html?ref=${submission.id}`;
            }, 2000);

        } catch (error) {
            console.error('[ERROR] Form submission failed:', error);
            this.showError(error.message || 'שגיאה בשליחת הטופס');
        } finally {
            this.hideLoader();
        }
    }

    showLoader() {
        document.querySelector('.loader').style.display = 'flex';
    }

    hideLoader() {
        document.querySelector('.loader').style.display = 'none';
    }

    showMessage(text, type) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    showError(text) {
        this.showMessage(text, 'error');
    }

    showSuccess(text) {
        this.showMessage(text, 'success');
    }

    showDebugInfo() {
        console.log('[DEBUG] Current form state:', {
            currentSection: this.currentSection,
            formData: this.formData,
            signatures: this.signatures
        });
    }
}

// Initialize form handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Page loaded, initializing form handler');
    window.formHandler = new FormHandler();
});