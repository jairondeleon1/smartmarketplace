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
      const binaryStr = atob(fileBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      file = new File([bytes], fileName || 'upload', { type: mimeType || 'application/octet-stream' });
    }

    const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    if (!result?.file_url) throw new Error('Upload returned no URL');

    // Extract text for CSV only (PDFs will be processed by InvokeLLM directly)
    let extractedText = '';
    if (file.name.endsWith('.csv')) {
      extractedText = await file.text();
    }

    return Response.json({ file_url: result.file_url, text: extractedText });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});