const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

// --- 1. HEAR (Transcription) ---
const transcribeAudio = async (audioBuffer) => {
    try {
        // Converting audio buffer to base64 for the Gemini API
        const base64Audio = audioBuffer.toString('base64');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [
                    { text: "Transcribe this audio accurately. If there is no speech, return an empty string." },
                    { inlineData: { mimeType: "audio/wav", data: base64Audio } }
                ]
            }]
        };

        const response = await axios.post(url, payload);
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("❌ Transcription Error:", error.message);
        return "";
    }
};

// --- 2. THINK (LLM Response) ---
const generateAIResponse = async (userText) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: userText }] }]
        };

        const response = await axios.post(url, payload);
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("❌ LLM Error:", error.message);
        return "I'm sorry, I'm having trouble thinking right now.";
    }
};

// --- 3. SPEAK (Gemini 2.0 Native TTS) ---
const generateAudio = async (text) => {
    try {
        // Using Gemini 2.0 Flash for low-latency native audio generation
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ 
                parts: [{ text: "Please read this naturally: " + text }] 
            }],
            generationConfig: {
                responseModalities: ["AUDIO"], // Native Multimodal Output
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            // Options: "Puck", "Charon", "Kore", "Fenrir", "Aoede"
                            voiceName: "Puck" 
                        }
                    }
                }
            }
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        // The multimodal response returns audio in the inlineData field
        const base64Audio = response.data.candidates[0].content.parts[0].inlineData.data;
        
        // Convert base64 string back to a Buffer for the socket handler
        return Buffer.from(base64Audio, 'base64');

    } catch (error) {
        console.error("❌ Gemini TTS Error:", error.response?.data || error.message);
        return null;
    }
};

module.exports = { transcribeAudio, generateAIResponse, generateAudio };