import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const { text } = await req.json();
    if (!text) return Response.json({ error: 'No text provided' }, { status: 400 });

    const INWORLD_API_KEY = Deno.env.get('INWORLD_API_KEY');
    if (!INWORLD_API_KEY) return Response.json({ error: 'INWORLD_API_KEY not configured' }, { status: 500 });

    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_~`]/g, '')
      .trim()
      .slice(0, 600);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.inworld.ai/tts/v1/voice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${INWORLD_API_KEY}`
      },
      body: JSON.stringify({
        text: cleanText,
        voiceId: 'default-i-eyv3zmlf9hyqv3c7jmsg__michelle',
        modelId: 'inworld-tts-1'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Inworld TTS failed: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ audioContent: data.audioContent });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});