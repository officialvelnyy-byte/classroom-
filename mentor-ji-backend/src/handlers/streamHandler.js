// Import the full AI service suite
const { transcribeAudio, generateAIResponse, generateAudio } = require('../services/aiService');

// Store active buffers for each connected user
const activeStreams = new Map();

const handleStream = (io, socket) => {
    
    // 1. INITIALIZE: Setup buffer when user starts speaking
    socket.on('start_stream', () => {
        console.log(`[Stream] Started for user: ${socket.id}`);
        activeStreams.set(socket.id, []);
    });

    // 2. ACCUMULATE: Receive and store audio chunks
    socket.on('audio_chunk', (chunk) => {
        let buffer = activeStreams.get(socket.id);
        
        // Robustness Check: Auto-initialize if 'start_stream' was missed
        if (!buffer) {
            buffer = [];
            activeStreams.set(socket.id, buffer);
        }

        const binaryChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        buffer.push(binaryChunk);
    });

    // 3. PROCESS: HEAR -> THINK -> SPEAK
    socket.on('end_stream', async () => {
        const chunks = activeStreams.get(socket.id);
        if (!chunks || chunks.length === 0) return;

        const completeAudioBuffer = Buffer.concat(chunks);
        
        // Cost Saving: Ignore tiny clips (< 1KB) like background noise
        if (completeAudioBuffer.length < 1000) { 
            console.log(`[Stream] Ignored short audio (${completeAudioBuffer.length} bytes)`);
            activeStreams.set(socket.id, []);
            return; 
        }

        try {
            // --- STEP 1: HEAR (Transcription) ---
            console.log(`[Processing] Transcribing ${completeAudioBuffer.length} bytes...`);
            const userText = await transcribeAudio(completeAudioBuffer);

            if (userText && userText.trim().length > 0) {
                console.log(`🗣️  User ${socket.id}: "${userText}"`);
                
                // Immediately show the user what they said on the UI
                socket.emit('transcription_update', { role: 'user', text: userText });

                // --- STEP 2: THINK (LLM Response) ---
                console.log("🤔 AI is thinking...");
                const aiText = await generateAIResponse(userText);
                console.log(`🤖 AI Text: "${aiText}"`);

                // --- STEP 3: SPEAK (Text-to-Speech) ---
                console.log("🔊 Generating AI Voice...");
                const audioBuffer = await generateAudio(aiText);

                // Send both the text and the audio (converted to Base64) back to UI
                socket.emit('ai_response', {
                    text: aiText,
                    audio: audioBuffer ? audioBuffer.toString('base64') : null 
                });

                console.log(`✅ Sent Response & Audio (${audioBuffer?.length || 0} bytes)`);

            } else {
                socket.emit('error', { message: "Could not understand audio" });
            }
        } catch (error) {
            console.error("Critical Processing Error:", error.message);
            socket.emit('error', { message: "Something went wrong in the AI pipeline." });
        }

        // Cleanup buffer for the next exchange
        activeStreams.set(socket.id, []);
    });

    // 4. CLEANUP: Prevent memory leaks
    socket.on('disconnect', () => {
        activeStreams.delete(socket.id);
    });
};

module.exports = handleStream;