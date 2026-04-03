import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const station = formData.get('station');
    const fileType = formData.get('fileType');

    if (!file || !station || !fileType) {
      return Response.json({ error: 'Missing file, station, or fileType' }, { status: 400 });
    }

    // Upload file to storage
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    if (!uploadResult?.file_url) {
      return Response.json({ error: 'File upload failed' }, { status: 500 });
    }

    const fileUrl = uploadResult.file_url;

    // Build prompt and schema based on fileType
    let prompt = '';
    let schema = {};

    if (fileType === 'weekMenu') {
      prompt = `Extract EVERY food item listed in this menu document. For each item extract: name (string), recipe_number (the numeric code usually in parentheses, or empty string if not found), description (brief appetizing description, or empty string). Return ALL items found. Do not skip any item.`;
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
      prompt = `Extract nutrition facts for every menu item in this document. For each item extract: name, recipe_number, calories, protein (g), carbs (g), fat (g), saturated_fat (g), sodium (mg), fiber (g), sugar (g), cholesterol (mg). Return all items as JSON.`;
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
      prompt = `Extract allergen information for every menu item in this document. For each item extract: recipe_number, allergens (array of strings such as Milk, Wheat, Egg, Soy, Shellfish, Peanuts, Tree Nuts, Fish), tags (array of dietary tags such as Vegetarian, Vegan, Fit, Dairy Free, Gluten Free). Return all items as JSON.`;
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
    } else {
      return Response.json({ error: `Unknown fileType: ${fileType}` }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [fileUrl],
      response_json_schema: schema,
      model: 'gpt_5_mini'
    });

    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('uploadAndProcess error:', error);
    return Response.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
});