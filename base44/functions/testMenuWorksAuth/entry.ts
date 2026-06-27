import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const BASE_URL = Deno.env.get('MENUWORKS_BASE_URL');
    const WT_CLIENT_ID = Deno.env.get('MENUWORKS_WT_CLIENT_ID');
    const IBM_CLIENT_ID = Deno.env.get('MENUWORKS_CLIENT_ID');

    // Log what we have (first/last 4 chars only for security)
    const wtPreview = WT_CLIENT_ID ? `${WT_CLIENT_ID.slice(0,4)}...${WT_CLIENT_ID.slice(-4)}` : 'NOT SET';
    const ibmPreview = IBM_CLIENT_ID ? `${IBM_CLIENT_ID.slice(0,4)}...${IBM_CLIENT_ID.slice(-4)}` : 'NOT SET';

    // Try the business_units endpoint
    const url = `${BASE_URL}/business_units`;
    const apiRes = await fetch(url, {
      headers: {
        'X-IBM-Client-Id': IBM_CLIENT_ID,
        'client_id': WT_CLIENT_ID,
        'Accept': 'application/json'
      }
    });

    const responseText = await apiRes.text();

    return Response.json({
      url,
      status: apiRes.status,
      wt_client_id_preview: wtPreview,
      ibm_client_id_preview: ibmPreview,
      response: responseText.slice(0, 500)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});