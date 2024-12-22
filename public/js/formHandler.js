document.addEventListener("DOMContentLoaded", () => {
    console.log("[DEBUG] Initializing form handler");

    const form = document.getElementById("investmentForm");
    const submitButton = document.querySelector(".btn-submit");
    const signatureCanvas = document.getElementById("signatureCanvas");
    const signaturePad = signatureCanvas ? new SignaturePad(signatureCanvas) : null;

    initializeForm(form, submitButton, signaturePad);
});

function initializeForm(form, submitButton, signaturePad) {
    if (!form || !submitButton) {
        console.error("[ERROR] Form or submit button not found");
        return;
    }

    // Handle form submission
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("[DEBUG] Form submission triggered");

        const formData = getFormData(form);

        // Add digital signature if available
        if (signaturePad && !signaturePad.isEmpty()) {
            formData.signature = signaturePad.toDataURL();
        } else {
            alert("Please provide a digital signature before submitting.");
            return;
        }

        const validationResult = validateForm(formData);
        if (!validationResult.isValid) {
            displayValidationErrors(validationResult.errors);
            return;
        }

        submitButton.disabled = true; // Disable button to prevent multiple submissions
        try {
            const response = await submitForm(formData);
            alert("Form submitted successfully!");
            console.log("[DEBUG] Form response:", response);
        } catch (error) {
            console.error("[ERROR] Form submission failed:", error);
            alert("Failed to submit the form. Please try again.");
        } finally {
            submitButton.disabled = false;
        }
    });

    // Autosave feature
    setupAutosave(form);
}

// Extract form data
function getFormData(form) {
    const formData = {};
    const formElements = form.elements;

    Array.from(formElements).forEach((element) => {
        if (element.name) {
            if (element.type === "checkbox") {
                formData[element.name] = formData[element.name] || [];
                if (element.checked) {
                    formData[element.name].push(element.value);
                }
            } else if (element.type === "radio") {
                if (element.checked) {
                    formData[element.name] = element.value;
                }
            } else {
                formData[element.name] = element.value;
            }
        }
    });

    console.log("[DEBUG] Form data extracted:", formData);
    return formData;
}

// Validate the form
function validateForm(formData) {
    const validationRules = {
        fullName: { required: true, minLength: 2 },
        investmentAmount: { required: true, minValue: 100000 },
        bank: { required: true },
        agreementConfirm: { required: true },
        disclosureConfirm: { required: true }
    };

    const errors = [];
    for (const [field, rules] of Object.entries(validationRules)) {
        const value = formData[field];
        if (rules.required && !value) {
            errors.push(`${field} is required.`);
        }
        if (rules.minValue && value < rules.minValue) {
            errors.push(`${field} must be at least ${rules.minValue}.`);
        }
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${field} must be at least ${rules.minLength} characters.`);
        }
    }

    return { isValid: errors.length === 0, errors };
}

// Display validation errors
function displayValidationErrors(errors) {
    console.warn("[DEBUG] Validation errors:", errors);
    alert("The form contains the following errors:\n" + errors.join("\n"));
}

// Submit the form to the server
async function submitForm(formData) {
    const response = await fetch("/api/save-form", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    if (!response.ok) {
        throw new Error("Failed to submit the form");
    }

    return await response.json();
}

// Setup autosave
function setupAutosave(form) {
    const saveIndicator = document.querySelector(".autosave-indicator");
    let saveTimeout;

    form.addEventListener("input", () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const formData = getFormData(form);
            localStorage.setItem("autosaveData", JSON.stringify(formData));
            if (saveIndicator) {
                saveIndicator.querySelector(".save-time").textContent = new Date().toLocaleTimeString();
                saveIndicator.style.display = "block";
            }
        }, 1000);
    });

    const savedData = JSON.parse(localStorage.getItem("autosaveData") || "{}");
    Object.entries(savedData).forEach(([name, value]) => {
        const field = form.elements[name];
        if (!field) return;

        if (field.type === "checkbox" || field.type === "radio") {
            field.checked = value.includes(field.value);
        } else {
            field.value = value;
        }
    });
}

// Debugging tool
function debugFormSubmission(formData) {
    console.table(formData);
}
