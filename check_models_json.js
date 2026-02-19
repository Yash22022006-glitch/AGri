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
    console.error(JSON.stringify({ error: "Could not read .env.local", details: e }));
    process.exit(1);
}

if (!apiKey) {
    console.error(JSON.stringify({ error: "API Key not found" }));
    process.exit(1);
}

async function checkModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        fs.writeFileSync('model_list.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log("Written to model_list.json");
    } catch (err) {
        fs.writeFileSync('model_list.json', JSON.stringify({ error: "Network error", details: err.message }, null, 2), 'utf-8');
    }
}

checkModels();
