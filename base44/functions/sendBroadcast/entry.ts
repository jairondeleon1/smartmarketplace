import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = user.role || user._app_role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return Response.json({ error: 'Forbidden — admin or manager only' }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, location_id, channels = [], emails = [] } = body;

    if (!title || !message) {
      return Response.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const results = { in_app: null, push: null, email: null };

    // 1. In-App Banner — save Broadcast record
    if (channels.includes('in_app')) {
      try {
        await base44.asServiceRole.entities.Broadcast.create({
          title,
          message,
          location_id: location_id || '',
          channels,
          active: true,
        });
        results.in_app = { success: true };
      } catch (e) {
        results.in_app = { success: false, error: e.message };
      }
    }

    // 2. Push Notification via OneSignal REST API
    if (channels.includes('push')) {
      try {
        const appId = Deno.env.get('ONESIGNAL_APP_ID');
        const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

        if (!appId || !apiKey) {
          results.push = { success: false, error: 'OneSignal credentials not configured' };
        } else {
          const pushResponse = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              app_id: appId,
              included_segments: ['Subscribed Users'],
              headings: { en: title },
              contents: { en: message },
            }),
          });
          const pushData = await pushResponse.json();
          results.push = pushData.id
            ? { success: true, id: pushData.id, recipients: pushData.recipients || 0 }
            : { success: false, error: (pushData.errors && pushData.errors[0]) || 'Unknown OneSignal error' };
        }
      } catch (e) {
        results.push = { success: false, error: e.message };
      }
    }

    // 3. Email — send to each provided address
    if (channels.includes('email') && emails.length > 0) {
      try {
        let sent = 0;
        let failed = 0;
        for (const email of emails) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: email,
              subject: title,
              body: message,
            });
            sent++;
          } catch (_e) {
            failed++;
          }
        }
        results.email = { success: true, sent, failed };
      } catch (e) {
        results.email = { success: false, error: e.message };
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});