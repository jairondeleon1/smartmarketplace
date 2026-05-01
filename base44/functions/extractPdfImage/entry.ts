import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'No file_url provided' }, { status: 400 });

    // Fetch the PDF bytes
    const pdfResponse = await fetch(file_url);
    if (!pdfResponse.ok) throw new Error('Failed to fetch PDF');
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // --- Extract URL directly from PDF text (most reliable for QR-linked PDFs) ---
    let qr_url = null;
    try {
      const pdfText = new TextDecoder('latin1').decode(pdfBytes);

      // Look for /URI actions (this is where QR code links live in PDFs)
      const uriMatches = [...pdfText.matchAll(/\/URI\s*\(([^)]+)\)/g)];
      const uris = uriMatches
        .map(m => m[1].trim())
        .filter(u => u.startsWith('http'));

      if (uris.length > 0) {
        // Pick the longest URL (most specific = recipe link, not a logo/brand link)
        qr_url = uris.sort((a, b) => b.length - a.length)[0];
      }

      // Also scan for raw https:// text in the PDF stream
      if (!qr_url) {
        const rawUrls = [...pdfText.matchAll(/https?:\/\/[^\s)<>"'\]\\]+/g)]
          .map(m => m[0])
          .filter(u => u.length > 20);
        if (rawUrls.length > 0) {
          qr_url = rawUrls.sort((a, b) => b.length - a.length)[0];
        }
      }
    } catch (_e) {
      // ignore text extraction errors
    }

    // --- Extract largest embedded image (JPEG or PNG) ---
    let image_url = null;
    try {
      const jpegImages = [];
      for (let i = 0; i < pdfBytes.length - 2; i++) {
        if (pdfBytes[i] === 0xFF && pdfBytes[i+1] === 0xD8 && pdfBytes[i+2] === 0xFF) {
          for (let j = i + 2; j < pdfBytes.length - 1; j++) {
            if (pdfBytes[j] === 0xFF && pdfBytes[j+1] === 0xD9) {
              const size = j + 2 - i;
              if (size > 5000) jpegImages.push({ start: i, end: j + 2, size, mime: 'image/jpeg', ext: 'jpg' });
              break;
            }
          }
        }
      }

      const pngImages = [];
      const pngSig = [0x89, 0x4E, 0x47, 0x0D];
      const pngEnd = [0x49, 0x45, 0x4E, 0x44];
      for (let i = 0; i < pdfBytes.length - 8; i++) {
        if (pdfBytes[i] === pngSig[0] && pdfBytes[i+1] === pngSig[1] && pdfBytes[i+2] === pngSig[2] && pdfBytes[i+3] === pngSig[3]) {
          for (let j = i + 8; j < pdfBytes.length - 8; j++) {
            if (pdfBytes[j] === pngEnd[0] && pdfBytes[j+1] === pngEnd[1] && pdfBytes[j+2] === pngEnd[2] && pdfBytes[j+3] === pngEnd[3]) {
              const size = j + 8 - i;
              if (size > 5000) pngImages.push({ start: i, end: j + 8, size, mime: 'image/png', ext: 'png' });
              break;
            }
          }
        }
      }

      const allImages = [...jpegImages, ...pngImages].sort((a, b) => b.size - a.size);

      if (allImages.length > 0) {
        const best = allImages[0];
        const imageBytes = pdfBytes.slice(best.start, best.end);

        // Convert to base64 and upload via multipart form to the Base44 upload endpoint
        const base64 = btoa(String.fromCharCode(...imageBytes));
        const dataUrl = `data:${best.mime};base64,${base64}`;

        // Upload using fetch directly to avoid SDK blob issue
        const appId = Deno.env.get('BASE44_APP_ID');
        const uploadFormData = new FormData();
        const blob = new Blob([imageBytes], { type: best.mime });
        uploadFormData.append('file', blob, `flyer.${best.ext}`);

        const uploadRes = await fetch(`https://api.base44.com/api/apps/${appId}/storage/files`, {
          method: 'POST',
          body: uploadFormData,
          headers: {
            'Authorization': req.headers.get('Authorization') || '',
          }
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          image_url = uploadData.file_url || uploadData.url || null;
        }
      }
    } catch (_e) {
      // ignore image extraction errors
    }

    return Response.json({ image_url, qr_url });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});