// Store active buffers for each connected user
// Key: SocketId, Value: Buffer (Array of bytes)
const activeStreams = new Map();

const handleStream = (io, socket) => {
    
    // 1. Initialize buffer when user connects (or starts speaking)
    socket.on('start_stream', () => {
        console.log(`[Stream] Started for user: ${socket.id}`);
        activeStreams.set(socket.id, []);
    });

    // 2. Receive Audio Chunks
    socket.on('audio_chunk', (chunk) => {
        const buffer = activeStreams.get(socket.id);
        
        if (buffer) {
            // Add the new chunk to our user's specific "bucket"
            // Ensure chunk is a standard Buffer
            const binaryChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            buffer.push(binaryChunk);
            
            // Optional: Log size occasionally (don't log every chunk, it's too noisy)
            // console.log(`Received chunk: ${binaryChunk.length} bytes`);
        } else {
            // If we receive audio but no stream started, initialize it
            activeStreams.set(socket.id, [Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
        }
    });

    // 3. Process Stream (Silence detected or user stopped)
    socket.on('end_stream', async () => {
        console.log(`[Stream] Ended for user: ${socket.id}`);
        
        const chunks = activeStreams.get(socket.id);
        if (!chunks || chunks.length === 0) return;

        // Combine all little chunks into one big audio file (in memory)
        const completeAudioBuffer = Buffer.concat(chunks);
        console.log(`[Processing] Total Audio Size: ${completeAudioBuffer.length} bytes`);

        // --- TODO: SEND TO AI HERE ---
        // For now, we just echo back a text message to prove we got it.
        socket.emit('ai_response', {
            text: `I heard you! received ${completeAudioBuffer.length} bytes of audio.`,
            audio: null // We will send back TTS audio later
        });

        // Clear the buffer for the next sentence
        activeStreams.set(socket.id, []);
    });
};

module.exports = handleStream;