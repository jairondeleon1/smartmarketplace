import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { text } = await req.json();
    if (!text) return Response.json({ error: 'No text provided' }, { status: 400 });

    const INWORLD_API_KEY = Deno.env.get('INWORLD_API_KEY');
    if (!INWORLD_API_KEY) return Response.json({ error: 'INWORLD_API_KEY not configured' }, { status: 500 });

    const VOICE = 'default-i-eyv3zmlf9hyqv3c7jmsg__michelle';
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/#{1,6}\s/g, '').trim().slice(0, 800);

    const res = await fetch('https://studio.api.inworld.ai/v1/ai/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${INWORLD_API_KEY}`
      },
      body: JSON.stringify({
        text: cleanText,
        voiceName: VOICE,
        audioConfig: { audioEncoding: 'MP3' }
      })
    });

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