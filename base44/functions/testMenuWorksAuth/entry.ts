import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const WT_CLIENT_ID = Deno.env.get('MENUWORKS_WT_CLIENT_ID');
    const UNIT_ID = '40442';

    const wtPreview = WT_CLIENT_ID ? `${WT_CLIENT_ID.slice(0,4)}...${WT_CLIENT_ID.slice(-4)}` : 'NOT SET';

    // Per API spec: base URL is https://services.webtrition.com/serviceapi/
    // Header: WT-Client-Id
    // Menu items endpoint: /v3/business_units/{unitId}/menu_items?options={...}
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const startDate = monday.toISOString().split('T')[0];

    const options = JSON.stringify({
      filter: { startDate, days: 7 },
      include: { nutrientTypes: ['Standard'], allergens: true },
      page: { offset: 1, limit: 5 }
    });

    const url = `https://services.webtrition.com/serviceapi/v3/business_units/${UNIT_ID}/menu_items?options=${encodeURIComponent(options)}`;

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
      response: responseText.slice(0, 1000)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});