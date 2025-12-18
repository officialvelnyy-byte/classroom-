// src/services/voiceService.js
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require('fs');
const path = require('path');
const os = require('os');

const generateAudio = async (text) => {
    try {
        const tts = new MsEdgeTTS();
        
        // "en-IN-NeerjaNeural" -> High quality Indian Female Voice
        await tts.setMetadata("en-IN-NeerjaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
        
        const tempFilePath = path.join(os.tmpdir(), `temp_audio_${Date.now()}.webm`);
        await tts.toFile(tempFilePath, text);
        
        const audioBuffer = fs.readFileSync(tempFilePath);
        fs.unlinkSync(tempFilePath); // Cleanup
        
        return audioBuffer;

    } catch (error) {
        console.error("❌ Edge TTS Error:", error.message);
        return null;
    }
};

module.exports = { generateAudio };