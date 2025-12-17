const fs = require('fs');
const path = require('path');
const os = require('os');
const Groq = require("groq-sdk");
require('dotenv').config();

// Initialize Groq (Used for BOTH Hearing and Thinking)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System Prompt
const SYSTEM_PROMPT = `
You are Mentor-JI, a friendly and wise AI tutor from India.
- Your goal is to explain things simply.
- Keep your answers short and conversational (2-3 sentences max).
- You can use Hinglish (Hindi + English) if it feels natural.
- Be encouraging and patient.
`;

// 1. HEARING (Speech-to-Text)
const transcribeAudio = async (audioBuffer) => {
    try {
        const tempFilePath = path.join(os.tmpdir(), `input-${Date.now()}.wav`);
        fs.writeFileSync(tempFilePath, audioBuffer);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-large-v3",
            response_format: "json",
            language: "en",
        });

        fs.unlinkSync(tempFilePath);
        return transcription.text;
    } catch (error) {
        console.error("❌ Groq Hearing Error:", error);
        return null;
    }
};

// 2. THINKING (Text-to-Text)
const generateAIResponse = async (userText) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userText }
            ],
            // UPDATE THIS LINE: Use the latest stable model
            model: "llama-3.3-70b-versatile", 
            temperature: 0.7,
            max_tokens: 300,
        });

        return completion.choices[0]?.message?.content || "I am speechless!";

    } catch (error) {
        console.error("❌ Groq Brain Error:", error);
        return "I am having trouble thinking right now. Please check my connection.";
    }
};



module.exports = { transcribeAudio, generateAIResponse };