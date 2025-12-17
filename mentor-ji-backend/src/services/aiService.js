const fs = require('fs');
const path = require('path');
const os = require('os');
const Groq = require("groq-sdk");
require('dotenv').config();

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const transcribeAudio = async (audioBuffer) => {
    try {
        // 1. Create a temporary file path
        const tempFilePath = path.join(os.tmpdir(), `input-${Date.now()}.webm`);
        
        // 2. Write buffer to disk (Groq requires a file stream)
        fs.writeFileSync(tempFilePath, audioBuffer);

        // 3. Send to Groq (Whisper Large V3)
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-large-v3", // The best open-source model available
            response_format: "json",
            language: "en", // Optional: Remove to auto-detect language
            temperature: 0.0
        });

        // 4. Cleanup temp file
        fs.unlinkSync(tempFilePath);

        return transcription.text;

    } catch (error) {
        console.error("❌ Groq Transcription Error:", error);
        return null;
    }
};

module.exports = { transcribeAudio };