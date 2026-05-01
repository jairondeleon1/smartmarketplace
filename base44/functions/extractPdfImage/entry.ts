import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'No file_url provided' }, { status: 400 });

    // Fetch the PDF
    const pdfResponse = await fetch(file_url);
    if (!pdfResponse.ok) throw new Error('Failed to fetch PDF');
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Use pdf.co API to convert PDF page to image
    // We'll use a free approach: convert PDF to PNG via a public API
    // Actually let's use pdf2pic via a different approach - render with canvas
    // Best approach: use PDF.js to render to canvas in a Deno-compatible way
    // Simplest reliable approach: use CloudConvert or similar - but needs API key
    // Let's use the pdfium WASM approach via a fetch to a conversion service

    // Use PDF.co free tier or similar - actually let's use a simpler approach:
    // Extract the raw image bytes embedded in the PDF directly
    // PDFs store images as streams - we can find JPEG/PNG data inside

    const pdfText = new TextDecoder('latin1').decode(pdfBytes);

    // Look for JPEG image data (starts with FFD8FF, ends with FFD9)
    const jpegImages = [];
    for (let i = 0; i < pdfBytes.length - 2; i++) {
      if (pdfBytes[i] === 0xFF && pdfBytes[i+1] === 0xD8 && pdfBytes[i+2] === 0xFF) {
        // Found JPEG start
        let end = -1;
        for (let j = i + 2; j < pdfBytes.length - 1; j++) {
          if (pdfBytes[j] === 0xFF && pdfBytes[j+1] === 0xD9) {
            end = j + 2;
            break;
          }
        }
        if (end > i + 1000) { // At least 1KB to filter out tiny images
          jpegImages.push({ start: i, end, size: end - i });
        }
      }
    }

    // Also look for PNG data (starts with 89504E47)
    const pngImages = [];
    for (let i = 0; i < pdfBytes.length - 8; i++) {
      if (pdfBytes[i] === 0x89 && pdfBytes[i+1] === 0x4E && pdfBytes[i+2] === 0x47 && pdfBytes[i+3] === 0x0D) {
        // Found PNG start - find IEND chunk
        let end = -1;
        for (let j = i + 8; j < pdfBytes.length - 8; j++) {
          // IEND chunk: 00 00 00 00 49 45 4E 44 AE 42 60 82
          if (pdfBytes[j] === 0x49 && pdfBytes[j+1] === 0x45 && pdfBytes[j+2] === 0x4E && pdfBytes[j+3] === 0x44) {
            end = j + 8;
            break;
          }
        }
        if (end > i + 1000) {
          pngImages.push({ start: i, end, size: end - i });
        }
      }
    }

    // Pick the largest image found (most likely the flyer image)
    const allImages = [
      ...jpegImages.map(img => ({ ...img, type: 'jpeg', mime: 'image/jpeg' })),
      ...pngImages.map(img => ({ ...img, type: 'png', mime: 'image/png' }))
    ].sort((a, b) => b.size - a.size);

    if (allImages.length === 0) {
      return Response.json({ image_url: null, message: 'No embedded images found in PDF' });
    }

    // Take the largest image
    const best = allImages[0];
    const imageBytes = pdfBytes.slice(best.start, best.end);

    // Convert to base64
    let binary = '';
    for (let i = 0; i < imageBytes.length; i++) {
      binary += String.fromCharCode(imageBytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${best.mime};base64,${base64}`;

    // Upload as a file via the SDK
    const blob = new Blob([imageBytes], { type: best.mime });
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });

    return Response.json({ 
      image_url: uploadResult.file_url,
      images_found: allImages.length,
      type: best.type
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});