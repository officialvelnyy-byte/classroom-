const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

// 1. HEARING (Use Gemini 1.5 Flash - High Stability)
const transcribeAudio = async (audioBuffer) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const payload = {
            contents: [{
                parts: [
                    { text: "Transcribe this audio exactly. Output only the text." },
                    {
                        inlineData: {
                            mimeType: "audio/wav",
                            data: audioBuffer.toString('base64')
                        }
                    }
                ]
            }]
        };

        const response = await axios.post(url, payload);
        return response.data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("❌ Transcription Error:", error.response?.data?.error?.message || error.message);
        return null;
    }
};

// 2. THINKING (Use Gemini 1.5 Flash - Fast & Smart)
const generateAIResponse = async (userText) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const SYSTEM_PROMPT = `
        You are Mentor-JI, a friendly and wise AI tutor from India.
        - Explain things simply in Hinglish (Hindi + English).
        - Keep answers short (max 2 sentences).
        - Be encouraging.
        `;

        const payload = {
            contents: [{
                parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + userText }]
            }]
        };

        const response = await axios.post(url, payload);
        return response.data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("❌ AI Thinking Error:", error.message);
        return "Thinking failed.";
    }
};

// 3. SPEAKING (Use Gemini 2.0 Flash Exp - The ONLY model that speaks)
const generateAudio = async (text) => {
    try {
        // We MUST use 2.0-flash-exp for audio generation
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

        const payload = {
            contents: [{ parts: [{ text: "Read this naturally: " + text }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Puck" 
                        }
                    }
                }
            }
        };

        const response = await axios.post(url, payload);
        const base64Audio = response.data.candidates[0].content.parts[0].inlineData.data;
        return Buffer.from(base64Audio, 'base64');

    } catch (error) {
        // If we hit 429 (Too Many Requests), we just return null so the app doesn't crash
        if (error.response?.status === 429) {
            console.warn("⚠️ Quota Exceeded (429) - Sending text only.");
        } else {
            console.error("❌ Audio Gen Error:", error.message);
        }
        return null;
    }
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };