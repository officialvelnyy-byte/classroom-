const axios = require('axios');
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

// 1. HEARING (Gemini 1.5 Flash-8B - The "High Speed" Model)
// This model is designed for high-volume tasks like transcription and rarely hits 429s.
const transcribeAudio = async (audioBuffer) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${API_KEY}`;
        
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
        // If 8B fails, try the standard Flash model as backup
        if (error.response?.status === 429 || error.response?.status === 404) {
            console.log("⚠️ 8B Model busy, trying standard Flash...");
            return transcribeAudioBackup(audioBuffer);
        }
        console.error("❌ Transcription Error:", error.message);
        return null;
    }
};

// Backup Transcription (Standard Flash)
const transcribeAudioBackup = async (audioBuffer) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        const payload = {
            contents: [{
                parts: [
                    { text: "Transcribe this audio." },
                    { inlineData: { mimeType: "audio/wav", data: audioBuffer.toString('base64') } }
                ]
            }]
        };
        const response = await axios.post(url, payload);
        return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) { return null; }
};

// 2. THINKING (Gemini 1.5 Flash - Smart & Stable)
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
        console.error("❌ Thinking Error:", error.message);
        return "Thinking failed.";
    }
};

// 3. SPEAKING (Microsoft Edge TTS - Free & Unlimited)
const generateAudio = async (text) => {
    try {
        const tts = new MsEdgeTTS();
        
        // "en-IN-NeerjaNeural" -> Female Indian English (Very Natural)
        // "en-IN-PrabhatNeural" -> Male Indian English
        await tts.setMetadata("en-IN-NeerjaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
        
        // Generate audio to a temporary file
        const tempFilePath = path.join(os.tmpdir(), `temp_audio_${Date.now()}.webm`);
        await tts.toFile(tempFilePath, text);
        
        // Read file to buffer
        const audioBuffer = fs.readFileSync(tempFilePath);
        
        // Cleanup: Delete the temp file
        fs.unlinkSync(tempFilePath);
        
        return audioBuffer;

    } catch (error) {
        console.error("❌ Edge TTS Error:", error.message);
        return null;
    }
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };