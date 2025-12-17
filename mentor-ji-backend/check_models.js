const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We need to access the model manager specifically
        // Note: The SDK structure might require accessing the API via a different method
        // but for now, let's try a direct request to the list endpoint if the SDK wrapper is tricky.
        
        console.log("Checking available models for your API Key...");
        
        // Quickest way using the raw fetch to avoid SDK version confusion
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.models) {
            console.log("\n✅ AVAILABLE MODELS:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("❌ Error:", data);
        }

    } catch (error) {
        console.error("Connection Error:", error);
    }
}

listModels();
