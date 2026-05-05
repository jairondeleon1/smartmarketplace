import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { frontImageUrl, ingredientsImageUrl, nutritionImageUrl, name, brand, category, barcode } = await req.json();

    // Use AI to extract all data from the photos
    const fileUrls = [frontImageUrl, ingredientsImageUrl, nutritionImageUrl].filter(Boolean);

    const extractionResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a food product analyst. Analyze the provided product images (front of pack, ingredients list, nutrition facts label).

Product name: ${name || 'Unknown'}
Brand: ${brand || 'Unknown'}
Category: ${category || 'Unknown'}

Extract ALL of the following from the images:
1. ingredients_text: the full ingredients list as a string
2. allergens: array of allergens detected (e.g. ["Milk", "Wheat", "Soy", "Egg", "Peanuts", "Tree Nuts", "Fish", "Shellfish", "Sesame"])
3. additives: array of food additive codes or names found in ingredients (e.g. ["E150d", "E471", "Carrageenan"])
4. calories: number (per serving or per 100g if serving not available)
5. protein: grams
6. carbs: grams (total carbohydrates)
7. fat: grams (total fat)
8. saturated_fat: grams
9. sodium: milligrams
10. fiber: grams
11. sugar: grams

Then compute a health_score from 0-100 based on these rules:
- Start at 100
- calories > 400 per 100g: -25; > 250: -10
- sugar > 22.5g per 100g: -25; > 12g: -10
- saturated_fat > 10g: -20; > 5g: -8
- sodium > 600mg per 100g: -20; > 300mg: -8
- fiber >= 3g: +5
- protein >= 5g: +5
- additives count > 3: -15; > 0: -5
- Clamp between 0 and 100

score_label: "Good" if >= 75, "Moderate" if >= 50, "Poor" if >= 25, "Bad" if < 25

ai_analysis: Write 2-3 sentences summarizing the product's health profile, highlighting main concerns and positives.

Return as JSON.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          ingredients_text: { type: "string" },
          allergens: { type: "array", items: { type: "string" } },
          additives: { type: "array", items: { type: "string" } },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          saturated_fat: { type: "number" },
          sodium: { type: "number" },
          fiber: { type: "number" },
          sugar: { type: "number" },
          health_score: { type: "number" },
          score_label: { type: "string" },
          ai_analysis: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, data: extractionResult });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});