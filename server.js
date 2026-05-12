const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse"); // ✅ correct import

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// multer setup
const upload = multer({ dest: "uploads/" });

// fallback summarizer (always works)
function fallbackSummary(text) {
    const sentences = text.split(". ");
    return sentences.slice(0, 2).join(". ") + ".";
}

//
// 🔹 TEXT SUMMARIZATION
//
app.post("/summarize", async (req, res) => {
    try {
        let { text } = req.body;

        if (!text || text.trim() === "") {
            return res.json({ summary: "Please enter some text." });
        }

        // limit input for API
        text = text.substring(0, 800);

        try {
            const response = await axios.post(
                "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6",
                { inputs: text },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HF_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (Array.isArray(response.data)) {
                return res.json({
                    summary: response.data[0].summary_text
                });
            }

            if (response.data.error) {
                console.log("API message:", response.data.error);
            }

        } catch (err) {
            console.log("API failed, using fallback...");
        }

        // fallback
        return res.json({
            summary: fallbackSummary(text) + "\n\n(Note: Fallback summary)"
        });

    } catch (error) {
        console.log("Unexpected error:", error.message);

        return res.json({
            summary: "Unexpected error occurred."
        });
    }
});

//
// 🔹 PDF UPLOAD + SUMMARIZATION
//
app.post("/upload-pdf", upload.single("file"), async (req, res) => {
    try {
        const filePath = req.file.path;

        const dataBuffer = fs.readFileSync(filePath);

        // ✅ correct usage
        const pdfData = await pdfParse(dataBuffer);

        let text = pdfData.text;

        if (!text || text.trim() === "") {
            fs.unlinkSync(filePath);
            return res.json({
                summary: "No readable text found in PDF."
            });
        }

        text = text.substring(0, 800);

        fs.unlinkSync(filePath);

        const summary = fallbackSummary(text);

        return res.json({
            summary: summary
        });

    } catch (error) {
        console.log("PDF ERROR:", error.message);

        return res.json({
            summary: "Error processing PDF."
        });
    }
});

//
// 🔹 START SERVER
//
app.listen(5000, () => {
    console.log("Server running on port 5000");
});