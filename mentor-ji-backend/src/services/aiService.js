const fs = require('fs');
const path = require('path');
const os = require('os');
const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// 1. Setup Groq for Hearing (Speech-to-Text)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 2. Setup Gemini for Thinking (Text-to-Text)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// System Prompt: This defines who the AI is
const SYSTEM_PROMPT = `
You are Mentor-JI, a friendly and wise AI tutor from India.
- Your goal is to explain things simply.
- Keep your answers short and conversational (2-3 sentences max).
- You can use Hinglish (Hindi + English) if it feels natural.
- Be encouraging and patient.
`;

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
        console.error("❌ Groq Error:", error);
        return null;
    }
};

const generateAIResponse = async (userText) => {
    try {
        // Start a chat session (keeps history automatically if needed, but simple for now)
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Namaste! I am ready to help. What are we learning today?" }],
                },
            ],
        });

        const result = await chat.sendMessage(userText);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("❌ Gemini Brain Error:", error);
        return "I am having some trouble thinking right now. Can you ask again?";
    }
};

module.exports = { transcribeAudio, generateAIResponse };