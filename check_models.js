import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve('.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env.local", e);
    process.exit(1);
}

if (!apiKey) {
    console.error("API Key not found in .env.local");
    process.exit(1);
}

console.log("Checking available Gemini models for API Key ending in...", apiKey.slice(-4));

async function checkModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("\nError listing models:", JSON.stringify(data.error, null, 2));
            console.log("\nIf you see a 403 or Permission Denied error, ensure your API key has the Generative Language API enabled in Google Cloud Console.");
        } else if (data.models) {
            console.log("\nAvailable Models:");
            data.models.filter(m => m.name.includes("gemini")).forEach(m => {
                console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
            });
            console.log("\nNote: Only models listed above are accessible to your key.");
        } else {
            console.log("No models returned. API response:", data);
        }
    } catch (err) {
        console.error("Network error:", err);
    }
}

checkModels();
