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

    // Extract largest embedded JPEG image from PDF binary
    const jpegImages = [];
    for (let i = 0; i < pdfBytes.length - 2; i++) {
      if (pdfBytes[i] === 0xFF && pdfBytes[i+1] === 0xD8 && pdfBytes[i+2] === 0xFF) {
        let end = -1;
        for (let j = i + 2; j < pdfBytes.length - 1; j++) {
          if (pdfBytes[j] === 0xFF && pdfBytes[j+1] === 0xD9) {
            end = j + 2;
            break;
          }
        }
        if (end > i + 5000) {
          jpegImages.push({ start: i, end, size: end - i });
        }
      }
    }

    // Also look for PNG
    const pngImages = [];
    for (let i = 0; i < pdfBytes.length - 8; i++) {
      if (pdfBytes[i] === 0x89 && pdfBytes[i+1] === 0x4E && pdfBytes[i+2] === 0x47 && pdfBytes[i+3] === 0x0D) {
        let end = -1;
        for (let j = i + 8; j < pdfBytes.length - 8; j++) {
          if (pdfBytes[j] === 0x49 && pdfBytes[j+1] === 0x45 && pdfBytes[j+2] === 0x4E && pdfBytes[j+3] === 0x44) {
            end = j + 8;
            break;
          }
        }
        if (end > i + 5000) {
          pngImages.push({ start: i, end, size: end - i });
        }
      }
    }

    // Try to extract URL directly from PDF text stream (URLs are often in plain text in PDF)
    let qr_url = null;
    try {
      const pdfText = new TextDecoder('latin1').decode(pdfBytes);
      // Look for URLs in PDF text/URI actions
      const uriMatches = pdfText.match(/\/URI\s*\(([^)]+)\)/g) || [];
      const urls = uriMatches
        .map(m => m.match(/\/URI\s*\(([^)]+)\)/)?.[1])
        .filter(u => u && u.startsWith('http'));
      
      if (urls.length > 0) {
        // Pick the longest/most specific URL (likely the recipe link, not a logo link)
        qr_url = urls.sort((a, b) => b.length - a.length)[0];
      }

      // Also search for raw https:// URLs in the text
      if (!qr_url) {
        const rawUrls = pdfText.match(/https?:\/\/[^\s)<>"\]]+/g) || [];
        const filtered = rawUrls.filter(u => u.length > 20);
        if (filtered.length > 0) {
          qr_url = filtered.sort((a, b) => b.length - a.length)[0];
        }
      }
    } catch (e) {
      // ignore text extraction errors
    }

    const allImages = [
      ...jpegImages.map(img => ({ ...img, type: 'jpeg', mime: 'image/jpeg' })),
      ...pngImages.map(img => ({ ...img, type: 'png', mime: 'image/png' }))
    ].sort((a, b) => b.size - a.size);

    let image_url = null;

    if (allImages.length > 0) {
      const best = allImages[0];
      const imageBytes = pdfBytes.slice(best.start, best.end);
      const blob = new Blob([imageBytes], { type: best.mime });
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });
      image_url = uploadResult.file_url;
    }

    return Response.json({ 
      image_url,
      qr_url,
      images_found: allImages.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});