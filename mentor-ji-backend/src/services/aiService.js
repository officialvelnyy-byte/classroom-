const axios = require('axios');
const { Readable } = require('stream');
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * 1. HEARING (Transcription)
 * Uses Groq Whisper-large-v3-turbo for industry-leading speed.
 */
const transcribeAudio = async (audioBuffer) => {
    try {
        // Convert Buffer to a Readable Stream for Groq SDK
        const stream = Readable.from(audioBuffer);
        
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
        
        // OPTIONAL FALLBACK: Try Gemini 2.0 if Groq fails
        try {
            console.log("🔄 Attempting Gemini 2.0 Fallback Transcription...");
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
            const payload = {
                contents: [{
                    parts: [
                        { text: "Transcribe this audio exactly. If there is no speech, return an empty string." },
                        { inlineData: { mimeType: "audio/wav", data: audioBuffer.toString('base64') } }
                    ]
                }]
            };
            const response = await axios.post(url, payload);
            return response.data.candidates[0].content.parts[0].text;
        } catch (geminiError) {
            console.error("❌ Gemini Fallback Error:", geminiError.message);
            return null;
        }
    }
};

/**
 * 2. THINKING (LLM Response)
 * Uses Gemini 2.0 Flash for low-latency reasoning.
 */
const generateAIResponse = async (userText) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{ parts: [{ text: userText }] }],
            // Optional: Add system instructions here to keep responses concise for voice
            system_instruction: { parts: [{ text: "You are a helpful voice assistant. Keep answers brief and conversational." }] }
        };

        const response = await axios.post(url, payload);
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("❌ Gemini LLM Error:", error.message);
        return "I'm sorry, I'm having trouble thinking right now.";
    }
};

/**
 * 3. SPEAKING (Gemini 2.0 Native TTS)
 * Converts text back to audio using native multimodal output.
 */
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