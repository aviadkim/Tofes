// public/js/accordion.js
class AccordionHandler {
    constructor() {
        console.log('[DEBUG] Initializing Accordion System');
        
        this.accordionItems = document.querySelectorAll('.accordion-item');
        this.initializeAccordions();
    }

    initializeAccordions() {
        console.log('[DEBUG] Setting up accordion listeners');
        
        this.accordionItems.forEach((item, index) => {
            const header = item.querySelector('.accordion-header');
            const content = item.querySelector('.accordion-content');
            
            // שמירת מצב פתוח מה-localStorage
            const isOpen = localStorage.getItem(`accordion_${index}`) === 'true';
            if (isOpen) {
                content.style.maxHeight = content.scrollHeight + "px";
                item.classList.add('open');
            }

            header.addEventListener('click', () => this.toggleAccordion(item, index));
        });
    }

    toggleAccordion(item, index) {
        const content = item.querySelector('.accordion-content');
        const isOpen = item.classList.contains('open');
        
        console.log(`[DEBUG] Toggling accordion ${index}, current state: ${isOpen ? 'open' : 'closed'}`);

        // סגירה/פתיחה של האקורדיון
        if (isOpen) {
            content.style.maxHeight = null;
            item.classList.remove('open');
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
            item.classList.add('open');
        }

        // שמירת המצב ב-localStorage
        localStorage.setItem(`accordion_${index}`, !isOpen);
        
        console.log(`[DEBUG] Accordion ${index} state changed to: ${!isOpen ? 'open' : 'closed'}`);
    }
}

// סגנונות CSS המתאימים
const styles = `
.accordion-item {
    border: 1px solid var(--border-gray);
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
}

.accordion-header {
    background: var(--light-gray);
    padding: 1rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
}

.accordion-header:hover {
    background: var(--primary-light);
}

.accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    padding: 0 1rem;
}

.accordion-item.open .accordion-content {
    padding: 1rem;
}

.accordion-header::after {
    content: '▼';
    font-size: 0.8em;
    transition: transform 0.3s ease;
}

.accordion-item.open .accordion-header::after {
    transform: rotate(180deg);
}
`;

// הוספת הסטיילים לדף
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// אתחול האקורדיון כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Initializing accordion system');
    new AccordionHandler();
});