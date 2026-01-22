
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API Proxy for DeepSeek (Analysis)
app.post('/api/analyze', async (req, res) => {
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        // Proxy the stream
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        if (response.body) {
            // @ts-ignore
            for await (const chunk of response.body) {
                res.write(chunk);
            }
        }
        res.end();

    } catch (error) {
        console.error('DeepSeek Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Proxy for Zhipu AI (Chat)
app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        // Proxy the stream
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        if (response.body) {
            // @ts-ignore
            for await (const chunk of response.body) {
                res.write(chunk);
            }
        }
        res.end();

    } catch (error) {
        console.error('Zhipu Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`DeepSeek Key configured: ${!!process.env.DEEPSEEK_API_KEY}`);
    console.log(`Zhipu Key configured: ${!!process.env.ZHIPU_API_KEY}`);
});
