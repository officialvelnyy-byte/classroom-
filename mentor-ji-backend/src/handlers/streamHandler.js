// Import both AI functions
const { transcribeAudio, generateAIResponse } = require('../services/aiService');

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
        
        // Robustness Check: Initialize if chunk arrives before 'start_stream'
        if (!buffer) {
            buffer = [];
            activeStreams.set(socket.id, buffer);
        }

        const binaryChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        buffer.push(binaryChunk);
    });

    // 3. PROCESS: Hear (Transcribe) -> Think (LLM) -> Respond
    socket.on('end_stream', async () => {
        const chunks = activeStreams.get(socket.id);
        if (!chunks || chunks.length === 0) return;

        const completeAudioBuffer = Buffer.concat(chunks);
        
        // Cost Saving: Ignore tiny clips (< 1KB) like mic pops
        if (completeAudioBuffer.length < 1000) { 
            console.log(`[Stream] Ignored short audio (${completeAudioBuffer.length} bytes)`);
            activeStreams.set(socket.id, []);
            return; 
        }

        try {
            // STEP 1: HEAR (Transcribe Audio to Text)
            console.log(`[Processing] Transcribing ${completeAudioBuffer.length} bytes...`);
            const userText = await transcribeAudio(completeAudioBuffer);

            if (userText && userText.trim().length > 0) {
                console.log(`🗣️  User ${socket.id}: "${userText}"`);
                
                // Send user transcription to UI immediately so they see it
                socket.emit('transcription_update', { role: 'user', text: userText });

                // STEP 2: THINK (Generate AI Response based on text)
                console.log("🤔 AI is thinking...");
                const aiText = await generateAIResponse(userText);
                console.log(`🤖 AI: "${aiText}"`);

                // STEP 3: RESPOND (Send AI Text back to UI)
                socket.emit('ai_response', {
                    text: aiText,
                    audio: null // Ready for TTS implementation next!
                });

            } else {
                socket.emit('error', { message: "Could not understand audio" });
            }
        } catch (error) {
            console.error("Processing Error:", error.message);
            socket.emit('error', { message: "Something went wrong processing your request." });
        }

        // Cleanup buffer for this session
        activeStreams.set(socket.id, []);
    });

    // 4. CLEANUP: Remove user from memory when they leave
    socket.on('disconnect', () => {
        activeStreams.delete(socket.id);
    });
};

module.exports = handleStream;