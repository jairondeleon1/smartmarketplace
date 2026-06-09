import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileBase64, fileName, mimeType } = await req.json();
    if (!fileBase64) return Response.json({ error: 'No file data provided' }, { status: 400 });

    // Convert base64 to File object
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const file = new File([bytes], fileName || 'upload', { type: mimeType || 'application/octet-stream' });

    const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    if (!result?.file_url) throw new Error('Upload returned no URL');

    return Response.json({ file_url: result.file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});