// src/services/chatService.js
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

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

module.exports = { generateAIResponse };