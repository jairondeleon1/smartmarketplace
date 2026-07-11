import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' });

    const body = await req.json().catch(() => ({}));
    const propertyId = String(body.propertyId || '').trim();
    const days = Math.min(Math.max(parseInt(body.days) || 7, 1), 30);
    if (!propertyId) return Response.json({ error: 'propertyId required' });

    // Shared connector — builder's Google Analytics account.
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const iso = (d) => d.toISOString().slice(0, 10);

    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: iso(start), endDate: iso(end) }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'newUsers' },
          { name: 'eventCount' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let gaMessage = errText;
      try {
        const gaErr = JSON.parse(errText);
        gaMessage = gaErr?.error?.message || errText;
      } catch {}
      return Response.json({ error: 'GA API error', details: gaMessage.slice(0, 300) });
    }

    const data = await res.json();
    const rows = data.rows || [];

    const daily = rows.map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0') || 0,
      sessions: parseInt(row.metricValues?.[1]?.value || '0') || 0,
      screenPageViews: parseInt(row.metricValues?.[2]?.value || '0') || 0,
      averageSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0') || 0,
      newUsers: parseInt(row.metricValues?.[4]?.value || '0') || 0,
      eventCount: parseInt(row.metricValues?.[5]?.value || '0') || 0,
    }));

    const totals = {
      activeUsers: daily.reduce((s, d) => s + d.activeUsers, 0),
      sessions: daily.reduce((s, d) => s + d.sessions, 0),
      screenPageViews: daily.reduce((s, d) => s + d.screenPageViews, 0),
      newUsers: daily.reduce((s, d) => s + d.newUsers, 0),
      eventCount: daily.reduce((s, d) => s + d.eventCount, 0),
      avgSessionDuration: daily.length
        ? daily.reduce((s, d) => s + d.averageSessionDuration, 0) / daily.length
        : 0,
    };

    return Response.json({ daily, totals, days });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});