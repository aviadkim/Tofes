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
            compress: true
        };
    }

    // תפיסת צילום של חלק מסוים
    async captureSection(sectionId) {
        this.log(`Capturing section: ${sectionId}`);
        try {
            const section = document.getElementById(sectionId);
            if (!section) {
                throw new Error(`Section ${sectionId} not found`);
            }

            // התאמת סגנון לצילום
            this.prepareForCapture(section);

            const canvas = await html2canvas(section, {
                scale: 2,
                useCORS: true,
                logging: this.debugMode,
                backgroundColor: '#ffffff'
            });

            // שחזור סגנון מקורי
            this.restoreAfterCapture(section);

            return canvas.toDataURL('image/jpeg', 1.0);
        } catch (error) {
            this.logError(`Failed to capture section ${sectionId}`, error);
            throw error;
        }
    }

    // צילום חלק ראשון ושמירה לפיירבייס
    async captureAndSaveFirstSection(formData) {
        try {
            const imageData = await this.captureSection('section1');
            await this.saveToFirebase(imageData, 'section1', formData);
            return true;
        } catch (error) {
            this.logError('Failed to capture first section', error);
            throw error;
        }
    }

    // צילום הטופס המלא
    async captureFullForm() {
        try {
            const form = document.querySelector('.form-container');
            this.prepareForCapture(form);

            const canvas = await html2canvas(form, {
                scale: 2,
                useCORS: true,
                logging: this.debugMode,
                backgroundColor: '#ffffff'
            });

            this.restoreAfterCapture(form);
            return canvas.toDataURL('image/jpeg', 1.0);
        } catch (error) {
            this.logError('Failed to capture full form', error);
            throw error;
        }
    }

    // שמירה לפיירבייס
    async saveToFirebase(imageData, type, formData) {
        try {
            const timestamp = Date.now();
            const fileName = `forms/${formData.idNumber || timestamp}_${type}.pdf`;
            
            // יצירת PDF
            const pdf = new jsPDF(this.pdfOptions);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imageData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            // הוספת מטא-דאטה
            pdf.setProperties({
                title: `טופס הסכם שיווק השקעות - ${type}`,
                subject: 'טופס הסכם',
                author: 'מערכת טפסים',
                keywords: 'הסכם, שיווק השקעות',
                creator: 'PDF Generator'
            });

            // שמירה לפיירבייס
            const pdfBlob = pdf.output('blob');
            const storageRef = firebase.storage().ref(fileName);
            await storageRef.put(pdfBlob);

            // קבלת URL להורדה
            const downloadURL = await storageRef.getDownloadURL();

            // שמירת הרשומה ב-Firestore
            await firebase.firestore().collection('forms').add({
                type,
                userId: formData.idNumber,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                downloadURL,
                formData
            });

            return downloadURL;
        } catch (error) {
            this.logError('Failed to save to Firebase', error);
            throw error;
        }
    }

    prepareForCapture(element) {
        // שמירת מצב נוכחי
        this._originalStyles = {
            overflow: document.body.style.overflow,
            height: element.style.height,
            position: element.style.position
        };

        // התאמה לצילום
        document.body.style.overflow = 'visible';
        element.style.height = 'auto';
        element.style.position = 'relative';
    }

    restoreAfterCapture(element) {
        // שחזור מצב קודם
        if (this._originalStyles) {
            document.body.style.overflow = this._originalStyles.overflow;
            element.style.height = this._originalStyles.height;
            element.style.position = this._originalStyles.position;
        }
    }

    // Debug methods
    log(message) {
        const logEntry = `[${new Date().toISOString()}] PDF Generator: ${message}`;
        this.debugLogs.push(logEntry);
        if (this.debugMode) console.log(logEntry);
    }

    logError(message, error) {
        const errorEntry = `[${new Date().toISOString()}] PDF Generator ERROR: ${message} - ${error.message}`;
        this.debugLogs.push(errorEntry);
        console.error(errorEntry);
    }

    enableDebug() {
        this.debugMode = true;
        this.log('Debug mode enabled');
    }

    disableDebug() {
        this.debugMode = false;
        this.log('Debug mode disabled');
    }
}

// Initialize global instance
window.pdfGenerator = new PDFGenerator();