const fs = require('fs');
const path = require('path');
const os = require('os');
const Groq = require("groq-sdk");
const { createClient } = require("@deepgram/sdk");
require('dotenv').config();

// Initialize SDKs
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const SYSTEM_PROMPT = `
You are Mentor-JI, a friendly and wise AI tutor from India.
- Your goal is to explain things simply.
- Keep your answers short and conversational (2-3 sentences max).
- You can use Hinglish (Hindi + English) if it feels natural.
- Be encouraging and patient.
`;

// 1. HEARING (STT)
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

// 2. THINKING (LLM)
const generateAIResponse = async (userText) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userText }
            ],
            model: "llama-3.3-70b-versatile", 
            temperature: 0.7,
            max_tokens: 300,
        });
        return completion.choices[0]?.message?.content || "I am speechless!";
    } catch (error) {
        console.error("❌ Groq Brain Error:", error);
        return "Thinking failed.";
    }
};

// 3. SPEAKING (TTS) - NEW!
const generateAudio = async (text) => {
    try {
        const response = await deepgram.speak.request(
            { text },
            {
                model: "aura-asteria-en", // "Asteria" is a friendly female voice. Try "aura-orion-en" for male.
                encoding: "mp3",
            }
        );

        const stream = await response.getStream();
        if (stream) {
            const buffer = await getBufferFromStream(stream);
            return buffer;
        } else {
            console.error("❌ Error generating audio stream");
            return null;
        }
    } catch (error) {
        console.error("❌ TTS Error:", error);
        return null;
    }
};

// Helper to convert stream to buffer
const getBufferFromStream = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };