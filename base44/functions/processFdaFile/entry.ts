import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fdaUrl } = await req.json();
    if (!fdaUrl) return Response.json({ error: 'No fdaUrl provided' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extract ALL menu items from this FDA nutrition report. For each item extract: name, recipe_number, calories, protein, carbs (total carbohydrate), fat (total fat), saturated_fat, sodium, fiber (dietary fiber), sugar (total sugars), cholesterol, vitamin_a, vitamin_c, vitamin_d, calcium, iron, potassium. Treat "less than 1 gram" as 0.5 and "less than 5 milligrams" as 2. Return as JSON array of all items found.`,
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

    return Response.json({ items: result?.items || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});