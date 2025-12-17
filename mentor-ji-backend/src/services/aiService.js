const fs = require('fs');
const path = require('path');
const os = require('os');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env and Render
});

const transcribeAudio = async (audioBuffer) => {
    try {
        // 1. Create a temporary file path
        // OpenAI requires a file with an extension (e.g., .webm) to know how to decode it
        const tempFilePath = path.join(os.tmpdir(), `input-${Date.now()}.webm`);

        // 2. Write buffer to the temp file
        fs.writeFileSync(tempFilePath, audioBuffer);

        // 3. Send to Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1",
            language: "en", // Optional: Start with 'en', remove if you want auto-detect
        });

        // 4. Clean up (Delete the temp file)
        fs.unlinkSync(tempFilePath);

        return transcription.text;

    } catch (error) {
        console.error("❌ OpenAI Transcription Error:", error);
        return null; // Return null if it failed
    }
};

module.exports = { transcribeAudio };