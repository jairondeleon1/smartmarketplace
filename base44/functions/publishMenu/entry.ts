import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify user is authenticated with a valid role
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validRoles = ['admin', 'manager', 'dietitian'];
    if (!validRoles.includes(user.role)) {
      return Response.json({ error: `Permission denied: role "${user.role}" cannot publish menus.` }, { status: 403 });
    }

    const { items, location_id } = await req.json();

    if (!location_id) {
      return Response.json({ error: 'location_id is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items)) {
      return Response.json({ error: 'items array is required' }, { status: 400 });
    }

    // Use service role to bypass RLS for delete + create
    const existing = await base44.asServiceRole.entities.MenuItem.filter({ location_id });

    // Delete in batches
    const batchSize = 10;
    for (let i = 0; i < existing.length; i += batchSize) {
      const batch = existing.slice(i, i + batchSize);
      await Promise.all(batch.map(item => base44.asServiceRole.entities.MenuItem.delete(item.id)));
    }

    // Create new items with location_id
    const itemsWithLocation = items.map(({ id, ...rest }) => ({ ...rest, location_id }));
    await base44.asServiceRole.entities.MenuItem.bulkCreate(itemsWithLocation);

    return Response.json({ success: true, count: itemsWithLocation.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});