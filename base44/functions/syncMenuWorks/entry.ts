import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'manager', 'dietitian'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const WT_CLIENT_ID = Deno.env.get('MENUWORKS_WT_CLIENT_ID');
    const UNIT_ID = '40442';

    const body = await req.json().catch(() => ({}));
    const locationId = body.location_id || null;

    // Fetch from body params or default to current week
    const bodyStartDate = body.startDate || null;
    const bodyDays = body.days || 7;

    let startDate;
    if (bodyStartDate) {
      startDate = bodyStartDate;
    } else {
      // Default: this Sunday (start of week)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sun
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - dayOfWeek);
      startDate = sunday.toISOString().split('T')[0];
    }

    const options = {
      filter: {
        startDate,
        days: bodyDays,
        ...(locationId ? { locationId: parseInt(locationId) } : {})
      },
      include: {
        allergens: true,
        nutrientTypes: ['Standard'],
        ingredients: false
      },
      page: { offset: 1, limit: 500 }
    };

    const url = `https://services.webtrition.com/serviceapi/v3/business_units/${UNIT_ID}/menu_items?options=${encodeURIComponent(JSON.stringify(options))}`;

    const apiRes = await fetch(url, {
      headers: {
        'WT-Client-Id': WT_CLIENT_ID || '',
        'Accept': 'application/json'
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return Response.json({ error: `MenuWorks API error: ${apiRes.status}`, detail: errText }, { status: 502 });
    }

    const data = await apiRes.json();
    const menuItems = data?.data?.menuItems || [];

    if (menuItems.length === 0) {
      return Response.json({ success: true, synced: 0, message: 'No menu items returned from API' });
    }

    // Helper to extract nutrient value by name keywords
    const getNutrient = (nutrients, ...keywords) => {
      if (!nutrients) return 0;
      const n = nutrients.find(n => keywords.some(k => n.name?.toLowerCase().includes(k.toLowerCase())));
      return n ? parseFloat(n.rawValue || 0) : 0;
    };

    // Map API items to MenuItem entity shape
    const mapped = menuItems.map(item => {
      const mealPeriod = item.itemGroupings?.find(g => g.type === 'MealPeriod')?.name || 'Lunch';
      const station = item.itemGroupings?.find(g => g.type === 'Station')?.name || '';
      const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' }) : '';
      const allergenStr = typeof item.allergens === 'string' ? item.allergens : '';
      const allergenArr = allergenStr ? allergenStr.split(',').map(a => a.trim()).filter(Boolean) : [];
      const nutrients = item.nutrients || [];

      return {
        name: item.name,
        location_id: locationId || String(item.locationId || ''),
        description: item.enticingDescription || '',
        meal_period: ['Breakfast', 'Lunch', 'Dinner', 'All Day'].includes(mealPeriod) ? mealPeriod : 'Lunch',
        station,
        day: dateStr,
        recipe_number: item.mrn || '',
        ingredients: item.ingredientList || '',
        calories: getNutrient(nutrients, 'calorie', 'energy'),
        protein: getNutrient(nutrients, 'protein'),
        carbs: getNutrient(nutrients, 'carbohydrate', 'carb'),
        fat: getNutrient(nutrients, 'total fat', 'fat'),
        saturated_fat: getNutrient(nutrients, 'saturated fat'),
        sodium: getNutrient(nutrients, 'sodium'),
        fiber: getNutrient(nutrients, 'fiber', 'dietary fiber'),
        sugar: getNutrient(nutrients, 'sugar'),
        cholesterol: getNutrient(nutrients, 'cholesterol'),
        allergens: allergenArr,
        tags: []
      };
    });

    // Delete existing items for this location/week then bulk insert
    const deleteQuery = locationId
      ? { location_id: locationId }
      : { location_id: { $exists: true } };

    await base44.asServiceRole.entities.MenuItem.deleteMany(deleteQuery);
    await base44.asServiceRole.entities.MenuItem.bulkCreate(mapped);

    return Response.json({ success: true, synced: mapped.length, startDate, unit_id: UNIT_ID });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});