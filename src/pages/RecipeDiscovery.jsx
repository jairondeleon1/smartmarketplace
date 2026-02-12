import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Heart, Clock, Users, ChefHat, Star, X, Loader2, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CUISINES = ["All", "Italian", "Mexican", "Asian", "American", "Mediterranean", "Indian", "French", "Thai", "Greek", "Other"];
const MEAL_TYPES = ["All", "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const DIETARY_TAGS = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Keto", "Paleo", "Low-Carb"];
const COOKING_TIMES = ["All", "Under 15 min", "15-30 min", "30-60 min", "Over 60 min"];

const SAMPLE_RECIPES = [
  { id: 1, name: "Classic Margherita Pizza", description: "Traditional Italian pizza with fresh mozzarella and basil", cuisine_type: "Italian", meal_type: "Dinner", dietary_tags: ["Vegetarian"], cooking_time: 25, ingredients: ["Pizza dough", "Tomato sauce", "Mozzarella", "Basil", "Olive oil"], instructions: "Spread sauce on dough, add cheese, bake at 450°F for 12-15 minutes, top with fresh basil.", servings: 4, difficulty: "Easy", calories: 280, protein: 12 },
  { id: 2, name: "Chicken Tacos", description: "Flavorful Mexican tacos with seasoned chicken", cuisine_type: "Mexican", meal_type: "Dinner", dietary_tags: [], cooking_time: 20, ingredients: ["Chicken breast", "Taco seasoning", "Tortillas", "Lettuce", "Tomatoes", "Cheese"], instructions: "Cook seasoned chicken, warm tortillas, assemble with toppings.", servings: 4, difficulty: "Easy", calories: 320, protein: 28 },
  { id: 3, name: "Vegan Buddha Bowl", description: "Nutrient-packed bowl with quinoa and roasted vegetables", cuisine_type: "Mediterranean", meal_type: "Lunch", dietary_tags: ["Vegan", "Gluten-Free"], cooking_time: 40, ingredients: ["Quinoa", "Sweet potato", "Chickpeas", "Kale", "Tahini", "Lemon"], instructions: "Cook quinoa, roast vegetables, assemble bowl, drizzle with tahini dressing.", servings: 2, difficulty: "Medium", calories: 420, protein: 15 },
  { id: 4, name: "Pad Thai", description: "Classic Thai stir-fried noodles", cuisine_type: "Thai", meal_type: "Dinner", dietary_tags: [], cooking_time: 30, ingredients: ["Rice noodles", "Shrimp", "Eggs", "Bean sprouts", "Peanuts", "Tamarind sauce"], instructions: "Soak noodles, stir-fry ingredients, combine with sauce.", servings: 4, difficulty: "Medium", calories: 450, protein: 22 },
  { id: 5, name: "Greek Salad", description: "Fresh Mediterranean salad with feta cheese", cuisine_type: "Greek", meal_type: "Lunch", dietary_tags: ["Vegetarian", "Gluten-Free"], cooking_time: 10, ingredients: ["Tomatoes", "Cucumber", "Feta", "Olives", "Red onion", "Olive oil"], instructions: "Chop vegetables, combine with feta and olives, dress with olive oil and lemon.", servings: 4, difficulty: "Easy", calories: 180, protein: 6 },
];

export default function RecipeDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [mealTypeFilter, setMealTypeFilter] = useState('All');
  const [cookingTimeFilter, setCookingTimeFilter] = useState('All');
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const items = await base44.entities.Recipe.list();
      if (items.length === 0) {
        await base44.entities.Recipe.bulkCreate(SAMPLE_RECIPES);
        return SAMPLE_RECIPES;
      }
      return items;
    },
    initialData: SAMPLE_RECIPES,
  });

  const { data: userRecipes = [] } = useQuery({
    queryKey: ['userRecipes', user?.email],
    queryFn: () => base44.entities.UserRecipe.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ recipeId, isFavorite }) => {
      const existing = userRecipes.find(ur => ur.recipe_id === recipeId);
      if (existing) {
        await base44.entities.UserRecipe.update(existing.id, { is_favorite: !isFavorite });
      } else {
        await base44.entities.UserRecipe.create({ recipe_id: recipeId, user_email: user.email, is_favorite: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRecipes'] });
    }
  });

  const rateRecipeMutation = useMutation({
    mutationFn: async ({ recipeId, rating }) => {
      const existing = userRecipes.find(ur => ur.recipe_id === recipeId);
      if (existing) {
        await base44.entities.UserRecipe.update(existing.id, { rating });
      } else {
        await base44.entities.UserRecipe.create({ recipe_id: recipeId, user_email: user.email, rating });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRecipes'] });
    }
  });

  const toggleDietaryFilter = (tag) => {
    setDietaryFilters(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCuisine = cuisineFilter === 'All' || recipe.cuisine_type === cuisineFilter;
      const matchesMealType = mealTypeFilter === 'All' || recipe.meal_type === mealTypeFilter;
      
      const matchesCookingTime = cookingTimeFilter === 'All' || 
        (cookingTimeFilter === 'Under 15 min' && recipe.cooking_time < 15) ||
        (cookingTimeFilter === '15-30 min' && recipe.cooking_time >= 15 && recipe.cooking_time <= 30) ||
        (cookingTimeFilter === '30-60 min' && recipe.cooking_time > 30 && recipe.cooking_time <= 60) ||
        (cookingTimeFilter === 'Over 60 min' && recipe.cooking_time > 60);

      const matchesDietary = dietaryFilters.length === 0 || 
        dietaryFilters.every(tag => recipe.dietary_tags?.includes(tag));

      const matchesIngredient = !ingredientSearch || 
        recipe.ingredients?.some(ing => ing.toLowerCase().includes(ingredientSearch.toLowerCase()));

      return matchesSearch && matchesCuisine && matchesMealType && matchesCookingTime && matchesDietary && matchesIngredient;
    });
  }, [recipes, searchQuery, cuisineFilter, mealTypeFilter, cookingTimeFilter, dietaryFilters, ingredientSearch]);

  const getUserRecipe = (recipeId) => {
    return userRecipes.find(ur => ur.recipe_id === recipeId);
  };

  const RecipeCard = ({ recipe }) => {
    const userRecipe = getUserRecipe(recipe.id);
    const isFavorite = userRecipe?.is_favorite || false;
    const userRating = userRecipe?.rating || 0;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
        <div onClick={() => setSelectedRecipe(recipe)} className="p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-700 transition">{recipe.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{recipe.description}</p>
            </div>
            {user && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavoriteMutation.mutate({ recipeId: recipe.id, isFavorite }); }}
                className="p-2 hover:bg-red-50 rounded-full transition"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">{recipe.cuisine_type}</span>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">{recipe.meal_type}</span>
            {recipe.dietary_tags?.slice(0, 2).map(tag => (
              <span key={tag} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">{tag}</span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{recipe.cooking_time} min</span></div>
              <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{recipe.servings}</span></div>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={(e) => { e.stopPropagation(); if (user) rateRecipeMutation.mutate({ recipeId: recipe.id, rating: star }); }}
                  disabled={!user}
                  className="p-0.5 disabled:cursor-default"
                >
                  <Star className={`w-4 h-4 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RecipeDetailModal = ({ recipe, onClose }) => {
    if (!recipe) return null;
    const userRecipe = getUserRecipe(recipe.id);
    const userRating = userRecipe?.rating || 0;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="font-bold text-2xl">{recipe.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
            <p className="text-gray-600">{recipe.description}</p>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-5 h-5 text-teal-600" />
                <span className="font-bold">{recipe.cooking_time} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-5 h-5 text-teal-600" />
                <span className="font-bold">{recipe.servings} servings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ChefHat className="w-5 h-5 text-teal-600" />
                <span className="font-bold">{recipe.difficulty}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">{recipe.cuisine_type}</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">{recipe.meal_type}</span>
              {recipe.dietary_tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">{tag}</span>
              ))}
            </div>

            {user && (
              <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl">
                <span className="text-sm font-bold text-amber-900">Rate this recipe:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => rateRecipeMutation.mutate({ recipeId: recipe.id, rating: star })}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star className={`w-6 h-6 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-bold text-lg mb-3 text-slate-900">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients?.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2" />
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 text-slate-900">Instructions</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{recipe.instructions}</p>
            </div>

            {(recipe.calories > 0 || recipe.protein > 0) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                {recipe.calories > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-700">{recipe.calories}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Calories</div>
                  </div>
                )}
                {recipe.protein > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-700">{recipe.protein}g</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Protein</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-slate-900">Recipe Discovery</h1>
          <p className="text-gray-600">Find the perfect recipe for any occasion</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="h-12 px-6"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUISINES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Meal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={cookingTimeFilter} onValueChange={setCookingTimeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cooking Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {COOKING_TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by ingredient..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Dietary Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleDietaryFilter(tag)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
                        dietaryFilters.includes(tag)
                          ? 'bg-green-50 border-green-500 text-green-900'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-600 font-bold">{filteredRecipes.length} recipes found</p>
          {(dietaryFilters.length > 0 || cuisineFilter !== 'All' || mealTypeFilter !== 'All' || cookingTimeFilter !== 'All' || ingredientSearch) && (
            <Button
              variant="ghost"
              onClick={() => {
                setDietaryFilters([]);
                setCuisineFilter('All');
                setMealTypeFilter('All');
                setCookingTimeFilter('All');
                setIngredientSearch('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No recipes found matching your criteria</p>
          </div>
        )}
      </div>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
}