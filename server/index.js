import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8787;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

if (!ELEVENLABS_API_KEY) {
  console.warn('Missing ELEVENLABS_API_KEY. Voice proxy will fail requests.');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/voice/tts', async (req, res) => {
  try {
    const {
      text,
      voiceId = '21m00Tcm4TlvDq8ikWAM',
      modelId = 'eleven_multilingual_v2',
      voiceSettings,
    } = req.body ?? {};

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY ?? '',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('TTS proxy error', error);
    res.status(500).json({ error: 'TTS proxy failed' });
  }
});

app.post('/api/voice/stt', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      modelId = 'scribe_v1',
      language,
    } = req.body ?? {};

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const fileBlob = new Blob([audioBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', fileBlob, 'audio.webm');
    formData.append('model_id', modelId);
    if (language) formData.append('language', language);

    const response = await fetch(`${ELEVENLABS_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY ?? '',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('STT proxy error', error);
    res.status(500).json({ error: 'STT proxy failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Voice proxy listening on http://localhost:${PORT}`);
});
