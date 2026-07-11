Deno.serve(async (_req) => {
  try {
    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    if (!appId) {
      return Response.json({ error: 'OneSignal App ID not configured' }, { status: 500 });
    }
    // App ID is public-safe (meant for frontend SDK); REST API key stays backend-only
    return Response.json({ appId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});