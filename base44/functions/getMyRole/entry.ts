import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch the authoritative role from the stored User entity using the
    // service role, which bypasses built-in User RLS restrictions. The auth
    // token may carry a stale role set at invite/login time.
    let role = user?._app_role || user?.role || 'user';
    let email = user?.email;
    let userId = user?.id;

    try {
      const records = await base44.asServiceRole.entities.User.list('-created_date', 200);
      const me = records.find(r => r.id === userId || (email && r.email === email));
      if (me) {
        role = me._app_role || me.role || role;
        email = me.email || email;
      }
    } catch (e) {
      console.log('getMyRole: service-role fetch failed', e?.message);
    }

    const allowed = ['admin', 'manager', 'dietitian', 'analyst'].includes(role);
    return Response.json({ role, email, userId, allowed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});