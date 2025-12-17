const { transcribeAudio } = require('../services/aiService');

// Key: SocketId, Value: Array of Buffers
const activeStreams = new Map();

const handleStream = (io, socket) => {
    
    // 1. Explicit Start
    socket.on('start_stream', () => {
        console.log(`[Stream] Started for user: ${socket.id}`);
        activeStreams.set(socket.id, []);
    });

    // 2. Continuous Audio Accumulation
    socket.on('audio_chunk', (chunk) => {
        let buffer = activeStreams.get(socket.id);
        
        // Robustness Check: Initialize if chunk arrives before 'start_stream'
        if (!buffer) {
            buffer = [];
            activeStreams.set(socket.id, buffer);
        }

        // Convert to Buffer if it arrives as ArrayBuffer or other binary type
        const binaryChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        buffer.push(binaryChunk);
    });

    // 3. Process and Transcribe
    socket.on('end_stream', async () => {
        const chunks = activeStreams.get(socket.id);
        
        if (!chunks || chunks.length === 0) return;

        const completeAudioBuffer = Buffer.concat(chunks);
        
        // Cost Saving: Ignore clips < 1000 bytes (likely background noise or mic pops)
        if (completeAudioBuffer.length < 1000) { 
            console.log(`[Stream] Ignored short audio (${completeAudioBuffer.length} bytes)`);
            activeStreams.set(socket.id, []);
            return; 
        }

        console.log(`[Processing] Transcribing ${completeAudioBuffer.length} bytes for ${socket.id}...`);

        try {
            const text = await transcribeAudio(completeAudioBuffer);

            if (text && text.trim().length > 0) {
                console.log(`🗣️  User ${socket.id}: "${text}"`);
                
                socket.emit('ai_response', {
                    text: `You said: "${text}"`, 
                    audio: null // Placeholder for future TTS
                });
            } else {
                socket.emit('ai_response', {
                    text: "Sorry, I didn't catch that.",
                    audio: null
                });
            }
        } catch (error) {
            console.error("Transcription Error:", error.message);
            socket.emit('ai_response', {
                text: "Something went wrong while processing your voice.",
                audio: null
            });
        }

        // Always clear the buffer after processing
        activeStreams.set(socket.id, []);
    });

    // 4. Cleanup on Disconnect
    socket.on('disconnect', () => {
        activeStreams.delete(socket.id);
    });
};

module.exports = handleStream;