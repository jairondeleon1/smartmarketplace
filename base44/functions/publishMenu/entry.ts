import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { weekMenuUrl, fdaUrl, allergenUrl, ingredientsCsv, existingItems } = await req.json();

    let finalItems = [];

    // Step 1: Extract week menu
    if (weekMenuUrl) {
      const weekResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract ALL menu items from this document. For each item extract: name, recipe_number (the number in parentheses), station name, day (Monday/Tuesday/Wednesday/Thursday/Friday/Daily Special), and any description if available. Return as JSON array.`,
        file_urls: [weekMenuUrl],
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  recipe_number: { type: "string" },
                  station: { type: "string" },
                  day: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });
      finalItems = (weekResult?.items || []).map((item, idx) => ({ ...item, id: Date.now() + idx }));
    } else {
      finalItems = (existingItems || []).map(item => ({ ...item }));
    }

    // Normalize station names
    const normalizeStation = (station) => {
      const s = (station || '').toLowerCase().trim();
      if (s.includes('main') || s.includes('comfort') || s.includes('entree')) return 'Entree';
      return station;
    };
    finalItems = finalItems.map(item => ({ ...item, station: normalizeStation(item.station) }));

    // Step 2: FDA Nutrition
    if (fdaUrl) {
      const fdaResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract ALL menu items from this FDA nutrition report. For each item extract: name, recipe_number, calories, protein, carbs (total carb), fat (total fat), saturated_fat, sodium, fiber (dietary fiber), sugar (total sugars), cholesterol, vitamin_a, vitamin_c, vitamin_d, calcium, iron, potassium. Treat "less than 1 gram" as 0.5 and "less than 5 milligrams" as 2. Return as JSON.`,
        file_urls: [fdaUrl],
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  recipe_number: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  saturated_fat: { type: "number" },
                  sodium: { type: "number" },
                  fiber: { type: "number" },
                  sugar: { type: "number" },
                  cholesterol: { type: "number" },
                  vitamin_a: { type: "number" },
                  vitamin_c: { type: "number" },
                  vitamin_d: { type: "number" },
                  calcium: { type: "number" },
                  iron: { type: "number" },
                  potassium: { type: "number" }
                }
              }
            }
          }
        }
      });
      if (fdaResult?.items) {
        const nr = (num) => String(num).trim().replace(/^0+/, '').toLowerCase();
        finalItems = finalItems.map(item => {
          const match = fdaResult.items.find(fda => nr(fda.recipe_number || '') === nr(item.recipe_number || ''));
          if (match) {
            const saturatedFat = match.saturated_fat || 0;
            const totalFat = match.fat || 0;
            return {
              ...item,
              calories: match.calories || 0, protein: match.protein || 0, carbs: match.carbs || 0,
              fat: totalFat, saturated_fat: saturatedFat, unsaturated_fat: totalFat > saturatedFat ? totalFat - saturatedFat : 0,
              sodium: match.sodium || 0, fiber: match.fiber || 0, sugar: match.sugar || 0,
              cholesterol: match.cholesterol || 0, vitamin_a: match.vitamin_a || 0, vitamin_c: match.vitamin_c || 0,
              vitamin_d: match.vitamin_d || 0, calcium: match.calcium || 0, iron: match.iron || 0, potassium: match.potassium || 0
            };
          }
          return item;
        });
      }
    }

    // Step 3: Generate descriptions for items missing them (only when we parsed a week menu)
    const needingDescriptions = weekMenuUrl ? finalItems.filter(item => !item.description || item.description.length < 15) : [];
    if (needingDescriptions.length > 0) {
      const descResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate brief, appetizing 1-sentence descriptions (15-25 words each) for these menu items. Return as JSON.\n\nItems:\n${needingDescriptions.map(i => `- ${i.name}`).join('\n')}`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } } }
            }
          }
        }
      });
      if (descResult?.items) {
        finalItems = finalItems.map(item => {
          if (!item.description || item.description.length < 15) {
            const an = item.name.toLowerCase().trim();
            const match = descResult.items.find(d => {
              const bn = d.name.toLowerCase().trim();
              return an.includes(bn) || bn.includes(an) || an.slice(0, 15) === bn.slice(0, 15);
            });
            if (match?.description) return { ...item, description: match.description };
          }
          return item;
        });
      }
    }

    // Step 4: Allergens
    if (allergenUrl) {
      const allergenResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract allergen information from this PDF. For each menu item, extract: recipe_number, allergens (array), and dietary tags (array like Vegetarian, Vegan, Fit, Dairy Free, etc.). Return as structured JSON.`,
        file_urls: [allergenUrl],
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  recipe_number: { type: "string" },
                  allergens: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
      if (allergenResult?.items) {
        const nr = (num) => String(num).trim().replace(/^0+/, '').toLowerCase();
        finalItems = finalItems.map(item => {
          const match = allergenResult.items.find(al => nr(al.recipe_number || '') === nr(item.recipe_number || ''));
          if (match) return { ...item, allergens: match.allergens, tags: match.tags };
          return item;
        });
      }
    }

    // Step 5: Ingredients CSV
    if (ingredientsCsv) {
      const ingResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are parsing a CSV file with menu ingredients. Extract ALL rows. For each row extract: recipe_number, ingredients, is_vegan, is_vegetarian, is_fit. Return ALL rows as JSON.\n\nCSV Data:\n${ingredientsCsv.slice(0, 8000)}`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  recipe_number: { type: "string" },
                  ingredients: { type: "string" },
                  is_vegan: { type: "boolean" },
                  is_vegetarian: { type: "boolean" },
                  is_fit: { type: "boolean" }
                }
              }
            }
          }
        }
      });
      if (ingResult?.items?.length > 0) {
        const nr = (num) => String(num).trim().replace(/^0+/, '');
        finalItems = finalItems.map(item => {
          const match = ingResult.items.find(ing => nr(ing.recipe_number || '') === nr(item.recipe_number || ''));
          if (match?.ingredients?.length > 5) {
            const csvTags = [];
            if (match.is_vegan) csvTags.push('Vegan');
            if (match.is_vegetarian) csvTags.push('Vegetarian');
            if (match.is_fit) csvTags.push('Fit');
            return { ...item, ingredients: match.ingredients.trim(), tags: [...new Set([...(item.tags || []), ...csvTags])] };
          }
          return item;
        });
      }
    }

    // Remove Vegan tag from fried items
    finalItems = finalItems.map(item => {
      if ((item.name?.toLowerCase().includes('fried') || item.description?.toLowerCase().includes('fried')) && item.tags?.includes('Vegan')) {
        return { ...item, tags: item.tags.filter(tag => tag !== 'Vegan') };
      }
      return item;
    });

    // Step 6: Generate missing ingredients (only when we parsed a week menu)
    const needingIngredients = weekMenuUrl ? finalItems.filter(item => !item.ingredients || item.ingredients.length < 5) : [];
    if (needingIngredients.length > 0) {
      const genResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate realistic ingredient lists for these menu items. Return as JSON.\n\nItems:\n${needingIngredients.map(i => `- ${i.name}`).join('\n')}`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "object", properties: { name: { type: "string" }, ingredients: { type: "string" } } }
            }
          }
        }
      });
      if (genResult?.items) {
        finalItems = finalItems.map(item => {
          if (!item.ingredients || item.ingredients.length < 5) {
            const an = item.name.toLowerCase().trim();
            const match = genResult.items.find(i => {
              const bn = i.name.toLowerCase().trim();
              return an.includes(bn) || bn.includes(an) || an.slice(0, 15) === bn.slice(0, 15);
            });
            if (match?.ingredients) return { ...item, ingredients: match.ingredients };
          }
          return item;
        });
      }
    }

    // Save to database
    const existing = await base44.asServiceRole.entities.MenuItem.list();
    for (let i = 0; i < existing.length; i += 10) {
      const batch = existing.slice(i, i + 10);
      await Promise.all(batch.map(item => base44.asServiceRole.entities.MenuItem.delete(item.id)));
    }
    await base44.asServiceRole.entities.MenuItem.bulkCreate(finalItems);

    return Response.json({ success: true, count: finalItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});