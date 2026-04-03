import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { fileUrl, station, fileType } = await req.json();
    if (!fileUrl || !station) {
      return Response.json({ error: 'Missing fileUrl or station' }, { status: 400 });
    }

    // Parse the menu PDF using LLM
    let prompt = '';
    let schema = {};

    if (fileType === 'weekMenu') {
      prompt = `Extract EVERY food item from this ${station} station menu document. For each item provide: name (string), recipe_number (string, numeric code in parentheses or empty), description (string, brief description or empty). Return ALL items. Do not skip any.`;
      schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                recipe_number: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      };
    } else if (fileType === 'fda') {
      prompt = `Extract nutrition data for ALL menu items. For each: name, recipe_number, calories, protein, carbs, fat, saturated_fat, sodium, fiber, sugar, cholesterol. Return as JSON.`;
      schema = {
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
                cholesterol: { type: "number" }
              }
            }
          }
        }
      };
    } else if (fileType === 'allergen') {
      prompt = `Extract allergen info for each menu item: recipe_number, allergens (array of strings like Milk, Wheat, Egg, Soy, Shellfish, Peanuts, Tree Nuts), tags (array like Vegetarian, Vegan, Fit, Dairy Free). Return as JSON.`;
      schema = {
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
      };
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [fileUrl],
      response_json_schema: schema,
      model: 'gpt_5_mini'
    });

    return Response.json({ success: true, data: result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});