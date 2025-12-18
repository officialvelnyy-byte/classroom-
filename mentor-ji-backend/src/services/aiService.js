// src/services/aiService.js
const { transcribeAudio } = require('./transcribeService');
const { generateAIResponse } = require('./chatService');
const { generateAudio } = require('./voiceService');

// Export them all together so streamHandler doesn't break
module.exports = {
    transcribeAudio,
    generateAIResponse,
    generateAudio
};