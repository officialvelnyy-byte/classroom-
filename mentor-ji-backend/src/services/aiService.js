const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

// 1. HEARING (Updated to 'gemini-1.5-flash-latest' to fix 404)
const transcribeAudio = async (audioBuffer) => {
    try {
        // Changed model to 'gemini-1.5-flash-latest' which is more stable
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

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
        // Safety check: sometimes the candidate array is empty if audio is silent
        if (response.data.candidates && response.data.candidates[0].content) {
             return response.data.candidates[0].content.parts[0].text;
        }
        return "";

    } catch (error) {
        console.error("❌ Transcription Error:", error.response?.data?.error?.message || error.message);
        return null;
    }
};

// 2. THINKING (Updated to 'gemini-1.5-flash-latest')
const generateAIResponse = async (userText) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
        
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

// 3. SPEAKING (Remains 'gemini-2.0-flash-exp' - Only one that speaks)
const generateAudio = async (text) => {
    try {
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