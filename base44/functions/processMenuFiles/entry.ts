import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { step, payload } = await req.json();

    // Step: extract week menu items from PDF
    if (step === 'weekMenu') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract ALL menu items from this document. For each item extract: name, recipe_number (the number in parentheses), station name, day (Monday/Tuesday/Wednesday/Thursday/Friday/Daily Special), and any description if available. Return as JSON array.`,
        file_urls: [payload.fileUrl],
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
      return Response.json({ items: result?.items || [] });
    }

    // Step: extract FDA nutrition data from file
    if (step === 'fda') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract ALL menu items from this FDA nutrition report. For each item extract: name, recipe_number, calories, protein, carbs (total carb), fat (total fat), saturated_fat, sodium, fiber (dietary fiber), sugar (total sugars), cholesterol, vitamin_a, vitamin_c, vitamin_d, calcium, iron, potassium. Treat "less than 1 gram" as 0.5 and "less than 5 milligrams" as 2. Return as JSON.`,
        file_urls: [payload.fileUrl],
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
    }

    // Step: generate descriptions for items missing them
    if (step === 'descriptions') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate brief, appetizing 1-sentence descriptions (15-25 words each) for these menu items. Return as JSON.\n\nItems:\n${payload.itemNames.map(n => `- ${n}`).join('\n')}`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });
      return Response.json({ items: result?.items || [] });
    }

    // Step: extract allergens from PDF
    if (step === 'allergens') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract allergen information from this PDF. For each menu item, extract: recipe_number, allergens (array), and dietary tags (array like Vegetarian, Vegan, Fit, Dairy Free, etc.). Return as structured JSON.`,
        file_urls: [payload.fileUrl],
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
      return Response.json({ items: result?.items || [] });
    }

    // Step: parse ingredients CSV
    if (step === 'ingredients') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are parsing a CSV file with menu ingredients. Extract ALL rows. For each row extract: recipe_number, ingredients, is_vegan, is_vegetarian, is_fit. Return ALL rows as JSON.\n\nCSV Data:\n${payload.csvText}`,
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
      return Response.json({ items: result?.items || [] });
    }

    // Step: generate missing ingredients
    if (step === 'genIngredients') {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate realistic ingredient lists for these menu items. Return as JSON.\n\nItems:\n${payload.itemNames.map(n => `- ${n}`).join('\n')}`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  ingredients: { type: "string" }
                }
              }
            }
          }
        }
      });
      return Response.json({ items: result?.items || [] });
    }

    return Response.json({ error: 'Unknown step: ' + step }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});