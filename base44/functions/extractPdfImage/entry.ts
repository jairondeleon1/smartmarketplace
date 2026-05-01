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

    const allImages = [
      ...jpegImages.map(img => ({ ...img, type: 'jpeg', mime: 'image/jpeg' })),
      ...pngImages.map(img => ({ ...img, type: 'png', mime: 'image/png' }))
    ].sort((a, b) => b.size - a.size);

    if (allImages.length === 0) {
      return Response.json({ image_url: null, message: 'No embedded images found' });
    }

    const best = allImages[0];
    const imageBytes = pdfBytes.slice(best.start, best.end);

    // Upload the extracted image using fetch + multipart form
    const formData = new FormData();
    const blob = new Blob([imageBytes], { type: best.mime });
    const ext = best.type === 'jpeg' ? 'jpg' : 'png';
    formData.append('file', blob, `flyer_image.${ext}`);

    // Use the SDK integration to upload
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