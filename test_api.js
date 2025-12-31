import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config(); // defaults to .env in current dir

const apiKey = process.env.VITE_DEEPSEEK_API_KEY;
console.log("Testing API Key:", apiKey ? "Present" : "Missing");

async function testDeepSeek() {
    try {
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Hello' }],
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("Success:", response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

testDeepSeek();
