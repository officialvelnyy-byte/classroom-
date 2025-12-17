const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

// 1. HEARING (Use 'gemini-2.0-flash' - Fast & Available)
const transcribeAudio = async (audioBuffer) => {
    try {
        // Using the model explicitly listed in your account
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

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
        
        if (response.data.candidates && response.data.candidates[0].content) {
             return response.data.candidates[0].content.parts[0].text;
        }
        return "";

    } catch (error) {
        console.error("❌ Transcription Error:", error.response?.data?.error?.message || error.message);
        return null;
    }
};

// 2. THINKING (Use 'gemini-2.0-flash' - Smart & Available)
const generateAIResponse = async (userText) => {
    try {
        // Using the model explicitly listed in your account
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
        
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

// 3. SPEAKING (Use 'gemini-2.0-flash-exp' - Optimized for Audio Generation)
const generateAudio = async (text) => {
    try {
        // Keeping 'exp' for audio generation as it often has better voice synthesis features
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
        if (error.response?.status === 429) {
            console.warn("⚠️ Quota Exceeded (429) - Sending text only.");
        } else {
            console.error("❌ Audio Gen Error:", error.response?.data?.error?.message || error.message);
        }
        return null;
    }
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };