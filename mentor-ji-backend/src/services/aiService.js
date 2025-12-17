const fs = require('fs');
const path = require('path');
const os = require('os');
const Groq = require("groq-sdk");
const axios = require('axios'); // Use Axios for ElevenLabs
require('dotenv').config();

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are Mentor-JI, a friendly and wise AI tutor from India.
- Your goal is to explain things simply.
- Keep your answers short and conversational (2-3 sentences max).
- You can use Hinglish (Hindi + English).
- Be encouraging and patient.
`;

// 1. HEARING (Groq/Whisper)
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

// 2. THINKING (Groq/Llama 3)
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

// 3. SPEAKING (ElevenLabs - High Quality Hinglish)
const generateAudio = async (text) => {
    try {
        const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // 'George' - Good standard male voice
        // Or use 'Sarah' (EXAVITQu4vr4xnSDxMaL) for female
        
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${nPczCjzI2devNBz1zQrb}`,
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
            },
            data: {
                text: text,
                model_id: "eleven_turbo_v2_5", // Fastest model for low latency
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            responseType: 'arraybuffer' // Critical for handling binary audio
        });

        return Buffer.from(response.data);

    } catch (error) {
        console.error("❌ ElevenLabs TTS Error:", error.response?.data || error.message);
        return null;
    }
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };