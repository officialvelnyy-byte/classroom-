const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Flash 1.5 because it's fast and cheap
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

const transcribeAudio = async (audioBuffer) => {
    try {
        // Convert Buffer to Base64
        const audioBase64 = audioBuffer.toString('base64');

        // Prepare the "Part" for Gemini
        const audioPart = {
            inlineData: {
                data: audioBase64,
                mimeType: "audio/webm" // or "audio/mp3" depending on your frontend
            },
        };

        // Prompt specifically for transcription
        const prompt = "Please transcribe the spoken English/Hinglish in this audio clearly. Do not add any other text.";

        const result = await model.generateContent([prompt, audioPart]);
        const response = await result.response;
        const text = response.text();

        return text;

    } catch (error) {
        console.error("❌ Gemini Transcription Error:", error);
        return null;
    }
};

module.exports = { transcribeAudio };