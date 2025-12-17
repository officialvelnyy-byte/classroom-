const fs = require('fs');
const path = require('path');
const os = require('os');
const Groq = require('groq-sdk');
require('dotenv').config();

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const transcribeAudio = async (audioBuffer) => {
  try {
    // Use .wav for safer ffmpeg / Groq compatibility
    const tempFilePath = path.join(
      os.tmpdir(),
      `input-${Date.now()}.wav`
    );

    fs.writeFileSync(tempFilePath, audioBuffer);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-large-v3',
      response_format: 'json',
      language: 'en',
    });

    fs.unlinkSync(tempFilePath);

    return transcription.text;
  } catch (error) {
    console.error('❌ Groq Transcription Error:', error);
    return null;
  }
};

module.exports = { transcribeAudio };
