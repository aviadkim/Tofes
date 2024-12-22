// public/js/signatureSystem.js
class SignatureSystem {
    constructor() {
        console.log('[DEBUG] Initializing Signature System');
        
        this.signaturePads = {};
        this.initializeAllSignaturePads();
    }

    initializeAllSignaturePads() {
        console.log('[DEBUG] Setting up all signature pads');
        
        // איתור כל אזורי החתימה בדף
        document.querySelectorAll('.signature-pad').forEach((container, index) => {
            this.initializeSignaturePad(container, index);
        });
    }

    initializeSignaturePad(container, index) {
        const canvas = container.querySelector('canvas');
        if (!canvas) {
            console.error(`[ERROR] Canvas not found for signature pad ${index}`);
            return;
        }

        console.log(`[DEBUG] Initializing signature pad ${index}`);

        // יצירת SignaturePad חדש
        this.signaturePads[index] = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });

        // הוספת כפתורי שליטה
        const controls = container.querySelector('.signature-controls');
        if (controls) {
            this.addControlButtons(controls, index);
        }

        // טעינת חתימה שמורה אם קיימת
        const savedSignature = localStorage.getItem(`signature_${index}`);
        if (savedSignature) {
            this.signaturePads[index].fromDataURL(savedSignature);
            console.log(`[DEBUG] Loaded saved signature for pad ${index}`);
        }
    }

    addControlButtons(controls, index) {
        controls.innerHTML = `
            <button type="button" class="btn-clear">נקה חתימה</button>
            <button type="button" class="btn-save">שמור חתימה</button>
            <button type="button" class="btn-load">טען חתימה קודמת</button>
        `;

        const pad = this.signaturePads[index];

        controls.querySelector('.btn-clear').addEventListener('click', () => {
            pad.clear();
            console.log(`[DEBUG] Cleared signature pad ${index}`);
        });

        controls.querySelector('.btn-save').addEventListener('click', () => {
            if (!pad.isEmpty()) {
                const signature = pad.toDataURL();
                localStorage.setItem(`signature_${index}`, signature);
                console.log(`[DEBUG] Saved signature for pad ${index}`);
                this.showMessage('החתימה נשמרה בהצלחה', 'success');
            }
        });

        controls.querySelector('.btn-load').addEventListener('click', () => {
            const savedSignature = localStorage.getItem(`signature_${index}`);
            if (savedSignature) {
                pad.fromDataURL(savedSignature);
                console.log(`[DEBUG] Loaded signature for pad ${index}`);
            }
        });
    }

    // בדיקת תקינות כל החתימות
    validateAllSignatures() {
        console.log('[DEBUG] Validating all signatures');
        
        let allValid = true;
        Object.entries(this.signaturePads).forEach(([index, pad]) => {
            if (pad.isEmpty()) {
                console.log(`[DEBUG] Signature ${index} is missing`);
                allValid = false;
            }
        });
        
        return allValid;
    }

    // קבלת כל החתימות כ-base64
    getAllSignatures() {
        const signatures = {};
        Object.entries(this.signaturePads).forEach(([index, pad]) => {
            if (!pad.isEmpty()) {
                signatures[index] = pad.toDataURL();
            }
        });
        return signatures;
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Initializing signature system');
    window.signatureSystem = new SignatureSystem();
});