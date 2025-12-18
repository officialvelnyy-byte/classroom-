const axios = require('axios');
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

// 1. HEARING (Gemini 1.5 Flash - High Quota)
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

// 2. THINKING (Gemini 1.5 Flash - Smart & Fast)
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

// 3. SPEAKING (Microsoft Edge TTS - Free, Unlimited, Human-like)
const generateAudio = async (text) => {
    try {
        const tts = new MsEdgeTTS();
        
        // "en-IN-NeerjaNeural" is a very high-quality Indian English female voice
        // "en-IN-PrabhatNeural" is the male version. Pick your favorite!
        await tts.setMetadata("en-IN-NeerjaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
        
        // Create a temporary file path
        const tempFilePath = path.join(os.tmpdir(), `temp_audio_${Date.now()}.webm`);
        
        // Generate audio to file
        await tts.toFile(tempFilePath, text);
        
        // Read the file back into a buffer
        const audioBuffer = fs.readFileSync(tempFilePath);
        
        // Clean up the temp file
        fs.unlinkSync(tempFilePath);
        
        return audioBuffer;

    } catch (error) {
        console.error("❌ Edge TTS Error:", error.message);
        return null;
    }
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };