import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weekMenuUrl, fdaUrl, ingredientsData } = await req.json();

    if (!weekMenuUrl && !fdaUrl && !ingredientsData) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    // Build files array for InvokeLLM
    const filesToProcess = [];
    if (weekMenuUrl) filesToProcess.push(weekMenuUrl);
    if (fdaUrl) filesToProcess.push(fdaUrl);

    // Build prompt - include ingredients CSV data inline if provided
    let combinedPrompt = `You are a nutrition data extraction assistant. I will provide you with up to 3 documents:
1. A weekly menu PDF with dish names, recipe numbers, stations, and days
2. An FDA nutrition report with detailed nutrition facts
${ingredientsData ? '3. A CSV file with ingredients and dietary tags (data provided below)' : ''}

Your task is to extract ALL menu items and combine the data from all sources into a single structured JSON output.

For each menu item, extract:
- name (dish name)
- recipe_number (from menu/FDA)
- station (Grill, Deli, Entree, etc.)
- day (Monday-Friday, Daily Special)
- description (if available)
- calories, protein, carbs, fat, saturated_fat, sodium, fiber, sugar, cholesterol
- vitamin_a, vitamin_c, vitamin_d, calcium, iron, potassium
- ingredients (full list from CSV)
- tags (Vegan, Vegetarian, Fit from CSV)

For values listed as "less than 1g" use 0.5, for "less than 5mg" use 2.

Return as JSON with an "items" array containing ALL menu items found.
${ingredientsData ? `\n\nCSV DATA:\n${ingredientsData.slice(0, 8000)}` : ''}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: combinedPrompt,
      file_urls: filesToProcess,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                recipe_number: { type: 'string' },
                station: { type: 'string' },
                day: { type: 'string' },
                description: { type: 'string' },
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' },
                saturated_fat: { type: 'number' },
                sodium: { type: 'number' },
                fiber: { type: 'number' },
                sugar: { type: 'number' },
                cholesterol: { type: 'number' },
                vitamin_a: { type: 'number' },
                vitamin_c: { type: 'number' },
                vitamin_d: { type: 'number' },
                calcium: { type: 'number' },
                iron: { type: 'number' },
                potassium: { type: 'number' },
                ingredients: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });

    let finalItems = result?.items || [];

    // Normalize stations
    finalItems = finalItems.map(item => ({
      ...item,
      station: normalizeStation(item.station),
      tags: item.tags || []
    }));

    return Response.json({ items: finalItems });
  } catch (error) {
    console.error('Process menu error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function normalizeStation(station) {
  const s = (station || '').toLowerCase().trim();
  if (s.includes('main') || s.includes('comfort') || s.includes('entree')) return 'Entree';
  return station;
}

function normalizeRecipeNum(num) {
  return String(num || '').trim().replace(/^0+/, '').replace(/-.*$/, '').toLowerCase();
}

function normalizeName(name) {
  return String(name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}