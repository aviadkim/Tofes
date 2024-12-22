const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// Middleware setup
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

// Create PDF directory if it doesn't exist
const PDF_DIR = path.join(__dirname, 'pdfs');
if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// PDF save endpoint
app.post("/api/save-pdf", async (req, res) => {
    try {
        console.log("[SERVER] Received PDF save request");
        const { pdfContent, formData } = req.body;
        
        if (!pdfContent) {
            throw new Error("Missing PDF content");
        }

        const timestamp = new Date().getTime();
        const fileName = `form_${formData.idNumber || timestamp}.pdf`;
        const filePath = path.join(PDF_DIR, fileName);

        const base64Data = pdfContent.replace(/^data:application\/pdf;base64,/, "");
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        res.json({
            success: true,
            fileName,
            fileUrl: `/pdfs/${fileName}`
        });
    } catch (error) {
        console.error("[SERVER ERROR]:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
    console.log(`[SERVER] PDF directory: ${PDF_DIR}`);
});