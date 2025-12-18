// src/services/transcribeService.js
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

const transcribeAudio = async (audioBuffer) => {
    try {
        // Using 'gemini-flash-latest' (Stable & Fast)
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

module.exports = { transcribeAudio };