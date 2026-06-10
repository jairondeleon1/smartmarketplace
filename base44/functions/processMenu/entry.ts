import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weekMenuText, fdaText, ingredientsText, allergenText } = await req.json();

    if (!weekMenuText && !fdaText && !ingredientsText && !allergenText) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Helper to call LLM with retry for rate limits
    const callLLMWithRetry = async (prompt, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: false
          });
          return result;
        } catch (err) {
          if (err.message?.includes('rate limit') || err.message?.includes('429')) {
            if (attempt < maxRetries) {
              const delay = 8000 * attempt;
              console.log(`Rate limited, retrying in ${delay/1000}s... (attempt ${attempt}/${maxRetries})`);
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
          }
          throw err;
        }
      }
    };

    let finalItems = [];

    // STEP 1: Parse Week Menu PDF
    if (weekMenuText) {
      const result = await callLLMWithRetry(`Extract ALL menu items from this weekly menu document. For each item extract:
- name (the dish name)
- recipe_number (the number shown in parentheses next to the dish name, e.g. "(12345)")
- station (the station or section it belongs to, e.g. "Entree", "Grill", "Deli", "Pizza", "Soup", "Dessert")
- day (exactly one of: Monday, Tuesday, Wednesday, Thursday, Friday, Daily Special)
- description (any description text if present)

Return as JSON with an "items" array.

Document text:
${weekMenuText.slice(0, 15000)}`);

      if (result?.items?.length > 0) {
        finalItems = result.items.map((item, idx) => ({
          ...item,
          station: (item.station || '').toLowerCase().includes('entree') ? 'Entree' : item.station,
          id: Date.now() + idx
        }));
      }
    } else {
      const existing = await base44.entities.MenuItem.list();
      finalItems = existing.map(item => ({ ...item }));
    }

    await new Promise(r => setTimeout(r, 3000));

    // STEP 2: FDA Nutrition Data
    if (fdaText) {
      const fdaResult = await callLLMWithRetry(`Extract ALL nutrition data from this FDA nutrition report. For each menu item extract:
- name
- recipe_number (the recipe/item number)
- calories (kcal)
- protein (grams)
- carbs (total carbohydrates, grams)
- fat (total fat, grams)
- saturated_fat (grams)
- sodium (milligrams)
- fiber (dietary fiber, grams)
- sugar (total sugars, grams)
- cholesterol (milligrams)
- vitamin_a (mcg or %)
- vitamin_c (mg or %)
- vitamin_d (mcg or %)
- calcium (mg or %)
- iron (mg or %)
- potassium (mg)

For values listed as "less than 1g" use 0.5, for "less than 5mg" use 2.
Return as JSON with an "items" array. Include ALL items found.

Document text:
${fdaText.slice(0, 20000)}`);

      if (fdaResult?.items?.length > 0) {
        const normalizeNum = (num) => String(num || '').trim().replace(/^0+/, '').toLowerCase();
        
        if (finalItems.length === 0) {
          finalItems = fdaResult.items.map((item, idx) => ({
            ...item,
            station: 'Entree',
            day: 'Monday',
            id: Date.now() + idx
          }));
        } else {
          finalItems = finalItems.map(item => {
            const match = fdaResult.items.find(
              fda => normalizeNum(fda.recipe_number) === normalizeNum(item.recipe_number)
            );
            if (match) {
              const totalFat = match.fat || 0;
              const satFat = match.saturated_fat || 0;
              return {
                ...item,
                calories: match.calories || 0,
                protein: match.protein || 0,
                carbs: match.carbs || 0,
                fat: totalFat,
                saturated_fat: satFat,
                unsaturated_fat: totalFat > satFat ? totalFat - satFat : 0,
                sodium: match.sodium || 0,
                fiber: match.fiber || 0,
                sugar: match.sugar || 0,
                cholesterol: match.cholesterol || 0,
                vitamin_a: match.vitamin_a || 0,
                vitamin_c: match.vitamin_c || 0,
                vitamin_d: match.vitamin_d || 0,
                calcium: match.calcium || 0,
                iron: match.iron || 0,
                potassium: match.potassium || 0,
              };
            }
            return item;
          });
        }
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    // STEP 3: Ingredients CSV
    if (ingredientsText && finalItems.length > 0) {
      const ingResult = await callLLMWithRetry(`Parse this CSV file containing menu ingredients. For each row extract:
- recipe_number
- ingredients (the full ingredient list as a string)
- is_vegan (boolean)
- is_vegetarian (boolean)
- is_fit (boolean)

Return ALL rows as JSON with an "items" array.

CSV Data:
${ingredientsText.slice(0, 10000)}`);

      if (ingResult?.items?.length > 0) {
        const normalizeNum = (num) => String(num || '').trim().replace(/^0+/, '').toLowerCase();
        finalItems = finalItems.map(item => {
          const match = ingResult.items.find(
            ing => normalizeNum(ing.recipe_number) === normalizeNum(item.recipe_number)
          );
          if (match && match.ingredients?.length > 5) {
            const extraTags = [];
            if (match.is_vegan) extraTags.push('Vegan');
            if (match.is_vegetarian) extraTags.push('Vegetarian');
            if (match.is_fit) extraTags.push('Fit');
            return {
              ...item,
              ingredients: match.ingredients.trim(),
              tags: [...new Set([...(item.tags || []), ...extraTags])]
            };
          }
          return item;
        });
      }
    }

    // STEP 4: Allergens
    if (allergenText && finalItems.length > 0) {
      await new Promise(r => setTimeout(r, 3000));
      const allergenResult = await callLLMWithRetry(`Extract ALL allergen information from this allergen file. For each item extract:
- recipe_number (the recipe/item number)
- allergens (array of allergens from this list: Milk, Eggs, Fish, Crustacean Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame)

Return as JSON with an "items" array containing recipe_number and allergens for EVERY item found.

Document text:
${allergenText.slice(0, 15000)}`);

      if (allergenResult?.items?.length > 0) {
        const normalizeNum = (num) => String(num || '').trim().replace(/^0+/, '').toLowerCase();
        finalItems = finalItems.map(item => {
          const match = allergenResult.items.find(
            a => normalizeNum(a.recipe_number) === normalizeNum(item.recipe_number)
          );
          if (match && match.allergens && match.allergens.length > 0) {
            return {
              ...item,
              allergens: [...new Set([...(item.allergens || []), ...match.allergens])]
            };
          }
          return item;
        });
      }
    }

    // Remove temp ids before returning
    const cleanItems = finalItems.map(({ id, ...rest }) => rest);
    return Response.json({ items: cleanItems });
  } catch (error) {
    console.error('Process menu error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});