const axios = require('axios');
const googleTTS = require('google-tts-api'); // <--- Import the backup voice
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

// 1. HEARING (Stable Model)
const transcribeAudio = async (audioBuffer) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;
        const payload = {
            contents: [{
                parts: [
                    { text: "Transcribe this audio exactly. Output only the text." },
                    { inlineData: { mimeType: "audio/wav", data: audioBuffer.toString('base64') } }
                ]
            }]
        };

        const response = await axios.post(url, payload);
        if (response.data.candidates && response.data.candidates[0].content) {
             return response.data.candidates[0].content.parts[0].text;
        }
        return "";
    } catch (error) {
        console.error("❌ Transcription Error:", error.message);
        return null;
    }
};

// 2. THINKING (Stable Model)
const generateAIResponse = async (userText) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;
        
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
        console.error("❌ Thinking Error:", error.message);
        return "Thinking failed.";
    }
};

// 3. SPEAKING (Dual Engine: Gemini High-End -> Fallback to Google Standard)
const generateAudio = async (text) => {
    
    // --- ATTEMPT 1: High Quality (Gemini 2.0) ---
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
        const payload = {
            contents: [{ parts: [{ text: "Read this naturally: " + text }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
            }
        };

        const response = await axios.post(url, payload);
        const base64Audio = response.data.candidates[0].content.parts[0].inlineData.data;
        return Buffer.from(base64Audio, 'base64');

    } catch (error) {
        // If Quota Exceeded (429) or any other error, switch to BACKUP
        console.warn(`⚠️ High-End Voice Failed (${error.response?.status || 'Error'}). Switching to Backup Voice...`);
        return generateBackupAudio(text);
    }
};

// --- BACKUP VOICE FUNCTION (Free, Unlimited) ---
const generateBackupAudio = async (text) => {
    try {
        // generate Base64 string directly
        const base64string = await googleTTS.getAudioBase64(text, {
            lang: 'hi', // 'hi' for Hindi/Hinglish accent, 'en' for standard English
            slow: false,
            host: 'https://translate.google.com',
        });
        return Buffer.from(base64string, 'base64');
    } catch (e) {
        console.error("❌ Backup Audio Failed:", e.message);
        return null;
    }
}

module.exports = { transcribeAudio, generateAIResponse, generateAudio };