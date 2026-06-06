const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Manually parse .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      // Remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

async function testGeminiKey(keyName, keyValue) {
  if (!keyValue) {
    console.log(`[Gemini] ${keyName} is not defined.`);
    return false;
  }
  try {
    const client = new GoogleGenAI({ apiKey: keyValue });
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello, respond with "OK".' }] }]
    });
    console.log(`[Gemini] ${keyName}: SUCCESS (Response: "${response.text.trim()}")`);
    return true;
  } catch (err) {
    console.log(`[Gemini] ${keyName}: FAILED - ${err.message}`);
    return false;
  }
}

async function testNvidiaKey(keyName, keyValue, model) {
  if (!keyValue) {
    console.log(`[NVIDIA] ${keyName} is not defined.`);
    return false;
  }
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keyValue}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: 'Hello, respond with "OK".' }],
        max_tokens: 10
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const json = await response.json();
    console.log(`[NVIDIA] ${keyName}: SUCCESS (Response: "${json.choices[0].message.content.trim()}")`);
    return true;
  } catch (err) {
    console.log(`[NVIDIA] ${keyName} (${model || 'default'}): FAILED - ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing all API keys...\n');
  
  await testGeminiKey('GEMINI_API_KEY_1', process.env.GEMINI_API_KEY_1);
  await testGeminiKey('GEMINI_API_KEY_2', process.env.GEMINI_API_KEY_2);
  await testGeminiKey('GEMINI_API_KEY_3', process.env.GEMINI_API_KEY_3);
  await testGeminiKey('GEMINI_API_KEY_4', process.env.GEMINI_API_KEY_4);
  await testGeminiKey('GEMINI_API_KEY', process.env.GEMINI_API_KEY);
  
  console.log('\n--- Testing NVIDIA Keys ---\n');
  
  await testNvidiaKey('NVIDIA_API_KEY_SEARCH', process.env.NVIDIA_API_KEY_SEARCH, process.env.NVIDIA_MODEL_SEARCH);
  await testNvidiaKey('NVIDIA_API_KEY_ASSISTANT', process.env.NVIDIA_API_KEY_ASSISTANT, process.env.NVIDIA_MODEL_ASSISTANT);
  await testNvidiaKey('NVIDIA_API_KEY_RESUME_IMPORT', process.env.NVIDIA_API_KEY_RESUME_IMPORT, process.env.NVIDIA_MODEL_RESUME_IMPORT);
  await testNvidiaKey('NVIDIA_API_KEY_RESUME_EXPORT', process.env.NVIDIA_API_KEY_RESUME_EXPORT, process.env.NVIDIA_MODEL_RESUME_EXPORT);
  await testNvidiaKey('NVIDIA_API_KEY_REPORT', process.env.NVIDIA_API_KEY_REPORT, process.env.NVIDIA_MODEL_REPORT);
  await testNvidiaKey('NVIDIA_API_KEY', process.env.NVIDIA_API_KEY);
}

main();
