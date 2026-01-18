# Voice Proxy Server (ElevenLabs)

This proxy keeps the ElevenLabs API key server-side and exposes safe endpoints
for the web client.

## Setup
1. Create `server/.env` with:
   - `ELEVENLABS_API_KEY=your_key`
   - `PORT=8787` (optional)

2. Install deps:
```
npm install
```

3. Run:
```
npm run dev
```

## Endpoints
- `POST /api/voice/tts`
  - Body: `{ "text": "...", "voiceId"?, "modelId"?, "voiceSettings"? }`
  - Returns: `audio/mpeg`

- `POST /api/voice/stt`
  - Body: `{ "audioBase64": "...", "mimeType"?, "modelId"?, "language"? }`
  - Returns: ElevenLabs STT JSON response
