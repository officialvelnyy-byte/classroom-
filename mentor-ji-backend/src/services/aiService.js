const axios = require('axios');
const { Readable } = require('stream');
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- 1. HEAR (Transcription via Groq Whisper) ---
const transcribeAudio = async (audioBuffer) => {
    try {
        // Convert Buffer to a Readable Stream for Groq SDK
        const stream = Readable.from(audioBuffer);
        
        // Note: We provide a filename so the SDK recognizes the format (wav/webm)
        const transcription = await groq.audio.transcriptions.create({
            file: stream,
            file_name: 'speech.wav', 
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: "en",
        });

        return transcription.text;
    } catch (error) {
        console.error("❌ Groq Transcription Error:", error.message);
        return "";
    }
};

// --- 2. THINK (LLM Response via Gemini 2.0) ---
const generateAIResponse = async (userText) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{ parts: [{ text: userText }] }]
        };

        const response = await axios.post(url, payload);
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("❌ Gemini LLM Error:", error.message);
        return "I'm sorry, I'm having trouble thinking right now.";
    }
};

// --- 3. SPEAK (Gemini 2.0 Native TTS) ---
const generateAudio = async (text) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

        const payload = {
            contents: [{ 
                parts: [{ text: "Please read this naturally: " + text }] 
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Puck" // Options: "Puck", "Charon", "Kore", "Fenrir", "Aoede"
                        }
                    }
                }
            }
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const base64Audio = response.data.candidates[0].content.parts[0].inlineData.data;
        return Buffer.from(base64Audio, 'base64');

    } catch (error) {
        console.error("❌ Gemini TTS Error:", error.response?.data || error.message);
        return null;
    }
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };