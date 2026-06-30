import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const WT_CLIENT_ID = Deno.env.get('MENUWORKS_WT_CLIENT_ID');
    const wtPreview = WT_CLIENT_ID ? `${WT_CLIENT_ID.slice(0,4)}...${WT_CLIENT_ID.slice(-4)} (len:${WT_CLIENT_ID.length})` : 'NOT SET';

    // Try the simplest possible endpoint first - no options needed
    const url = `https://services.webtrition.com/serviceapi/v3/business_units`;

    const apiRes = await fetch(url, {
      headers: {
        'WT-Client-Id': WT_CLIENT_ID || '',
        'Accept': 'application/json'
      }
    });

    const responseText = await apiRes.text();

    return Response.json({
      url,
      status: apiRes.status,
      wt_client_id_preview: wtPreview,
      response_headers: Object.fromEntries(apiRes.headers.entries()),
      response: responseText.slice(0, 1000)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});