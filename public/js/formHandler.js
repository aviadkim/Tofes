// public/js/formHandler.js
class FormHandler {
    constructor() {
        console.log('[DEBUG] Initializing FormHandler');
        
        this.formData = {};
        this.form = document.getElementById('investmentForm');
        this.setupEventListeners();
        this.setupIntersectionObserver();
    }

    setupEventListeners() {
        // טיפול בשליחת טופס
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // שמירה אוטומטית של נתונים בעת שינוי
        this.form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', () => {
                this.updateFormData();
                this.saveToLocalStorage();
            });
        });

        // צילום סקשן 1 כשמסיימים אותו
        document.getElementById('section1').querySelectorAll('input').forEach(input => {
            input.addEventListener('change', async () => {
                if (this.isSection1Complete()) {
                    await this.captureSection1();
                }
            });
        });
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.7
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    const sectionNum = section.id.replace('section', '');
                    this.updateProgress(sectionNum);
                }
            });
        }, options);

        // מעקב אחרי כל הסקשנים
        document.querySelectorAll('.form-section').forEach(section => {
            observer.observe(section);
        });
    }

    updateProgress(sectionNum) {
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = step.dataset.step;
            if (stepNum <= sectionNum) {
                step.classList.add('active');
            }
        });
    }

    updateFormData() {
        const formData = new FormData(this.form);
        this.formData = Object.fromEntries(formData.entries());
    }

    isSection1Complete() {
        const requiredFields = ['firstName', 'lastName', 'idNumber', 'email', 'phone'];
        return requiredFields.every(field => 
            this.formData[field] && this.formData[field].trim() !== ''
        );
    }

    async captureSection1() {
        try {
            console.log('[DEBUG] Capturing section 1');
            await window.pdfGenerator.captureAndSaveFirstSection(this.formData);
            this.showMessage('פרטים ראשוניים נשמרו בהצלחה', 'success');
        } catch (error) {
            console.error('[ERROR] Failed to capture section 1:', error);
            this.showMessage('שגיאה בשמירת פרטים ראשוניים', 'error');
        }
    }

    async handleSubmit() {
        try {
            console.log('[DEBUG] Handling form submission');
            this.updateFormData();

            if (!this.validateForm()) {
                this.showMessage('יש למלא את כל השדות הנדרשים', 'error');
                return;
            }

            this.showLoader();

            // צילום הטופס המלא
            const formImage = await window.pdfGenerator.captureFullForm();
            
            // שמירה בפיירבייס
            const pdfUrl = await window.pdfGenerator.saveToFirebase(
                formImage,
                'complete',
                this.formData
            );

            this.showMessage('הטופס נשלח בהצלחה!', 'success');
            this.clearLocalStorage();

            // הפניה לדף תודה
            setTimeout(() => {
                window.location.href = `/thank-you.html?ref=${encodeURIComponent(pdfUrl)}`;
            }, 2000);

        } catch (error) {
            console.error('[ERROR] Form submission failed:', error);
            this.showMessage('שגיאה בשליחת הטופס', 'error');
        } finally {
            this.hideLoader();
        }
    }

    validateForm() {
        // בדיקת תקינות בסיסית
        return this.form.checkValidity();
    }

    saveToLocalStorage() {
        localStorage.setItem('formData', JSON.stringify(this.formData));
    }

    clearLocalStorage() {
        localStorage.removeItem('formData');
    }

    showLoader() {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    }

    hideLoader() {
        const loader = document.querySelector('.loader');
        if (loader) loader.remove();
    }

    showMessage(text, type) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Initializing form handler');
    window.formHandler = new FormHandler();
});