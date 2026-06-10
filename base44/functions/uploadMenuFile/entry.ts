import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = req.headers.get('content-type') || '';

    let file;
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      file = form.get('file');
      if (!file || typeof file === 'string') {
        return Response.json({ error: 'No file in form data' }, { status: 400 });
      }
    } else {
      const { fileBase64, fileName, mimeType } = await req.json();
      if (!fileBase64) return Response.json({ error: 'No file data provided' }, { status: 400 });
      
      // Handle both raw base64 and data URL format
      const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      file = new File([bytes], fileName || 'upload', { type: mimeType || 'application/octet-stream' });
    }

    const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    if (!result?.file_url) throw new Error('Upload returned no URL');

    // Extract text for CSV and PDF files
    let extractedText = '';
    if (file.name.endsWith('.csv')) {
      extractedText = await file.text();
    } else if (file.name.endsWith('.pdf')) {
      // Extract text from PDF with retry logic
      let extractRes;
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          extractRes = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
            file_url: result.file_url,
            json_schema: {
              type: 'object',
              properties: {
                text: { type: 'string' }
              },
              required: ['text']
            }
          });
          if (extractRes?.status === 'error') {
            throw new Error(extractRes?.details || 'Unknown error');
          }
          break;
        } catch (err) {
          lastError = err.message;
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }
      if (extractRes?.status !== 'error') {
        extractedText = extractRes?.output?.text || (Array.isArray(extractRes?.output) && extractRes.output[0]?.text) || '';
      } else {
        console.error('PDF extraction failed after 3 attempts:', lastError);
      }
    }

    return Response.json({ file_url: result.file_url, text: extractedText });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});