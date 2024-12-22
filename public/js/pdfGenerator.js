// public/js/pdfGenerator.js
class PDFGenerator {
    constructor() {
        this.debugMode = false;
        this.debugLogs = [];
        this.screenshots = [];
        
        // PDF Options
        this.pdfOptions = {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            compress: true,
            userPassword: null, // אופציונלי - סיסמה לפתיחת PDF
            ownerPassword: null // אופציונלי - סיסמה לעריכת PDF
        };
    }

    async initialize() {
        this.log('Initializing PDF Generator');
        try {
            // בדיקת טעינת הספריות הנדרשות
            if (!window.html2canvas || !window.jsPDF) {
                throw new Error('Required libraries not loaded');
            }
            
            return true;
        } catch (error) {
            this.logError('Initialization failed', error);
            throw error;
        }
    }

    async captureSection(sectionId) {
        this.log(`Capturing section: ${sectionId}`);
        
        try {
            const section = document.getElementById(sectionId);
            if (!section) {
                throw new Error(`Section ${sectionId} not found`);
            }

            // התאמת סטיילינג לצילום
            this.prepareForCapture(section);

            // צילום המסך
            const canvas = await html2canvas(section, {
                scale: 2,
                useCORS: true,
                logging: this.debugMode,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // התאמות נוספות לאלמנט המשוכפל לפני הצילום
                    this.adjustClonedElement(clonedDoc.getElementById(sectionId));
                }
            });

            // שמירת הצילום
            const screenshot = {
                id: sectionId,
                dataUrl: canvas.toDataURL('image/jpeg', 1.0),
                timestamp: new Date().toISOString()
            };
            
            this.screenshots.push(screenshot);
            this.log(`Section ${sectionId} captured successfully`);
            
            return screenshot;

        } catch (error) {
            this.logError(`Failed to capture section ${sectionId}`, error);
            throw error;
        } finally {
            // שחזור סטיילינג מקורי
            this.restoreAfterCapture();
        }
    }

    prepareForCapture(element) {
        // שמירת סטיילינג מקורי
        this._originalStyles = {
            overflow: document.body.style.overflow,
            height: element.style.height,
            display: element.style.display
        };

        // התאמת סטיילינג לצילום
        document.body.style.overflow = 'visible';
        element.style.height = 'auto';
        element.style.display = 'block';
    }

    restoreAfterCapture() {
        if (this._originalStyles) {
            document.body.style.overflow = this._originalStyles.overflow;
        }
    }

    adjustClonedElement(element) {
        if (!element) return;

        // הסרת אלמנטים שלא צריכים להופיע בצילום
        element.querySelectorAll('.no-print, .debug-info').forEach(el => el.remove());

        // התאמת סטיילינג לפני צילום
        element.style.backgroundColor = '#ffffff';
        element.style.margin = '0';
        element.style.padding = '20px';

        // התאמת גודל גופנים לPDF
        element.style.fontSize = '14px';
    }

    async generateFullPDF() {
        this.log('Starting full PDF generation');
        try {
            // צילום כל הסקשנים
            for (let i = 1; i <= 4; i++) {
                await this.captureSection(`section${i}`);
            }

            // יצירת PDF
            const pdf = new jsPDF(this.pdfOptions);
            let currentPage = 1;

            // הוספת כל הצילומים לPDF
            for (const screenshot of this.screenshots) {
                if (currentPage > 1) {
                    pdf.addPage();
                }

                const imgProps = pdf.getImageProperties(screenshot.dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(screenshot.dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                
                // הוספת מספר עמוד
                pdf.setFontSize(10);
                pdf.setTextColor(128, 128, 128);
                pdf.text(`עמוד ${currentPage}`, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 10);
                
                currentPage++;
            }

            this.addMetadata(pdf);
            
            this.log('PDF generated successfully');
            return pdf;

        } catch (error) {
            this.logError('Failed to generate PDF', error);
            throw error;
        } finally {
            this.clearScreenshots();
        }
    }

    addMetadata(pdf) {
        pdf.setProperties({
            title: 'הסכם שיווק השקעות',
            subject: 'טופס הסכם שיווק השקעות חד פעמי',
            author: 'מערכת טפסים',
            keywords: 'הסכם, שיווק השקעות, טופס',
            creator: 'PDF Generator System'
        });
    }

    async generateSignedPDF(formData) {
        this.log('Generating signed PDF');
        try {
            const pdf = await this.generateFullPDF();

            // הוספת תאריך וזמן החתימה
            const timestamp = new Date().toLocaleString('he-IL');
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`נחתם בתאריך: ${timestamp}`, 20, pdf.internal.pageSize.getHeight() - 10);

            // הוספת פרטי החותם
            if (formData.firstName && formData.lastName) {
                pdf.text(`${formData.firstName} ${formData.lastName} :חתימת`, 20, pdf.internal.pageSize.getHeight() - 20);
            }

            return pdf;
        } catch (error) {
            this.logError('Failed to generate signed PDF', error);
            throw error;
        }
    }

    clearScreenshots() {
        this.screenshots = [];
        this.log('Screenshots cleared');
    }

    // Debug Methods
    log(message) {
        const logEntry = `[${new Date().toISOString()}] PDF Generator: ${message}`;
        this.debugLogs.push(logEntry);
        if (this.debugMode) {
            console.log(logEntry);
        }
    }

    logError(message, error) {
        const errorEntry = `[${new Date().toISOString()}] PDF Generator ERROR: ${message} - ${error.message}`;
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
window.pdfGenerator = new PDFGenerator();