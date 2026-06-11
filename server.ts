import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Read the Firebase projectId to dynamically proxy auth
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseProjectId = '';
try {
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    firebaseProjectId = config.projectId;
  }
} catch (e) {
  console.error('Failed to read firebase config for proxy', e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Firebase Auth Proxy for AI Studio / WebContainers
  if (firebaseProjectId) {
    app.use('/__', createProxyMiddleware({
      target: `https://${firebaseProjectId}.firebaseapp.com`,
      changeOrigin: true,
      secure: true,
    }));
  }

  app.use(express.json());

  // AI Summarization Endpoint
  app.post('/api/ai/summarize', async (req, res) => {
    try {
      const { text, type } = req.body;
      const prompt = `You are a helpful CRM AI assistant. Summarize the following ${type} in 2-3 concise sentences:\n\n${text}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      res.json({ summary: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'AI generation failed' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
