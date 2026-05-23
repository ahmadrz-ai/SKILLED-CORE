const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

// Load .env manually to be safe
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let apiKey = '';
envContent.split('\n').forEach(line => {
    if (line.startsWith('RESEND_API_KEY=')) {
        apiKey = line.split('=')[1].replace(/"/g, '').replace(/'/g, '').trim();
    }
});

console.log('Loaded API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');

if (!apiKey) {
    console.error('RESEND_API_KEY not found in .env');
    process.exit(1);
}

const resend = new Resend(apiKey);

async function testEmail() {
    console.log('Attempting to send email via Resend...');
    try {
        const response = await resend.emails.send({
            from: 'Skilled Core <noreply@skilledcore.com>',
            to: ['ahmadrz.ai@gmail.com'], // The user's email or a test one
            subject: 'Resend Integration Test',
            html: '<h1>Resend Test</h1><p>If you see this, Resend integration is working perfectly!</p>'
        });
        
        console.log('Response:', JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('Caught error sending email:', error);
    }
}

testEmail();
